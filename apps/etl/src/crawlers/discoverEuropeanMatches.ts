import { isAllowedTournament } from "../config/leagues.js";
import { getSyncTournamentIds } from "../config/europeanTournaments.js";
import { logger } from "../lib/logger.js";
import { curlFetchJsonWithRetry } from "./curlFetch.js";
import {
  fetchScheduleIdsFromHtml,
  fetchScheduledEventsViaBrowser,
} from "./sofascoreBrowser.js";

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
function delay(): Promise<void> {
  const scale = Math.max(
    0,
    parseFloat(process.env.DISCOVERY_DELAY_SCALE ?? "1") || 1,
  );
  const { min, max } = getDelayRange(600, 2000, "DISCOVERY_DELAY");
  const scaledMin = Math.floor(min * scale);
  const scaledMax = Math.floor(max * scale);
  const span = Math.max(0, scaledMax - scaledMin);
  const ms = scaledMin + Math.floor(Math.random() * (span + 1));
  return new Promise((r) => setTimeout(r, ms));
}

const BASE = "https://api.sofascore.com/api/v1";
const SPORT_BASE = `${BASE}/sport/football`;
const STATUS_FINISHED = 100;
/** Status codes we exclude (e.g. canceled). Events with these are not included. */
const STATUS_CANCELED = 70;

function getTournamentSeasonsUrl(tournamentId: number): string {
  return `${BASE}/unique-tournament/${tournamentId}/seasons`;
}

function getTournamentEventsUrl(
  tournamentId: number,
  seasonId: number,
): string {
  return `${BASE}/unique-tournament/${tournamentId}/season/${seasonId}/events`;
}

function getScheduledEventsUrl(date: string): string {
  return `${SPORT_BASE}/scheduled-events/${date}`;
}

/**
 * Fetch JSON from the SofaScore API using system curl (bypasses Node TLS fingerprint).
 * Includes automatic proxy rotation and retry.
 */
async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  return curlFetchJsonWithRetry<T>(url);
}

interface SeasonsResponse {
  seasons?: Array<{ id?: number; year?: string }>;
}

interface EventItem {
  id?: number | string;
  tournament?: { name?: string; uniqueTournament?: { id?: number } };
  status?: { code?: number };
  /** Unix seconds. API may return this in season events list. */
  startTimestamp?: number;
  startTime?: string;
}

interface EventsResponse {
  events?: EventItem[];
}

interface ScheduledEventsResponse {
  events?: EventItem[];
}

function getSyncTz(): string {
  const tz = process.env.SYNC_TZ?.trim();
  return tz !== undefined && tz !== "" ? tz : "UTC";
}

/** SYNC_DAYS: comma-separated day offsets from today (0=today, 1=tomorrow). Default "0,1". */
function getSyncDayOffsets(): number[] {
  const raw = process.env.SYNC_DAYS?.trim();
  if (raw === undefined || raw === "") return [0, 1];
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0);
}

/** Set of date strings (YYYY-MM-DD) in SYNC_TZ for the configured day offsets (e.g. today and tomorrow). */
function getTargetDateStrings(): Set<string> {
  const tz = getSyncTz();
  const offsets = getSyncDayOffsets();
  const now = Date.now();
  const dates = new Set<string>();
  for (const offset of offsets) {
    const d = new Date(now + offset * 24 * 60 * 60 * 1000);
    dates.add(d.toLocaleDateString("en-CA", { timeZone: tz }));
  }
  return dates;
}

/**
 * Obtém o ID da temporada atual (primeira da lista) para um torneio.
 */
async function getCurrentSeasonId(
  tournamentId: number,
): Promise<number | null> {
  const data = await fetchJson<SeasonsResponse>(
    getTournamentSeasonsUrl(tournamentId),
  );
  const seasons = data?.seasons;
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const first = seasons[0];
  const id = first?.id ?? (first as unknown as { seasonId?: number }).seasonId;
  return typeof id === "number" ? id : null;
}

function eventDateString(ev: EventItem, tz: string): string | null {
  const ts = ev.startTimestamp;
  if (typeof ts === "number" && ts > 0) {
    return new Date(ts * 1000).toLocaleDateString("en-CA", { timeZone: tz });
  }
  const startTime = ev.startTime;
  if (typeof startTime === "string") {
    const d = new Date(startTime);
    if (!Number.isNaN(d.getTime()))
      return d.toLocaleDateString("en-CA", { timeZone: tz });
  }
  return null;
}

/**
 * Lista IDs de partidas do dia atual e do dia posterior (hoje/amanhã em SYNC_TZ).
 * Inclui finalizadas (100) e agendadas (0, etc.); exclui apenas canceladas (70).
 * Se o evento não tiver startTimestamp/startTime, não é incluído (filtro por data desativado para esse item).
 */
