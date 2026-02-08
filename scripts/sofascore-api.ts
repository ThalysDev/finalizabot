/**
 * SofaScore Public API helpers
 *
 * Chama diretamente api.sofascore.com para descobrir:
 * - Partidas agendadas do dia (scheduled-events)
 * - Lineups (escalações) de uma partida
 *
 * ⚠️  Uso exclusivo em scripts server-side (sync, seed). Nunca no browser.
 */

/* ============================================================================
   CONFIG
   ============================================================================ */

const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";

const HEADERS: HeadersInit = {
  Accept: "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

/** IDs de torneios monitorados (editável via env SYNC_TOURNAMENTS) */
export const DEFAULT_TOURNAMENT_IDS = [
  325, // Brasileirão Série A
  390, // Brasileirão Série B
  4407, // Copa do Brasil
  384, // Libertadores
  480, // Sul-Americana
  133, // Copa América
  242, // Eliminatórias CONMEBOL
  17, // Premier League
  8, // La Liga
  23, // Serie A (Itália)
  35, // Bundesliga
  34, // Ligue 1
  7, // Champions League
  679, // Europa League
  16, // World Cup
];

/* ============================================================================
   TYPES
   ============================================================================ */

export interface SofascoreEvent {
  id: number;
  tournament: {
    name: string;
    uniqueTournament?: {
      id: number;
      name: string;
    };
  };
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
  };
  startTimestamp: number;
  status: {
    type: string; // "notstarted" | "inprogress" | "finished"
    description?: string;
  };
  slug?: string;
  customId?: string;
}

export interface SofascoreLineupPlayer {
  player: {
    id: number;
    name: string;
    shortName?: string;
    position?: string; // "F" | "M" | "D" | "G"
    slug?: string;
  };
  shirtNumber?: number;
  position?: string;
  substitute?: boolean;
  statistics?: Record<string, unknown>;
}

export interface SofascoreLineup {
  players: SofascoreLineupPlayer[];
}

export interface SofascoreLineupsResponse {
  home?: SofascoreLineup;
  away?: SofascoreLineup;
  confirmed?: boolean;
}

/* ============================================================================
   API FUNCTIONS
   ============================================================================ */

async function sofascoreFetch<T>(path: string): Promise<T | null> {
  const url = `${SOFASCORE_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[SofaScore] ${res.status} ${res.statusText} — ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(
      `[SofaScore] Fetch failed: ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}

/**
 * Busca todas as partidas agendadas para uma data.
 * @param date — YYYY-MM-DD
 */
export async function fetchScheduledEvents(
  date: string,
): Promise<SofascoreEvent[]> {
  const data = await sofascoreFetch<{ events: SofascoreEvent[] }>(
    `/sport/football/scheduled-events/${date}`,
  );
  return data?.events ?? [];
}

/**
 * Filtra eventos por torneios de interesse.
 */
export function filterByTournaments(
  events: SofascoreEvent[],
  tournamentIds: number[],
): SofascoreEvent[] {
  const idSet = new Set(tournamentIds);
  return events.filter(
    (e) =>
      e.tournament.uniqueTournament &&
      idSet.has(e.tournament.uniqueTournament.id),
  );
}

/**
 * Busca as escalações de uma partida.
 */
export async function fetchEventLineups(
  eventId: number,
): Promise<SofascoreLineupsResponse | null> {
  return sofascoreFetch<SofascoreLineupsResponse>(
    `/event/${eventId}/lineups`,
  );
}

/**
 * Mapeia posição SofaScore (F/M/D/G) para nome em português.
 */
export function mapPosition(posCode?: string): string {
  switch (posCode) {
    case "F":
      return "Atacante";
    case "M":
      return "Meia";
    case "D":
      return "Zagueiro";
    case "G":
      return "Goleiro";
    default:
      return "Desconhecido";
  }
}
