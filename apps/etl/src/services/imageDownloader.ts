/**
 * Image Downloader Service
 *
 * Downloads images from SofaScore via curl (same TLS-fingerprint trick used
 * for JSON data) and persists them as bytea in the public.ImageCache table.
 *
 * Only runs during ETL sync (GitHub Actions / local) — NOT on Vercel.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { prisma } from "@finalizabot/shared";
import { logger } from "../lib/logger.js";
import {
  selectProxyUrl,
  markProxyFailure,
  markProxySuccess,
} from "../crawlers/proxyPool.js";

const execFileAsync = promisify(execFile);
const CURL_BIN = process.platform === "win32" ? "curl.exe" : "curl";

const DOWNLOAD_HEADERS: Record<string, string> = {
  Accept: "image/png,image/jpeg,image/svg+xml,image/*,*/*",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
};

// Configurações de concorrência
const IMAGE_DOWNLOAD_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.IMAGE_DOWNLOAD_CONCURRENCY ?? "5", 10),
);
logger.info(`[ImageDL] Concorrência configurada: ${IMAGE_DOWNLOAD_CONCURRENCY}`);

/* ------------------------------------------------------------------ */
/*  Binary download via curl                                           */
/* ------------------------------------------------------------------ */

interface DownloadResult {
  data: Buffer;
  contentType: string;
}

/**
 * Download binary data from a URL using curl, saving to a temp file.
 * Returns the raw buffer + detected content-type, or null on failure.
 */
