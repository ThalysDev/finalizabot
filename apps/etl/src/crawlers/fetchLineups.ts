/**
 * Fetch and parse SofaScore event lineups for a match.
 * Endpoint: GET https://api.sofascore.com/api/v1/event/{matchId}/lineups
 * Populates Player (name, position) and MatchPlayer (minutesPlayed) for all players in the match.
 */

import { upsertPlayer, attachMatchPlayer } from "../services/db.js";
import { logger } from "../lib/logger.js";
import { fetchLineupsViaBrowser } from "./sofascoreBrowser.js";
import { curlFetchJsonWithRetry } from "./curlFetch.js";

const LINEUPS_URL_TEMPLATE =
  "https://api.sofascore.com/api/v1/event/{matchId}/lineups";

function getLineupsUrl(matchId: string): string {
  return LINEUPS_URL_TEMPLATE.replace("{matchId}", matchId);
}

function safeStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function safeInt(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

interface LineupPlayer {
  playerId: string;
  teamId: string;
  name: string;
  position: string | null;
  imageUrl: string | null;
  minutesPlayed: number | null;
}

function extractPlayersFromTeam(
  teamObj: Record<string, unknown> | null,
  teamId: string,
): LineupPlayer[] {
  if (!teamObj || typeof teamObj !== "object") return [];
  const out: LineupPlayer[] = [];
  // Common shapes: players[], lineup[], teamPlayers[]
  const playersList =
    (teamObj.players as unknown[] | undefined) ??
    (teamObj.lineup as unknown[] | undefined) ??
    (teamObj.teamPlayers as unknown[] | undefined) ??
    [];
  if (!Array.isArray(playersList)) return [];

  for (const p of playersList) {
    if (p == null || typeof p !== "object") continue;
    const o = p as Record<string, unknown>;
    const playerObj = (o.player ?? o) as Record<string, unknown> | undefined;
    const id = playerObj?.id ?? o.id;
    const playerId = safeStr(id);
    if (!playerId) continue;
    const name = safeStr(playerObj?.name ?? o.name ?? playerId);
    const pos = playerObj?.position ?? o.position;
    const position = typeof pos === "string" ? pos : safeStr(pos) || null;
    const img =
      playerObj?.imageUrl ??
      playerObj?.photo ??
      (playerObj?.image as Record<string, unknown>)?.url ??
      o.imageUrl ??
      o.photo;
    const imageUrl = typeof img === "string" && img.length > 0 ? img : null;
    // SofaScore nests minutes inside statistics/stats sub-object
    const statsObj = (o.statistics ?? o.stats) as Record<string, unknown> | undefined;
    const playerStats = (playerObj?.statistics ?? playerObj?.stats) as Record<string, unknown> | undefined;
    const minutes =
      safeInt(o.minutesPlayed ?? o.playedMinutes ?? o.timePlayed) ??
      safeInt(statsObj?.minutesPlayed ?? statsObj?.playedMinutes) ??
      safeInt(playerObj?.minutesPlayed ?? playerObj?.playedMinutes) ??
      safeInt(playerStats?.minutesPlayed ?? playerStats?.playedMinutes);
    out.push({
      playerId,
      teamId,
      name,
      position,
      imageUrl,
      minutesPlayed: minutes,
    });
  }
  return out;
}

function parseLineupsResponse(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  json: unknown,
): LineupPlayer[] {
  const out: LineupPlayer[] = [];
  if (json == null || typeof json !== "object") return out;
  const data = json as Record<string, unknown>;
  const home = data.home ?? data.homeTeam;
  const away = data.away ?? data.awayTeam;
  const teamLists = data.teamLists as unknown[] | undefined;
  if (Array.isArray(teamLists)) {
    for (let idx = 0; idx < teamLists.length; idx++) {
      const t = teamLists[idx];
      if (t == null || typeof t !== "object") continue;
      const team = t as Record<string, unknown>;
      const rawTeamId = safeStr(
        team.teamId ?? (team.team as Record<string, unknown>)?.id ?? team.id,
      );
      // Use extracted teamId, otherwise infer from position: first entry = home, rest = away
      const teamId = rawTeamId || (idx === 0 ? homeTeamId : awayTeamId);
      out.push(...extractPlayersFromTeam(team, teamId));
    }
  } else {
    out.push(
      ...extractPlayersFromTeam(home as Record<string, unknown>, homeTeamId),
    );
    out.push(
      ...extractPlayersFromTeam(away as Record<string, unknown>, awayTeamId),
    );
  }
  return out;
}

export async function fetchAndPersistLineups(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
): Promise<void> {
  const url = getLineupsUrl(matchId);
  try {
    let json: unknown = await curlFetchJsonWithRetry(url, 3);
    if (json == null) {
      logger.debug("Lineups not available via curl, trying browser", {
        matchId,
      });
      json = await fetchLineupsViaBrowser(matchId);
      if (json == null) return;
    }
    const players = parseLineupsResponse(matchId, homeTeamId, awayTeamId, json);
    if (players.length === 0) return;
    for (const p of players) {
      await upsertPlayer({
        id: p.playerId,
        name: p.name,
        position: p.position,
        imageUrl: p.imageUrl,
        currentTeamId: p.teamId,
      });
      await attachMatchPlayer(
        matchId,
        p.playerId,
        p.teamId,
        p.minutesPlayed ?? undefined,
      );
    }
    logger.info("Lineups ingested", { matchId, playersCount: players.length });
  } catch (err) {
    logger.warn("Lineups fetch error", {
      matchId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
