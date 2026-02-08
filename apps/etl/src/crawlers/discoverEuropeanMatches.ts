import { isAllowedTournament } from '../config/leagues.js';
import { getSyncTournamentIds } from '../config/europeanTournaments.js';
import { logger } from '../lib/logger.js';

const DELAY_MS = 800;
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const BASE = 'https://api.sofascore.com/api/v1';
const SPORT_BASE = `${BASE}/sport/football`;
const STATUS_FINISHED = 100;
/** Status codes we exclude (e.g. canceled). Events with these are not included. */
const STATUS_CANCELED = 70;

function getTournamentSeasonsUrl(tournamentId: number): string {
  return `${BASE}/unique-tournament/${tournamentId}/seasons`;
}

function getTournamentEventsUrl(tournamentId: number, seasonId: number): string {
  return `${BASE}/unique-tournament/${tournamentId}/season/${seasonId}/events`;
}

function getScheduledEventsUrl(date: string): string {
  return `${SPORT_BASE}/scheduled-events/${date}`;
}

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'SofaScoreETL/1.0' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    logger.warn('Fetch error', { url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

interface SeasonsResponse {
  seasons?: Array<{ id?: number; year?: string }>;
}

interface EventItem {
  id?: number | string;
  tournament?: { name?: string };
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
  return tz !== undefined && tz !== '' ? tz : 'UTC';
}

/** SYNC_DAYS: comma-separated day offsets from today (0=today, 1=tomorrow). Default "0,1". */
function getSyncDayOffsets(): number[] {
  const raw = process.env.SYNC_DAYS?.trim();
  if (raw === undefined || raw === '') return [0, 1];
  return raw
    .split(',')
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
    dates.add(d.toLocaleDateString('en-CA', { timeZone: tz }));
  }
  return dates;
}

/**
 * Obtém o ID da temporada atual (primeira da lista) para um torneio.
 */
async function getCurrentSeasonId(tournamentId: number): Promise<number | null> {
  const data = await fetchJson<SeasonsResponse>(getTournamentSeasonsUrl(tournamentId));
  const seasons = data?.seasons;
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const first = seasons[0];
  const id = first?.id ?? (first as unknown as { seasonId?: number }).seasonId;
  return typeof id === 'number' ? id : null;
}

function eventDateString(ev: EventItem, tz: string): string | null {
  const ts = ev.startTimestamp;
  if (typeof ts === 'number' && ts > 0) {
    return new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: tz });
  }
  const startTime = ev.startTime;
  if (typeof startTime === 'string') {
    const d = new Date(startTime);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-CA', { timeZone: tz });
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
  tz: string
): Promise<string[]> {
  const data = await fetchJson<EventsResponse>(
    getTournamentEventsUrl(tournamentId, seasonId)
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
): Promise<string[]> {
  const ids: string[] = [];
  const fallbackIds: string[] = [];
  for (const date of targetDates) {
    const data = await fetchJson<ScheduledEventsResponse>(getScheduledEventsUrl(date));
    const events = data?.events;
    if (!Array.isArray(events)) continue;
    for (const ev of events) {
      const code = ev?.status?.code;
      if (code === STATUS_CANCELED) continue;
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
    logger.warn('No matches after tournament-name filter; including scheduled-events fallback');
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
  sinceTimestampSeconds: number
): Promise<string[]> {
  const data = await fetchJson<EventsResponse>(
    getTournamentEventsUrl(tournamentId, seasonId)
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
    if (typeof ts !== 'number' || ts < sinceTimestampSeconds) continue;
    const id = ev?.id;
    if (id != null) ids.push(String(id));
  }
  return ids;
}

/**
 * Descobre IDs de partidas finalizadas nos últimos N dias (para histórico dos jogadores).
 * SYNC_LAST_DAYS no .env (padrão 60).
 */
export async function discoverFinishedMatchIdsLastNDays(days?: number): Promise<string[]> {
  const n = days ?? (parseInt(process.env.SYNC_LAST_DAYS ?? '60', 10) || 60);
  const since = Math.floor((Date.now() - n * 24 * 60 * 60 * 1000) / 1000);
  const tournamentIds = getSyncTournamentIds();
  if (tournamentIds.length === 0) return [];

  const allIds = new Set<string>();
  for (const tournamentId of tournamentIds) {
    await delay(DELAY_MS);
    const seasonId = await getCurrentSeasonId(tournamentId);
    if (seasonId == null) continue;
    await delay(DELAY_MS);
    const ids = await getFinishedMatchIdsLastNDays(tournamentId, seasonId, since);
    ids.forEach((id) => allIds.add(id));
  }
  logger.info('Discovered finished matches in last N days', { days: n, count: allIds.size });
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
    logger.warn('No tournament IDs (SYNC_TOURNAMENT_IDS or default European list)');
    return [];
  }

  const tz = getSyncTz();
  const targetDates = getTargetDateStrings();
  logger.info('Discovery target dates (SYNC_TZ)', { tz, dates: [...targetDates] });

  const allIds = new Set<string>();

  for (const tournamentId of tournamentIds) {
    await delay(DELAY_MS);
    const seasonId = await getCurrentSeasonId(tournamentId);
    if (seasonId == null) {
      logger.debug('No season for tournament', { tournamentId });
      continue;
    }
    await delay(DELAY_MS);
    const ids = await getMatchIdsForTodayTomorrow(tournamentId, seasonId, targetDates, tz);
    ids.forEach((id) => allIds.add(id));
    if (ids.length > 0) {
      logger.info('Discovered matches for tournament (today/tomorrow)', {
        tournamentId,
        seasonId,
        count: ids.length,
      });
    }
  }

  const scheduledIds = await getMatchIdsFromScheduledDates(targetDates, tz);
  if (scheduledIds.length > 0) {
    scheduledIds.forEach((id) => allIds.add(id));
    logger.info('Discovered matches from scheduled-events', {
      count: scheduledIds.length,
    });
  } else if (allIds.size === 0) {
    logger.warn('No matches from seasons or scheduled-events');
  }

  return [...allIds];
}
