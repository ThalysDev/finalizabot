import { APIRequestContext, chromium, Page } from "playwright";
import { logger } from "../lib/logger.js";
import {
  markProxyFailure,
  markProxySuccess,
  selectProxyUrl,
  toPlaywrightProxy,
} from "./proxyPool.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

const SCHEDULE_URLS = [
  (date: string) => `https://www.sofascore.com/football/${date}`,
  (date: string) => `https://www.sofascore.com/football?date=${date}`,
];

/**
 * Stealth launch args — hides Playwright/automation signals from Cloudflare.
 */
const STEALTH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--disable-features=IsolateOrigins,site-per-process",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-component-extensions-with-background-pages",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-hang-monitor",
  "--disable-popup-blocking",
  "--disable-prompt-on-repost",
  "--metrics-recording-only",
  "--no-sandbox",
  "--window-size=1920,1080",
];

/**
 * Script injected before any page script runs.
 * Patches the most common automation-detection signals.
 */
const STEALTH_INIT_SCRIPT = `
  // Hide webdriver flag
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

  // Chrome runtime stub
  if (!window.chrome) {
    window.chrome = { runtime: {}, csi: function(){}, loadTimes: function(){} };
  }

  // Permissions query patch
  const _query = window.navigator.permissions?.query?.bind(window.navigator.permissions);
  if (_query) {
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : _query(params);
  }

  // Languages
  Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });

  // Plugins (non-empty)
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5].map(() => ({ name: 'Plugin', filename: 'plugin.dll' })),
  });
`;

async function withBrowser<T>(
  task: (page: Page, request: APIRequestContext) => Promise<T | null>,
): Promise<T | null> {
  const proxyUrl = await selectProxyUrl();
  const proxy = proxyUrl ? toPlaywrightProxy(proxyUrl) : undefined;
  const browser = await chromium.launch({
    headless: true,
    args: STEALTH_ARGS,
    proxy,
  });
  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      extraHTTPHeaders: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "sec-ch-ua":
          '"Chromium";v="133", "Not(A:Brand";v="99", "Google Chrome";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
    });

    /* Inject stealth patches before any page script */
    await context.addInitScript(STEALTH_INIT_SCRIPT);

    const page = await context.newPage();
    /* Block heavy resources but keep stylesheets to reduce fingerprinting */
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "font" || type === "media") {
        route.abort();
        return;
      }
      route.continue();
    });

    const result = await task(page, context.request);
    if (proxyUrl) {
      if (result != null) markProxySuccess(proxyUrl);
      else markProxyFailure(proxyUrl);
    }
    return result;
  } catch (err) {
    if (proxyUrl) markProxyFailure(proxyUrl);
    logger.warn("Browser fetch error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  } finally {
    await browser.close();
  }
}