async function getMatchIdsForTodayTomorrow(
  tournamentId: number,
  seasonId: number,
  targetDates: Set<string>,
  tz: string,
): Promise<string[]> {
  const data = await fetchJson<EventsResponse>(
    getTournamentEventsUrl(tournamentId, seasonId),
  );
  const events = data?.events;
  if (!Array.isArray(events)) return [];

  const ids: string[] = [];
  for (const ev of events) {
    const code = ev?.status?.code;
    if (code === STATUS_CANCELED) continue;
    const name = ev?.tournament?.name;
    if (name != null && !isAllowedTournament(name)) continue;
    const eventDate = eventDateString(ev, tz);
    if (eventDate != null) {
      if (!targetDates.has(eventDate)) continue;
    } else {
      // API não retornou startTimestamp/startTime: incluir só finalizadas (comportamento anterior)
      if (code !== STATUS_FINISHED) continue;
    }
    const id = ev?.id;
    if (id != null) ids.push(String(id));
  }
  return ids;
}

async function getMatchIdsFromScheduledDates(
  targetDates: Set<string>,
  tz: string,
  tournamentIds: number[],
): Promise<string[]> {
  const ids: string[] = [];
  const fallbackIds: string[] = [];
  const idSet = new Set(tournamentIds);
  for (const date of targetDates) {
    const data = await fetchJson<ScheduledEventsResponse>(
      getScheduledEventsUrl(date),
    );
    const events = data?.events;
    if (!Array.isArray(events)) continue;
    for (const ev of events) {
      const code = ev?.status?.code;
      if (code === STATUS_CANCELED) continue;
      const uniqueId = ev?.tournament?.uniqueTournament?.id;
      if (
        typeof uniqueId === "number" &&
        idSet.size > 0 &&
        !idSet.has(uniqueId)
      ) {
        continue;
      }
      const name = ev?.tournament?.name;
      if (name != null && !isAllowedTournament(name)) {
        const id = ev?.id;
        if (id != null) fallbackIds.push(String(id));
        continue;
      }
      const eventDate = eventDateString(ev, tz);
      if (eventDate != null && !targetDates.has(eventDate)) continue;
      const id = ev?.id;
      if (id != null) ids.push(String(id));
    }
  }
  if (ids.length === 0 && fallbackIds.length > 0) {
    logger.warn(
      "No matches after tournament-name filter; including scheduled-events fallback",
    );
    return fallbackIds;
  }
  return ids;
}

async function getMatchIdsFromScheduledDatesBrowser(
  targetDates: Set<string>,
  tz: string,
  tournamentIds: number[],
): Promise<string[]> {
  const ids: string[] = [];
  const fallbackIds: string[] = [];
  const idSet = new Set(tournamentIds);
  for (const date of targetDates) {
    const data = await fetchScheduledEventsViaBrowser(date);
    const events =
      data && typeof data === "object"
        ? (data as ScheduledEventsResponse).events
        : undefined;
    if (!Array.isArray(events)) {
      const htmlIds = await fetchScheduleIdsFromHtml(date);
      htmlIds.forEach((id) => ids.push(id));
      continue;
    }
    for (const ev of events) {
      const code = ev?.status?.code;
      if (code === STATUS_CANCELED) continue;
      const uniqueId = ev?.tournament?.uniqueTournament?.id;
      if (
        typeof uniqueId === "number" &&
        idSet.size > 0 &&
        !idSet.has(uniqueId)
      ) {
        continue;
      }
      const name = ev?.tournament?.name;
      if (name != null && !isAllowedTournament(name)) {
        const id = ev?.id;
        if (id != null) fallbackIds.push(String(id));
        continue;
      }
      const eventDate = eventDateString(ev, tz);
      if (eventDate != null && !targetDates.has(eventDate)) continue;
      const id = ev?.id;
      if (id != null) ids.push(String(id));
    }
  }
  if (ids.length === 0 && fallbackIds.length > 0) {
    logger.warn(
      "No matches after tournament-name filter; including scheduled-events fallback (browser)",
    );
    return fallbackIds;
  }
  return ids;
}

/**
 * Lista IDs de partidas finalizadas (status 100) cuja data está nos últimos N dias (UTC).
 * Usado como fallback para popular histórico (últimos 10 jogos) quando não há endpoint de jogador.
 */
