import { HttpCrawler, HttpCrawlingContext, ProxyConfiguration, sleep } from 'crawlee';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  discoverEuropeanMatchIds,
  discoverFinishedMatchIdsLastNDays,
} from './discoverEuropeanMatches.js';
import { fetchAndPersistLineups } from './fetchLineups.js';
import { isAllowedTournament } from '../config/leagues.js';
import { logger } from '../lib/logger.js';
import { normalizeShotsFromSofaScore } from '../parsers/normalize.js';
import {
  getPrisma,
  upsertTeam,
  upsertPlayer,
  upsertMatch,
  attachMatchPlayer,
  insertShotEvents,
} from '../services/db.js';

const EVENTS_URL_TEMPLATE = 'https://api.sofascore.com/api/v1/event/{matchId}/incidents';
const MATCH_URL_TEMPLATE = 'https://api.sofascore.com/api/v1/event/{matchId}';
function getProxyConfiguration(): ProxyConfiguration | undefined {
  const proxyUrl =
    process.env.SOFASCORE_PROXY_URL?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim();
  if (!proxyUrl) return undefined;
  return new ProxyConfiguration({ proxyUrls: [proxyUrl] });
}

const HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  Referer: 'https://www.sofascore.com/',
  Origin: 'https://www.sofascore.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

function getEventsUrl(matchId: string): string {
  return EVENTS_URL_TEMPLATE.replace('{matchId}', matchId);
}

function getMatchUrl(matchId: string): string {
  return MATCH_URL_TEMPLATE.replace('{matchId}', matchId);
}

export interface IngestUserData {
  matchId: string;
}