async function browserFetchJson(
  request: APIRequestContext,
  url: string,
): Promise<{ ok: boolean; status?: number; data?: unknown }> {
  try {
    const res = await request.get(url, {
      headers: {
        Accept: "application/json",
        Origin: "https://www.sofascore.com",
        Referer: "https://www.sofascore.com/",
        "User-Agent": USER_AGENT,
        "sec-ch-ua":
          '"Chromium";v="133", "Not(A:Brand";v="99", "Google Chrome";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      timeout: 20_000,
    });
    const status = res.status();
    if (!res.ok()) return { ok: false, status };
    const data = await res.json();
    return { ok: true, status, data };
  } catch (error) {
    return { ok: false, status: 0, data: null };
  }
}

export async function fetchScheduledEventsViaBrowser(
  date: string,
): Promise<unknown | null> {
  const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
  return withBrowser(async (page, request) => {
    await page.goto("https://www.sofascore.com/", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const response = await browserFetchJson(request, url);
    if (!response.ok) {
      logger.warn("Browser scheduled-events non-OK", {
        url,
        status: response.status,
      });
      return null;
    }
    return response.data ?? null;
  });
}

export async function fetchScheduleIdsFromHtml(
  date: string,
): Promise<string[]> {
  return withBrowser(async (page) => {
    for (const makeUrl of SCHEDULE_URLS) {
      const url = makeUrl(date);
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      try {
        await page.waitForFunction(
          () =>
            (window as any).__INITIAL_STATE__ ||
            (window as any).__NEXT_DATA__ ||
            (window as any).__APOLLO_STATE__,
          { timeout: 5_000 },
        );
      } catch {
        // ignore
      }
      const runtimeState = await page
        .evaluate(() =>
          (window as any).__INITIAL_STATE__ ||
          (window as any).__NEXT_DATA__ ||
          (window as any).__APOLLO_STATE__ ||
          null,
        )
        .catch(() => null);
      const runtimeIds = extractEventIdsFromState(runtimeState);
      if (runtimeIds.length > 0) {
        logger.info("Schedule IDs from runtime state", {
          date,
          url,
          count: runtimeIds.length,
        });
        return runtimeIds;
      }
      try {
        await page.waitForSelector("[data-event-id]", { timeout: 5_000 });
      } catch {
        // ignore
      }
      const domIds = await page
        .$$eval("[data-event-id]", (nodes) =>
          nodes
            .map((n) => n.getAttribute("data-event-id"))
            .filter((v): v is string => typeof v === "string" && v.length > 0),
        )
        .catch(() => [] as string[]);
      if (domIds.length > 0) {
        logger.info("Schedule IDs from DOM", {
          date,
          url,
          count: domIds.length,
        });
        return domIds;
      }
      const html = await page.content();
      const ids = extractEventIdsFromHtml(html);
      logger.info("Schedule IDs from HTML", { date, url, count: ids.length });
      if (ids.length > 0) return ids;
    }
    return [];
  }).then((ids) => ids ?? []);
}

export async function fetchMatchViaBrowser(
  matchId: string,
): Promise<unknown | null> {
  const url = `https://api.sofascore.com/api/v1/event/${matchId}`;
  return withBrowser(async (page, request) => {
    await page.goto(`https://www.sofascore.com/event/${matchId}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const response = await browserFetchJson(request, url);
    if (!response.ok) {
      logger.warn("Browser match non-OK", { matchId, status: response.status });
      const html = await page.content();
      const embedded = extractEmbeddedState(html);
      const event = findEventObject(embedded, matchId);
      return event ?? null;
    }
    return response.data ?? null;
  });
}

export async function fetchIncidentsViaBrowser(
  matchId: string,
): Promise<unknown | null> {
  return fetchShotmapViaBrowser(matchId);
}

/**
 * Fetch shotmap data via Playwright browser.
 * Uses the `/shotmap` endpoint (shots with xG, coordinates).
 */
export async function fetchShotmapViaBrowser(
  matchId: string,
): Promise<unknown | null> {
  const url = `https://api.sofascore.com/api/v1/event/${matchId}/shotmap`;
  return withBrowser(async (page, request) => {
    await page.goto(`https://www.sofascore.com/event/${matchId}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const response = await browserFetchJson(request, url);
    if (!response.ok) {
      logger.warn("Browser shotmap non-OK", {
        matchId,
        status: response.status,
      });
      const html = await page.content();
      const embedded = extractEmbeddedState(html);
      const shotmap = findByKey(embedded, "shotmap");
      return shotmap ?? null;
    }
    return response.data ?? null;
  });
}

export async function fetchLineupsViaBrowser(
  matchId: string,
): Promise<unknown | null> {
  const url = `https://api.sofascore.com/api/v1/event/${matchId}/lineups`;
  return withBrowser(async (page, request) => {
    await page.goto(`https://www.sofascore.com/event/${matchId}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const response = await browserFetchJson(request, url);
    if (!response.ok) {
      logger.warn("Browser lineups non-OK", {
        matchId,
        status: response.status,
      });
      const html = await page.content();
      const embedded = extractEmbeddedState(html);
      const lineups = findByKey(embedded, "lineups");
      return lineups ?? null;
    }
    return response.data ?? null;
  });
}

function extractEventIdsFromHtml(html: string): string[] {
  const ids = new Set<string>();
  const patterns = [
    /data-event-id=["'](\d+)["']/g,
    /event\/(\d+)/g,
    /"eventId":(\d+)/g,
    /"event":\{"id":(\d+)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) ids.add(match[1]);
    }
  }
  return [...ids];
}

function extractEventIdsFromState(state: unknown): string[] {
  const ids = new Set<string>();
  collectEventIds(state, ids);
  return [...ids];
}

function collectEventIds(value: unknown, ids: Set<string>): void {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) collectEventIds(item, ids);
    return;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const hasTeams = obj.homeTeam != null && obj.awayTeam != null;
    const hasTime = obj.startTimestamp != null || obj.startTime != null;
    const id = obj.id ?? (obj.event as Record<string, unknown> | undefined)?.id;
    if (hasTeams && hasTime && (typeof id === "number" || typeof id === "string")) {
      ids.add(String(id));
    }
    for (const key of Object.keys(obj)) {
      collectEventIds(obj[key], ids);
    }
  }
}

function extractEmbeddedState(html: string): unknown {
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (nextDataMatch?.[1]) {
    try {
      return JSON.parse(nextDataMatch[1]);
    } catch {
      // ignore
    }
  }
  const initialStateMatch = html.match(
    /__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;\s*<\/script>/,
  );
  if (initialStateMatch?.[1]) {
    try {
      return JSON.parse(initialStateMatch[1]);
    } catch {
      // ignore
    }
  }
  const preloadedMatch = html.match(
    /__PRELOADED_STATE__\s*=\s*({[\s\S]*?})\s*;\s*<\/script>/,
  );
  if (preloadedMatch?.[1]) {
    try {
      return JSON.parse(preloadedMatch[1]);
    } catch {
      // ignore
    }
  }
  return null;
}

function findEventObject(
  value: unknown,
  matchId: string,
): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const id = obj.id ?? (obj.event as Record<string, unknown> | undefined)?.id;
    const idStr = typeof id === "number" || typeof id === "string" ? String(id) : "";
    const hasTeams =
      obj.homeTeam != null && obj.awayTeam != null && obj.startTimestamp != null;
    if (idStr === matchId && hasTeams) return obj;
    if (obj.event && typeof obj.event === "object") {
      const ev = obj.event as Record<string, unknown>;
      const evId = ev.id;
      const evIdStr =
        typeof evId === "number" || typeof evId === "string"
          ? String(evId)
          : "";
      const evHasTeams =
        ev.homeTeam != null && ev.awayTeam != null && ev.startTimestamp != null;
      if (evIdStr === matchId && evHasTeams) return ev;
    }
    for (const key of Object.keys(obj)) {
      const found = findEventObject(obj[key], matchId);
      if (found) return found;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findEventObject(item, matchId);
      if (found) return found;
    }
  }
  return null;
}

function findByKey(value: unknown, key: string): unknown | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (key in obj) return obj[key];
    for (const k of Object.keys(obj)) {
      const found = findByKey(obj[k], key);
      if (found != null) return found;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findByKey(item, key);
      if (found != null) return found;
    }
  }
  return null;
}
