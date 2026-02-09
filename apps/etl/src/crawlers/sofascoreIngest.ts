/**
 * SofaScore Ingest Pipeline
 *
 * Fetches match data, incidents (shots) and lineups from the SofaScore API
 * and persists them via Prisma.
 *
 * HTTP requests go through the system `curl` binary (via curlFetch) so the TLS
 * fingerprint matches a real browser.  Falls back to Playwright-based browser
 * scraping when curl fails.
 *
 * Optimizations:
 * - Concurrent match processing with configurable concurrency (SYNC_CONCURRENCY, default 3)
 * - Skips shotmap for not-started matches (no shot data available yet)
 * - Reduced inter-request delays while staying under bot-detection radar
 * - Summary stats logged at pipeline completion
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  discoverEuropeanMatchIds,
  discoverFinishedMatchIdsLastNDays,
} from "./discoverEuropeanMatches.js";
import {
  fetchShotmapViaBrowser,
  fetchMatchViaBrowser,
} from "./sofascoreBrowser.js";
import { fetchAndPersistLineups } from "./fetchLineups.js";
import { isAllowedTournament } from "../config/leagues.js";
import { logger } from "../lib/logger.js";
import { normalizeShotsFromSofaScore } from "../parsers/normalize.js";
import { curlFetchJsonWithRetry } from "./curlFetch.js";
import {
  getPrisma,
  upsertTeam,
  upsertPlayer,
  upsertMatch,
  attachMatchPlayer,
  insertShotEvents,
} from "../services/db.js";

const SHOTMAP_URL_TEMPLATE =
  "https://api.sofascore.com/api/v1/event/{matchId}/shotmap";
const MATCH_URL_TEMPLATE = "https://api.sofascore.com/api/v1/event/{matchId}";

/** Status code 100 = finished (SofaScore API). */
const STATUS_FINISHED = 100;
/** Status code 0 = not started. */
const STATUS_NOT_STARTED = 0;
/** Concurrency limit for parallel processing. */
const CONCURRENCY = Math.max(
  1,
  parseInt(process.env.SYNC_CONCURRENCY ?? "3", 10) || 3,
);

function getShotmapUrl(matchId: string): string {
  return SHOTMAP_URL_TEMPLATE.replace("{matchId}", matchId);
}

function getMatchUrl(matchId: string): string {
  return MATCH_URL_TEMPLATE.replace("{matchId}", matchId);
}

/** Randomised delay to avoid fixed-interval bot detection. */
function randomDelay(short = false): Promise<void> {
  const ms = short
    ? 200 + Math.floor(Math.random() * 400) // 200-600 ms (for DB-only ops)
    : 300 + Math.floor(Math.random() * 700); // 300-1000 ms (for API calls)
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/*  Concurrency helper                                                 */
/* ------------------------------------------------------------------ */

/**
 * Process items with a concurrency limit, executing `fn` on each.
 * Similar to p-limit but without extra dependency.
 */
async function mapConcurrent<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    },
  );
  await Promise.all(workers);
}

/* ------------------------------------------------------------------ */
/*  Match ID loading                                                   */
/* ------------------------------------------------------------------ */

async function loadMatchIds(): Promise<string[]> {
  const fromEnv = process.env.MATCH_IDS?.trim();
  if (fromEnv) {
    const ids = fromEnv
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return [...new Set(ids)];
  }

  const path = join(process.cwd(), "src", "seed", "matches.txt");
  try {
    const content = await readFile(path, "utf-8");
    const fromFile = content
      .split("\n")
      .map((line) => line.replace(/#.*/, "").trim())
      .filter(Boolean);
    if (fromFile.length > 0) return [...new Set(fromFile)];
  } catch {
    // ignore
  }

  // No MATCH_IDS or matches.txt — discover from tournament/season API
  logger.info("Discovering European match IDs from tournament/season API…");
  const discovered = await discoverEuropeanMatchIds();
  if (discovered.length > 0) {
    logger.info("Discovered European match IDs", { count: discovered.length });
  }
  return [...new Set(discovered)];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function readScore(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value))
    return Math.trunc(value);
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidate = obj.current ?? obj.display ?? obj.value;
    return readScore(candidate);
  }
  return null;
}

function coerceInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value))
    return Math.trunc(value);
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Pipeline statistics                                                */
/* ------------------------------------------------------------------ */