async function curlFetchBinary(
  url: string,
  maxAttempts = 3,
): Promise<DownloadResult | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tmpFile = join(
      tmpdir(),
      `fb-img-${randomBytes(6).toString("hex")}`,
    );
    const headerFile = join(
      tmpdir(),
      `fb-hdr-${randomBytes(6).toString("hex")}`,
    );

    const proxyUrl = await selectProxyUrl();

    const args: string[] = [
      "-s",
      "-S",
      "-L",
      "--compressed",
      "--max-time",
      "15",
      "--connect-timeout",
      "10",
      "-o",
      tmpFile,
      "-D",
      headerFile,
    ];

    if (proxyUrl) {
      args.push("--proxy", proxyUrl);
    }

    for (const [key, value] of Object.entries(DOWNLOAD_HEADERS)) {
      args.push("-H", `${key}: ${value}`);
    }

    args.push(url);

    try {
      await execFileAsync(CURL_BIN, args, {
        timeout: 30_000,
        windowsHide: true,
      });

      // Read downloaded file
      const data = await readFile(tmpFile);

      // Parse headers to get content-type
      let contentType = "image/png";
      try {
        const headers = await readFile(headerFile, "utf-8");
        const ctMatch = headers.match(/content-type:\s*([^\r\n;]+)/i);
        if (ctMatch) contentType = ctMatch[1].trim();

        // Check for HTTP error status
        const statusMatch = headers.match(/HTTP\/[\d.]+\s+(\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
        if (status >= 400) {
          if (proxyUrl && (status === 403 || status === 429 || status === 503))
            markProxyFailure(proxyUrl);
          throw new Error(`HTTP ${status}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("HTTP")) throw e;
        // Header parse failure is non-fatal, use default content-type
      }

      if (data.length === 0) {
        throw new Error("Empty response body");
      }

      if (proxyUrl) markProxySuccess(proxyUrl);

      // Cleanup temp files
      await cleanup(tmpFile, headerFile);

      return { data, contentType };
    } catch (err) {
      await cleanup(tmpFile, headerFile);

      const msg = err instanceof Error ? err.message : String(err);
      if (proxyUrl) markProxyFailure(proxyUrl);
      logger.warn(`[ImageDL] attempt ${attempt}/${maxAttempts} failed: ${msg}`, {
        url,
      });

      if (attempt >= maxAttempts) return null;

      // jitter delay before retry
      await new Promise((r) =>
        setTimeout(r, 300 + Math.floor(Math.random() * 700)),
      );
    }
  }
  return null;
}

async function cleanup(...files: string[]): Promise<void> {
  for (const f of files) {
    try {
      await unlink(f);
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Download + Cache in DB                                             */
/* ------------------------------------------------------------------ */

/**
 * Downloads an image from `sourceUrl`, stores it in ImageCache, and
 * returns the cache record's `id`.  If already cached, returns existing id.
 */
export async function downloadAndCacheImage(
  sourceUrl: string,
): Promise<string | null> {
  if (!sourceUrl) return null;

  // Check if already cached
  const existing = await prisma.imageCache.findUnique({
    where: { sourceUrl },
    select: { id: true },
  });

  if (existing) return existing.id;

  // Download
  const result = await curlFetchBinary(sourceUrl);
  if (!result) {
    logger.warn(`[ImageDL] Failed to download: ${sourceUrl}`);
    return null;
  }

  // Store in DB
  try {
    const imageData = new Uint8Array(result.data) as Uint8Array<ArrayBuffer>;
    const cached = await prisma.imageCache.upsert({
      where: { sourceUrl },
      create: {
        sourceUrl,
        contentType: result.contentType,
        data: imageData,
      },
      update: {
        contentType: result.contentType,
        data: imageData,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    return cached.id;
  } catch (err) {
    logger.warn(
      `[ImageDL] DB store failed for ${sourceUrl}: ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Batch download helpers                                             */
/* ------------------------------------------------------------------ */

/**
 * Downloads multiple images with concurrency control.
 * Returns a Map of sourceUrl → imageId for successfully cached images.
 */
export async function downloadImages(
  urls: string[],
  concurrency = 5,
): Promise<Map<string, string>> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const results = new Map<string, string>();

  let completed = 0;
  const total = uniqueUrls.length;

  // Concurrency-limited processing
  let idx = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, uniqueUrls.length) },
    async () => {
      while (idx < uniqueUrls.length) {
        const i = idx++;
        const url = uniqueUrls[i];
        const imageId = await downloadAndCacheImage(url);
        if (imageId) {
          results.set(url, imageId);
        }
        completed++;
        if (completed % 20 === 0 || completed === total) {
          logger.info(`[ImageDL] Progress: ${completed}/${total}`);
        }
      }
    },
  );

  await Promise.all(workers);

  logger.info(
    `[ImageDL] Batch complete: ${results.size}/${total} images cached`,
  );
  return results;
}

/**
 * Convenience: download team and player images for all current matches/players.
 * Designed to be called after bridge sync to backfill image IDs.
 */
export async function syncAllImages(): Promise<void> {
  logger.info("[ImageDL] Starting full image sync...");

  // 1. Collect all image URLs from Matches
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      homeTeamImageUrl: true,
      awayTeamImageUrl: true,
      homeTeamSofascoreId: true,
      awayTeamSofascoreId: true,
      homeTeamImageId: true,
      awayTeamImageId: true,
    },
  });

  const matchImageUrls: string[] = [];
  for (const m of matches) {
    if (!m.homeTeamImageId) {
      const url =
        m.homeTeamImageUrl ??
        (m.homeTeamSofascoreId
          ? `https://api.sofascore.com/api/v1/team/${m.homeTeamSofascoreId}/image`
          : null);
      if (url) matchImageUrls.push(url);
    }
    if (!m.awayTeamImageId) {
      const url =
        m.awayTeamImageUrl ??
        (m.awayTeamSofascoreId
          ? `https://api.sofascore.com/api/v1/team/${m.awayTeamSofascoreId}/image`
          : null);
      if (url) matchImageUrls.push(url);
    }
  }

  // 2. Collect all image URLs from Players
  const players = await prisma.player.findMany({
    select: {
      id: true,
      sofascoreId: true,
      imageUrl: true,
      teamImageUrl: true,
      imageId: true,
      teamImageId: true,
    },
  });

  const playerImageUrls: string[] = [];
  for (const p of players) {
    if (!p.imageId) {
      const url =
        p.imageUrl ??
        `https://api.sofascore.com/api/v1/player/${p.sofascoreId}/image`;
      playerImageUrls.push(url);
    }
    if (!p.teamImageId && p.teamImageUrl) {
      playerImageUrls.push(p.teamImageUrl);
    }
  }

  // 3. Download all images
  const allUrls = [...matchImageUrls, ...playerImageUrls];
  logger.info(
    `[ImageDL] Starting image download`,
    {
      totalUrls: allUrls.length,
      matchUrls: matchImageUrls.length,
      playerUrls: playerImageUrls.length,
      concurrency: IMAGE_DOWNLOAD_CONCURRENCY,
    }
  );

  const imageMap = await downloadImages(allUrls, IMAGE_DOWNLOAD_CONCURRENCY);

  // 4. Update Match records with image IDs
  let matchUpdates = 0;
  for (const m of matches) {
    const homeUrl =
      m.homeTeamImageUrl ??
      (m.homeTeamSofascoreId
        ? `https://api.sofascore.com/api/v1/team/${m.homeTeamSofascoreId}/image`
        : null);
    const awayUrl =
      m.awayTeamImageUrl ??
      (m.awayTeamSofascoreId
        ? `https://api.sofascore.com/api/v1/team/${m.awayTeamSofascoreId}/image`
        : null);

    const homeImageId = homeUrl ? imageMap.get(homeUrl) ?? null : null;
    const awayImageId = awayUrl ? imageMap.get(awayUrl) ?? null : null;

    if (
      (homeImageId && homeImageId !== m.homeTeamImageId) ||
      (awayImageId && awayImageId !== m.awayTeamImageId)
    ) {
      await prisma.match.update({
        where: { id: m.id },
        data: {
          ...(homeImageId ? { homeTeamImageId: homeImageId } : {}),
          ...(awayImageId ? { awayTeamImageId: awayImageId } : {}),
        },
      });
      matchUpdates++;
    }
  }

  // 5. Update Player records with image IDs
  let playerUpdates = 0;
  for (const p of players) {
    const playerUrl =
      p.imageUrl ??
      `https://api.sofascore.com/api/v1/player/${p.sofascoreId}/image`;
    const teamUrl = p.teamImageUrl ?? null;

    const playerImageId = imageMap.get(playerUrl) ?? null;
    const teamImageId = teamUrl ? imageMap.get(teamUrl) ?? null : null;

    if (
      (playerImageId && playerImageId !== p.imageId) ||
      (teamImageId && teamImageId !== p.teamImageId)
    ) {
      await prisma.player.update({
        where: { id: p.id },
        data: {
          ...(playerImageId ? { imageId: playerImageId } : {}),
          ...(teamImageId ? { teamImageId: teamImageId } : {}),
        },
      });
      playerUpdates++;
    }
  }

  // Calcular taxa de sucesso
  const successCount = imageMap.size;
  const totalCount = allUrls.length;
  const failureCount = totalCount - successCount;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  logger.info(
    `[ImageDL] Image download complete`,
    {
      total: totalCount,
      success: successCount,
      failed: failureCount,
      successRate: `${successRate.toFixed(1)}%`,
    }
  );

  if (successRate < 80) {
    logger.warn(
      `[ImageDL] ⚠️  Taxa de sucesso de imagens baixa (${successRate.toFixed(1)}%) - verificar proxies e network`
    );
  }

  logger.info(
    `[ImageDL] Sync complete: ${matchUpdates} matches + ${playerUpdates} players updated`,
  );
}