async function loadMatchIds(): Promise<string[]> {
  const fromEnv = process.env.MATCH_IDS?.trim();
  if (fromEnv) {
    const ids = fromEnv.split(',').map((id) => id.trim()).filter(Boolean);
    return [...new Set(ids)];
  }

  const path = join(process.cwd(), 'src', 'seed', 'matches.txt');
  try {
    const content = await readFile(path, 'utf-8');
    const fromFile = content
      .split('\n')
      .map((line) => line.replace(/#.*/, '').trim())
      .filter(Boolean);
    if (fromFile.length > 0) return [...new Set(fromFile)];
  } catch {
    // ignore
  }

  // Sem MATCH_IDS nem matches.txt: descobre partidas europeias (torneios configurados)
  logger.info('Discovering European match IDs from tournament/season API…');
  const discovered = await discoverEuropeanMatchIds();
  if (discovered.length > 0) {
    logger.info('Discovered European match IDs', { count: discovered.length });
  }
  return [...new Set(discovered)];
}

export async function runSofaScoreIngest(): Promise<void> {
  const matchIds = await loadMatchIds();
  if (matchIds.length === 0) {
    logger.warn(
      'No match IDs. Configure MATCH_IDS, src/seed/matches.txt, or ensure SYNC_TOURNAMENT_IDS/European discovery returns matches.'
    );
    return;
  }

  const prisma = getPrisma();
  const ingestRun = await prisma.etlIngestRun.create({
    data: { status: 'started' },
  });

  const allowedMatchIds = new Set<string>();

  try {
    const matchRequests = matchIds.map((matchId) => ({
      url: getMatchUrl(matchId),
      userData: { matchId } satisfies IngestUserData,
    }));

    const proxyConfiguration = getProxyConfiguration();
    const matchCrawler = new HttpCrawler<HttpCrawlingContext<IngestUserData, any>>({
      maxConcurrency: 2,
      additionalHttpHeaders: HEADERS,
      proxyConfiguration,
      requestHandler: async ({ request, json }) => {
        const matchId = request.userData.matchId;
        const url = request.url;
        if (json == null) return;
        try {
          const data = json as Record<string, unknown>;
          const event = data.event ?? data;
          const o = typeof event === 'object' && event !== null ? (event as Record<string, unknown>) : {};
          const tournamentObj = o.tournament as Record<string, unknown> | undefined;
          const tournamentName = tournamentObj && typeof tournamentObj.name === 'string' ? tournamentObj.name : undefined;

          if (!isAllowedTournament(tournamentName)) {
            logger.info('Match skipped (tournament not in whitelist)', { matchId, tournament: tournamentName });
            return;
          }

          allowedMatchIds.add(matchId);

          const homeRaw = o.homeTeam ?? o.homeTeamId;
          const awayRaw = o.awayTeam ?? o.awayTeamId;
          const homeTeam = typeof homeRaw === 'object' && homeRaw !== null ? (homeRaw as Record<string, unknown>) : null;
          const awayTeam = typeof awayRaw === 'object' && awayRaw !== null ? (awayRaw as Record<string, unknown>) : null;
          const homeId =
            homeTeam && typeof homeTeam.id !== 'undefined'
              ? String(homeTeam.id)
              : typeof o.homeTeamId === 'number' || typeof o.homeTeamId === 'string'
                ? String(o.homeTeamId)
                : `home-${matchId}`;
          const awayId =
            awayTeam && typeof awayTeam.id !== 'undefined'
              ? String(awayTeam.id)
              : typeof o.awayTeamId === 'number' || typeof o.awayTeamId === 'string'
                ? String(o.awayTeamId)
                : `away-${matchId}`;
          const homeName = homeTeam && typeof homeTeam.name === 'string' ? homeTeam.name : `Team ${matchId} (home)`;
          const awayName = awayTeam && typeof awayTeam.name === 'string' ? awayTeam.name : `Team ${matchId} (away)`;
          const teamImageUrl = (team: Record<string, unknown> | null): string | null => {
            if (!team) return null;
            const url =
              team.imageUrl ?? team.logo ?? (team.team as Record<string, unknown> | undefined)?.imageUrl ?? (team.team as Record<string, unknown> | undefined)?.logo;
            return typeof url === 'string' && url.length > 0 ? url : null;
          };
          const startTimeStr = (o.startTimestamp ?? o.startTime ?? o.start) as string | number | undefined;
          const startTime = startTimeStr != null
            ? new Date(typeof startTimeStr === 'number' ? startTimeStr * 1000 : startTimeStr)
            : new Date(0);
          const statusObj = (o.status as Record<string, unknown> | undefined) ?? undefined;
          const statusCode = coerceInt(statusObj?.code ?? statusObj?.id);
          const statusType = typeof statusObj?.type === 'string' ? statusObj.type : undefined;
          const homeScore = readScore(o.homeScore);
          const awayScore = readScore(o.awayScore);
          const minute = coerceInt(o.time ?? o.currentMinute ?? o.minute);

          await upsertTeam({ id: homeId, name: homeName, imageUrl: teamImageUrl(homeTeam) });
          await upsertTeam({ id: awayId, name: awayName, imageUrl: teamImageUrl(awayTeam) });
          await upsertMatch({
            id: matchId,
            startTime,
            homeTeamId: homeId,
            awayTeamId: awayId,
            tournament: (o.tournament as Record<string, unknown>)?.name as string | undefined,
            season: (o.season as Record<string, unknown>)?.name as string | undefined,
            statusCode,
            statusType,
            homeScore,
            awayScore,
            minute,
          });
          await sleep(300);
          await fetchAndPersistLineups(matchId, homeId, awayId);
        } catch (err) {
          logger.warn('Match handler error', { url, matchId, error: err instanceof Error ? err.message : String(err) });
        }
        await sleep(500);
      },
    });

    await matchCrawler.run(matchRequests);

    if (allowedMatchIds.size === 0) {
      logger.warn('No matches passed tournament filter');
      await prisma.etlIngestRun.update({
        where: { id: ingestRun.id },
        data: { finishedAt: new Date(), status: 'success' },
      });
      return;
    }

    const incidentRequests = Array.from(allowedMatchIds).map((matchId) => ({
      url: getEventsUrl(matchId),
      userData: { matchId } satisfies IngestUserData,
    }));

    const incidentCrawler = new HttpCrawler<HttpCrawlingContext<IngestUserData, any>>({
      maxConcurrency: 2,
      additionalHttpHeaders: HEADERS,
      proxyConfiguration,
      requestHandler: async ({ request, json }) => {
        const matchId = request.userData.matchId;
        const url = request.url;
        if (json == null) return;
        try {
          const allShots = normalizeShotsFromSofaScore(matchId, json);
          const shots = allShots.filter((s) => s.playerId.length > 0 && s.teamId.length > 0);
          if (shots.length === 0) return;

          const seenPlayers = new Set<string>();
          const seenMatchPlayers = new Set<string>();
          for (const s of shots) {
            seenPlayers.add(s.playerId);
            seenMatchPlayers.add(`${s.matchId}:${s.playerId}`);
          }
          await Promise.all(
            [...seenPlayers].map((playerId) => upsertPlayer({ id: playerId, name: playerId }))
          );
          await Promise.all(
            [...seenMatchPlayers].map((key) => {
              const colon = key.indexOf(':');
              const m = colon >= 0 ? key.slice(0, colon) : key;
              const p = colon >= 0 ? key.slice(colon + 1) : '';
              const s = shots.find((x) => x.matchId === m && x.playerId === p)!;
              return attachMatchPlayer(s.matchId, s.playerId, s.teamId);
            })
          );
          await insertShotEvents(shots);
          logger.info('Ingested shots', { matchId, count: shots.length });
        } catch (err) {
          logger.warn('Incident handler error', { url, matchId, error: err instanceof Error ? err.message : String(err) });
        }
        await sleep(500);
      },
    });

    await incidentCrawler.run(incidentRequests);

    // Fase 2: histórico (últimos N dias) para last-matches dos jogadores
    const phase2Ids = (await discoverFinishedMatchIdsLastNDays()).filter(
      (id) => !allowedMatchIds.has(id)
    );
    if (phase2Ids.length > 0) {
      logger.info('Phase 2: ingesting last-N-days matches for player history', {
        count: phase2Ids.length,
      });
      const matchRequests2 = phase2Ids.map((matchId) => ({
        url: getMatchUrl(matchId),
        userData: { matchId } satisfies IngestUserData,
      }));
      await matchCrawler.run(matchRequests2);
      const phase2Allowed = phase2Ids.filter((id) => allowedMatchIds.has(id));
      if (phase2Allowed.length > 0) {
        const incidentRequests2 = phase2Allowed.map((matchId) => ({
          url: getEventsUrl(matchId),
          userData: { matchId } satisfies IngestUserData,
        }));
        await incidentCrawler.run(incidentRequests2);
      }
    }

    await prisma.etlIngestRun.update({
      where: { id: ingestRun.id },
      data: { finishedAt: new Date(), status: 'success' },
    });
    logger.info('Ingest finished', { runId: ingestRun.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    try {
      await prisma.etlIngestRun.update({
        where: { id: ingestRun.id },
        data: {
          finishedAt: new Date(),
          status: 'failed',
          error: stack ?? message,
        },
      });
    } catch (updateErr) {
      logger.warn('Could not update ingestRun status to failed', { runId: ingestRun.id, error: updateErr });
    }
    logger.error('Ingest failed', { runId: ingestRun.id, error: message });
    throw err;
  }
}

function readScore(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = obj.current ?? obj.display ?? obj.value;
    return readScore(candidate);
  }
  return null;
}

function coerceInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