async function getFinishedMatchIdsLastNDays(
  tournamentId: number,
  seasonId: number,
  sinceTimestampSeconds: number,
): Promise<string[]> {
  const data = await fetchJson<EventsResponse>(
    getTournamentEventsUrl(tournamentId, seasonId),
  );
  const events = data?.events;
  if (!Array.isArray(events)) return [];

  const ids: string[] = [];
  for (const ev of events) {
    const code = ev?.status?.code;
    if (code !== STATUS_FINISHED) continue;
    const name = ev?.tournament?.name;
    if (name != null && !isAllowedTournament(name)) continue;
    const ts = ev.startTimestamp;
    if (typeof ts !== "number" || ts < sinceTimestampSeconds) continue;
    const id = ev?.id;
    if (id != null) ids.push(String(id));
  }
  return ids;
}

/**
 * Descobre IDs de partidas finalizadas nos últimos N dias (para histórico dos jogadores).
 * SYNC_LAST_DAYS no .env (padrão 60).
 */
export async function discoverFinishedMatchIdsLastNDays(
  days?: number,
): Promise<string[]> {
  const t0 = Date.now();
  const n = days ?? (parseInt(process.env.SYNC_LAST_DAYS ?? "60", 10) || 60);
  const sinceMs = Date.now() - n * 24 * 60 * 60 * 1000;
  const tournamentIds = getSyncTournamentIds();
  if (tournamentIds.length === 0) return [];

  /* Build date strings for the last N days and use scheduled-events. */
  const tz = getSyncTz();
  const idSet = new Set(tournamentIds);
  const allIds = new Set<string>();

  /* Limit lookback window with env override to avoid excessive calls */
  const maxLookback =
    parseInt(process.env.SYNC_HISTORY_LOOKBACK_DAYS ?? "60", 10) || 60;
  const lookbackDays = Math.min(n, maxLookback);
  for (let offset = 0; offset < lookbackDays; offset++) {
    const d = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: tz });
    const data = await fetchJson<ScheduledEventsResponse>(
      getScheduledEventsUrl(dateStr),
    );
    const events = data?.events;
    if (!Array.isArray(events)) continue;
    for (const ev of events) {
      const code = ev?.status?.code;
      if (code !== STATUS_FINISHED) continue;
      const uniqueId = ev?.tournament?.uniqueTournament?.id;
      if (
        typeof uniqueId === "number" &&
        idSet.size > 0 &&
        !idSet.has(uniqueId)
      )
        continue;
      const name = ev?.tournament?.name;
      if (name != null && !isAllowedTournament(name)) continue;
      const ts = ev.startTimestamp;
      if (typeof ts === "number" && ts * 1000 < sinceMs) continue;
      const id = ev?.id;
      if (id != null) allIds.add(String(id));
    }
    await delay();
  }

  logger.info("Discovered finished matches in last N days", {
    days: n,
    lookback: lookbackDays,
    count: allIds.size,
    elapsedMs: Date.now() - t0,
  });
  return [...allIds];
}

/**
 * Descobre IDs de partidas dos dias configurados (por padrão hoje e amanhã em SYNC_TZ)
 * a partir dos torneios configurados (SYNC_TOURNAMENT_IDS ou padrão europeu).
 * Inclui partidas finalizadas e agendadas; exclui canceladas.
 */
export async function discoverEuropeanMatchIds(): Promise<string[]> {
  const tournamentIds = getSyncTournamentIds();
  if (tournamentIds.length === 0) {
    logger.warn(
      "No tournament IDs (SYNC_TOURNAMENT_IDS or default European list)",
    );
    return [];
  }

  const tz = getSyncTz();
  const targetDates = getTargetDateStrings();
  logger.info("Discovery target dates (SYNC_TZ)", {
    tz,
    dates: [...targetDates],
  });

  const allIds = new Set<string>();

  /* ------------------------------------------------------------------
   * Primary: scheduled-events endpoint (reliable, fast)
   * The per-tournament /season/{id}/events endpoint returns 404 on the
   * current SofaScore API, so we go straight to scheduled-events.
   * ------------------------------------------------------------------ */
  const scheduledIds = await getMatchIdsFromScheduledDates(
    targetDates,
    tz,
    tournamentIds,
  );
  if (scheduledIds.length > 0) {
    scheduledIds.forEach((id) => allIds.add(id));
    logger.info("Discovered matches from scheduled-events", {
      count: scheduledIds.length,
    });
  } else {
    /* Fallback: Playwright browser scraping */
    const browserScheduled = await getMatchIdsFromScheduledDatesBrowser(
      targetDates,
      tz,
      tournamentIds,
    );
    if (browserScheduled.length > 0) {
      browserScheduled.forEach((id) => allIds.add(id));
      logger.info("Discovered matches from scheduled-events (browser)", {
        count: browserScheduled.length,
      });
    } else {
      logger.warn("No matches from scheduled-events");
    }
  }

  return [...allIds];
}
