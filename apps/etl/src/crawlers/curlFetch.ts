/**
 * HTTP client that delegates to the system `curl` binary.
 *
 * Why?  Node.js `fetch` (undici) presents a TLS fingerprint that SofaScore /
 * Cloudflare instantly recognises as non-browser traffic → 403.
 * The OS `curl` (Windows Schannel / Linux OpenSSL) passes the check because its
 * TLS handshake is not flagged.
 *
 * Using `child_process.execFile` (no shell) avoids PowerShell alias issues and
 * keeps arguments safe from injection.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../lib/logger.js";
import {
  selectProxyUrl,
  markProxyFailure,
  markProxySuccess,
} from "./proxyPool.js";

const execFileAsync = promisify(execFile);

/* Windows ships curl.exe in System32; Node child_process ignores PS aliases */
const CURL_BIN = process.platform === "win32" ? "curl.exe" : "curl";

/**
 * Default headers that mimic a real Chrome 133 browser session on
 * www.sofascore.com.  Includes the `sec-ch-ua` / `sec-fetch-*` family that
 * Cloudflare requires.
 */
const DEFAULT_HEADERS: Record<string, string> = {
  Accept: "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "sec-ch-ua":
    '"Chromium";v="133", "Not(A:Brand";v="99", "Google Chrome";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface CurlFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

/* ------------------------------------------------------------------ */
/*  Core: single request                                               */
/* ------------------------------------------------------------------ */

export async function curlFetchJson<T = unknown>(
  url: string,
  options?: {
    headers?: Record<string, string>;
    timeout?: number;
    proxyUrl?: string;
  },
): Promise<CurlFetchResult<T>> {
  const headers = { ...DEFAULT_HEADERS, ...options?.headers };
  const defaultTimeout =
    parseInt(process.env.CURL_TIMEOUT_SECONDS ?? "", 10) || 25;
  const timeout = options?.timeout ?? defaultTimeout;
  const proxyUrl = options?.proxyUrl;

  const args: string[] = [
    "-s", // silent
    "-S", // show errors in silent mode
    "-L", // follow redirects
    "--compressed", // handle gzip/br
    "--max-time",
    String(timeout),
    "--connect-timeout",
    "10",
    "-w",
    "\n__CURL_STATUS__%{http_code}", // append status code
  ];

  if (proxyUrl) {
    args.push("--proxy", proxyUrl);
  }

  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }

  args.push(url);

  try {
    const { stdout } = await execFileAsync(CURL_BIN, args, {
      timeout: (timeout + 10) * 1000,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
      windowsHide: true,
    });

    /* Parse status code from the sentinel appended by -w */
    const statusMatch = stdout.match(/__CURL_STATUS__(\d+)\s*$/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;
    const body = stdout.replace(/__CURL_STATUS__\d+\s*$/, "").trim();

    if (status >= 200 && status < 300) {
      try {
        const data = JSON.parse(body) as T;
        return { ok: true, status, data };
      } catch {
        logger.warn("curlFetch JSON parse error", {
          url,
          status,
          bodyLen: body.length,
        });
        return { ok: false, status, data: null };
      }
    }

    return { ok: false, status, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("curlFetch exec error", { url, error: message });
    return { ok: false, status: 0, data: null };
  }
}

/* ------------------------------------------------------------------ */
/*  With automatic proxy rotation + retry                              */
/* ------------------------------------------------------------------ */

function getDelayRange(
  minDefault: number,
  maxDefault: number,
  envPrefix: string,
): { min: number; max: number } {
  const minEnv = process.env[`${envPrefix}_MIN_MS`];
  const maxEnv = process.env[`${envPrefix}_MAX_MS`];
  const min = Math.max(0, parseInt(minEnv ?? "", 10) || minDefault);
  const max = Math.max(min, parseInt(maxEnv ?? "", 10) || maxDefault);
  return { min, max };
}

/** Randomised delay to avoid fixed-interval bot detection. */
function jitterDelay(): Promise<void> {
  const scale = Math.max(
    0,
    parseFloat(process.env.CURL_JITTER_SCALE ?? "1") || 1,
  );
  const { min, max } = getDelayRange(300, 1000, "CURL_JITTER");
  const scaledMin = Math.floor(min * scale);
  const scaledMax = Math.floor(max * scale);
  const span = Math.max(0, scaledMax - scaledMin);
  const ms = scaledMin + Math.floor(Math.random() * (span + 1));
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch JSON via curl with automatic proxy rotation and retry.
 * Drop-in replacement for the old `fetchJson()` used across the ETL.
 */
export async function curlFetchJsonWithRetry<T = unknown>(
  url: string,
  maxAttempts =
    parseInt(process.env.CURL_MAX_ATTEMPTS ?? "", 10) || 6,
  options?: { headers?: Record<string, string> },
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const proxyUrl = await selectProxyUrl();

    const result = await curlFetchJson<T>(url, {
      ...options,
      proxyUrl,
    });

    if (result.ok && result.data != null) {
      if (proxyUrl) markProxySuccess(proxyUrl);
      return result.data;
    }

    /* 404 = endpoint genuinely doesn't exist — no point retrying */
    if (result.status === 404) {
      if (proxyUrl) markProxySuccess(proxyUrl); // proxy itself works
      logger.debug("curlFetch 404 (not retrying)", { url });
      return null;
    }

    const isBlocked =
      result.status === 403 || result.status === 429 || result.status === 503;
    if (proxyUrl && (isBlocked || result.status === 0))
      markProxyFailure(proxyUrl);

    logger.warn("curlFetch non-OK", {
      url,
      status: result.status,
      attempt,
      maxAttempts,
      retrying: attempt < maxAttempts,
    });

    if (attempt >= maxAttempts) return null;

    await jitterDelay();
  }
  return null;
}