interface PipelineStats {
  matchesDiscovered: number;
  matchesIngested: number;
  matchesFiltered: number;
  lineupsIngested: number;
  shotsIngested: number;
  shotmapsSkipped: number;
  phase2Matches: number;
  phase2Shots: number;
  errors: number;
  startTime: number;
}

function createStats(): PipelineStats {
  return {
    matchesDiscovered: 0,
    matchesIngested: 0,
    matchesFiltered: 0,
    lineupsIngested: 0,
    shotsIngested: 0,
    shotmapsSkipped: 0,
    phase2Matches: 0,
    phase2Shots: 0,
    errors: 0,
    startTime: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/*  Phase 1-A : Ingest match metadata + lineups                       */
/* ------------------------------------------------------------------ */

async function ingestMatchData(
  matchId: string,
  allowedMatchIds: Set<string>,
  matchTeams: Map<string, { homeTeamId: string; awayTeamId: string }>,
  matchStatuses: Map<string, number | null>,
  stats: PipelineStats,
): Promise<void> {
  let payload: unknown =
    (await curlFetchJsonWithRetry(getMatchUrl(matchId))) ?? null;

  if (payload == null) {
    payload = await fetchMatchViaBrowser(matchId);
  }
  if (payload == null) return;

  try {
    const data = payload as Record<string, unknown>;
    const event = data.event ?? data;
    const o =
      typeof event === "object" && event !== null
        ? (event as Record<string, unknown>)
        : {};

    const tournamentObj = o.tournament as Record<string, unknown> | undefined;
    const tournamentName =
      tournamentObj && typeof tournamentObj.name === "string"
        ? tournamentObj.name
        : undefined;

    if (!isAllowedTournament(tournamentName)) {
      stats.matchesFiltered++;
      return;
    }

    allowedMatchIds.add(matchId);
    matchTeams.set(matchId, { homeTeamId: "pending", awayTeamId: "pending" });

    const homeRaw = o.homeTeam ?? o.homeTeamId;
    const awayRaw = o.awayTeam ?? o.awayTeamId;
    const homeTeam =
      typeof homeRaw === "object" && homeRaw !== null
        ? (homeRaw as Record<string, unknown>)
        : null;
    const awayTeam =
      typeof awayRaw === "object" && awayRaw !== null
        ? (awayRaw as Record<string, unknown>)
        : null;

    const homeId =
      homeTeam && typeof homeTeam.id !== "undefined"
        ? String(homeTeam.id)
        : typeof o.homeTeamId === "number" || typeof o.homeTeamId === "string"
          ? String(o.homeTeamId)
          : `home-${matchId}`;
    const awayId =
      awayTeam && typeof awayTeam.id !== "undefined"
        ? String(awayTeam.id)
        : typeof o.awayTeamId === "number" || typeof o.awayTeamId === "string"
          ? String(o.awayTeamId)
          : `away-${matchId}`;
    const homeName =
      homeTeam && typeof homeTeam.name === "string"
        ? homeTeam.name
        : `Team ${matchId} (home)`;
    const awayName =
      awayTeam && typeof awayTeam.name === "string"
        ? awayTeam.name
        : `Team ${matchId} (away)`;

    const teamImageUrl = (
      team: Record<string, unknown> | null,
    ): string | null => {
      if (!team) return null;
      const url =
        team.imageUrl ??
        team.logo ??
        (team.team as Record<string, unknown> | undefined)?.imageUrl ??
        (team.team as Record<string, unknown> | undefined)?.logo;
      return typeof url === "string" && url.length > 0 ? url : null;
    };

    const startTimeStr = (o.startTimestamp ?? o.startTime ?? o.start) as
      | string
      | number
      | undefined;
    const startTime =
      startTimeStr != null
        ? new Date(
            typeof startTimeStr === "number"
              ? startTimeStr * 1000
              : startTimeStr,
          )
        : new Date(0);

    const statusObj =
      (o.status as Record<string, unknown> | undefined) ?? undefined;
    const statusCode = coerceInt(statusObj?.code ?? statusObj?.id);
    const statusType =
      typeof statusObj?.type === "string" ? statusObj.type : undefined;
    const homeScore = readScore(o.homeScore);
    const awayScore = readScore(o.awayScore);
    const minute = coerceInt(o.time ?? o.currentMinute ?? o.minute);

    // Track status for shotmap decision
    matchStatuses.set(matchId, statusCode);

    await upsertTeam({
      id: homeId,
      name: homeName,
      imageUrl: teamImageUrl(homeTeam),
    });
    await upsertTeam({
      id: awayId,
      name: awayName,
      imageUrl: teamImageUrl(awayTeam),
    });

    matchTeams.set(matchId, { homeTeamId: homeId, awayTeamId: awayId });
    await upsertMatch({
      id: matchId,
      startTime,
      homeTeamId: homeId,
      awayTeamId: awayId,
      tournament: (o.tournament as Record<string, unknown>)?.name as
        | string
        | undefined,
      season: (o.season as Record<string, unknown>)?.name as string | undefined,
      statusCode,
      statusType,
      homeScore,
      awayScore,
      minute,
    });

    stats.matchesIngested++;

    await randomDelay();
    await fetchAndPersistLineups(matchId, homeId, awayId);
    stats.lineupsIngested++;
  } catch (err) {
    stats.errors++;
    logger.warn("Match handler error", {
      matchId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Phase 1-B : Ingest shotmap (shots with xG)                        */
/* ------------------------------------------------------------------ */

async function ingestShotmap(
  matchId: string,
  homeTeamId?: string,
  awayTeamId?: string,
): Promise<number> {
  let payload: unknown =
    (await curlFetchJsonWithRetry(getShotmapUrl(matchId))) ?? null;

  if (payload == null) {
    payload = await fetchShotmapViaBrowser(matchId);
  }
  if (payload == null) return 0;

  try {
    const allShots = normalizeShotsFromSofaScore(
      matchId,
      payload,
      homeTeamId,
      awayTeamId,
    );
    const shots = allShots.filter(
      (s) => s.playerId.length > 0 && s.teamId.length > 0,
    );
    if (shots.length === 0) return 0;

    const seenPlayers = new Set<string>();
    const playerNames = new Map<string, string>();
    const playerTeams = new Map<string, string>();
    const seenMatchPlayers = new Set<string>();
    for (const s of shots) {
      seenPlayers.add(s.playerId);
      // Prefer actual player name over numeric ID
      if (s.playerName && !playerNames.has(s.playerId)) {
        playerNames.set(s.playerId, s.playerName);
      }
      // Track which team this player belongs to
      if (s.teamId && !playerTeams.has(s.playerId)) {
        playerTeams.set(s.playerId, s.teamId);
      }
      seenMatchPlayers.add(`${s.matchId}:${s.playerId}`);
    }
    await Promise.all(
      [...seenPlayers].map((playerId) =>
        upsertPlayer({
          id: playerId,
          name: playerNames.get(playerId) ?? playerId,
          currentTeamId: playerTeams.get(playerId) ?? undefined,
        }),
      ),
    );
    await Promise.all(
      [...seenMatchPlayers].map((key) => {
        const colon = key.indexOf(":");
        const m = colon >= 0 ? key.slice(0, colon) : key;
        const p = colon >= 0 ? key.slice(colon + 1) : "";
        const s = shots.find((x) => x.matchId === m && x.playerId === p)!;
        return attachMatchPlayer(s.matchId, s.playerId, s.teamId);
      }),
    );
    await insertShotEvents(shots);
    logger.info("Ingested shots", { matchId, count: shots.length });
    return shots.length;
  } catch (err) {
    logger.warn("Shotmap handler error", {
      matchId,
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

export async function runSofaScoreIngest(): Promise<void> {
  const stats = createStats();
  const matchIds = await loadMatchIds();
  stats.matchesDiscovered = matchIds.length;

  if (matchIds.length === 0) {
    logger.warn(
      "No match IDs. Configure MATCH_IDS, src/seed/matches.txt, or ensure SYNC_TOURNAMENT_IDS/European discovery returns matches.",
    );
    return;
  }

  const prisma = getPrisma();
  const ingestRun = await prisma.etlIngestRun.create({
    data: { status: "started" },
  });

  const allowedMatchIds = new Set<string>();
  const matchTeams = new Map<
    string,
    { homeTeamId: string; awayTeamId: string }
  >();
  const matchStatuses = new Map<string, number | null>();

  try {
    /* ---- Phase 1-A: match metadata + lineups ---- */
    logger.info("Phase 1-A: ingesting match data + lineups", {
      count: matchIds.length,
      concurrency: CONCURRENCY,
    });

    await mapConcurrent(matchIds, CONCURRENCY, async (matchId) => {
      await randomDelay();
      await ingestMatchData(
        matchId,
        allowedMatchIds,
        matchTeams,
        matchStatuses,
        stats,
      );
    });

    if (allowedMatchIds.size === 0) {
      logger.warn("No matches passed tournament filter");
      await prisma.etlIngestRun.update({
        where: { id: ingestRun.id },
        data: { finishedAt: new Date(), status: "success" },
      });
      return;
    }

    /* ---- Phase 1-B: shotmap (only for finished/in-progress matches) ---- */
    const shotmapIds: string[] = [];
    const skippedIds: string[] = [];

    for (const matchId of allowedMatchIds) {
      const status = matchStatuses.get(matchId);
      // Skip shotmap for not-started matches — they have no shot data
      if (status === STATUS_NOT_STARTED) {
        skippedIds.push(matchId);
      } else {
        shotmapIds.push(matchId);
      }
    }

    stats.shotmapsSkipped = skippedIds.length;

    if (skippedIds.length > 0) {
      logger.info("Phase 1-B: skipping shotmap for not-started matches", {
        skipped: skippedIds.length,
      });
    }

    if (shotmapIds.length > 0) {
      logger.info("Phase 1-B: ingesting shotmaps", {
        count: shotmapIds.length,
      });

      await mapConcurrent(shotmapIds, CONCURRENCY, async (matchId) => {
        await randomDelay();
        const teams = matchTeams.get(matchId);
        const count = await ingestShotmap(
          matchId,
          teams?.homeTeamId,
          teams?.awayTeamId,
        );
        stats.shotsIngested += count;
      });
    }

    /* ---- Phase 2: historical matches (last N days) ---- */
    const phase2Ids = (await discoverFinishedMatchIdsLastNDays()).filter(
      (id) => !allowedMatchIds.has(id),
    );
    if (phase2Ids.length > 0) {
      stats.phase2Matches = phase2Ids.length;
      logger.info("Phase 2: ingesting last-N-days matches for player history", {
        count: phase2Ids.length,
        concurrency: CONCURRENCY,
      });

      await mapConcurrent(phase2Ids, CONCURRENCY, async (matchId) => {
        await randomDelay();
        await ingestMatchData(
          matchId,
          allowedMatchIds,
          matchTeams,
          matchStatuses,
          stats,
        );
      });

      const phase2Allowed = phase2Ids.filter((id) => allowedMatchIds.has(id));
      if (phase2Allowed.length > 0) {
        // Phase 2 only has finished matches — all get shotmaps
        await mapConcurrent(phase2Allowed, CONCURRENCY, async (matchId) => {
          await randomDelay();
          const teams = matchTeams.get(matchId);
          const count = await ingestShotmap(
            matchId,
            teams?.homeTeamId,
            teams?.awayTeamId,
          );
          stats.phase2Shots += count;
        });
      }
    }

    /* ---- Finalise ---- */
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
    await prisma.etlIngestRun.update({
      where: { id: ingestRun.id },
      data: { finishedAt: new Date(), status: "success" },
    });

    logger.info("Ingest finished", {
      runId: ingestRun.id,
      elapsed: `${elapsed}s`,
      discovered: stats.matchesDiscovered,
      ingested: stats.matchesIngested,
      filtered: stats.matchesFiltered,
      lineups: stats.lineupsIngested,
      shots: stats.shotsIngested,
      shotmapsSkipped: stats.shotmapsSkipped,
      phase2Matches: stats.phase2Matches,
      phase2Shots: stats.phase2Shots,
      errors: stats.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    try {
      await prisma.etlIngestRun.update({
        where: { id: ingestRun.id },
        data: {
          finishedAt: new Date(),
          status: "failed",
          error: stack ?? message,
        },
      });
    } catch (updateErr) {
      logger.warn("Could not update ingestRun status to failed", {
        runId: ingestRun.id,
        error: updateErr,
      });
    }
    logger.error("Ingest failed", { runId: ingestRun.id, error: message });
    throw err;
  }
}
