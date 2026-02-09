import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getPrisma } from '../services/db.js';
import { logger } from '../lib/logger.js';

const rawPort = process.env.PORT?.trim();
const PORT = rawPort ? Math.max(0, Math.min(65535, Number(rawPort)) || 3000) : 3000;
const prisma = getPrisma();

const ETL_API_KEY = process.env.SOFASCORE_ETL_API_KEY?.trim() ?? '';

const server = Fastify({ logger: false });

// --- API key middleware (skip /health for uptime monitors) ---
server.addHook('onRequest', async (request, reply) => {
  if (request.url === '/health') return;

  if (!ETL_API_KEY) {
    logger.warn('SOFASCORE_ETL_API_KEY not set — all requests allowed (dev mode)');
    return;
  }

  const provided = request.headers['x-api-key'];
  if (provided !== ETL_API_KEY) {
    await reply.status(401).send({ error: 'Unauthorized — invalid or missing API key' });
  }
});

server.get('/health', async (_, reply) => {
  await reply.send({ status: 'ok' });
});

server.get<{ Params: { playerId: string } }>('/players/:playerId', async (request, reply) => {
  const { playerId } = request.params;
  if (!playerId?.trim()) {
    await reply.status(400).send({ error: 'playerId is required' });
    return;
  }
  const player = await prisma.etlPlayer.findUnique({
    where: { id: playerId },
    select: { id: true, name: true, position: true, imageUrl: true },
  });
  if (!player) {
    await reply.status(404).send({ error: 'Player not found' });
    return;
  }
  await reply.send({
    id: player.id,
    name: player.name,
    position: player.position,
    imageUrl: player.imageUrl,
  });
});

server.get<{ Params: { teamId: string } }>('/teams/:teamId', async (request, reply) => {
  const { teamId } = request.params;
  if (!teamId?.trim()) {
    await reply.status(400).send({ error: 'teamId is required' });
    return;
  }
  const team = await prisma.etlTeam.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, imageUrl: true },
  });
  if (!team) {
    await reply.status(404).send({ error: 'Team not found' });
    return;
  }
  await reply.send({
    id: team.id,
    name: team.name,
    imageUrl: team.imageUrl,
  });
});

server.get<{
  Params: { playerId: string };
  Querystring: { from?: string; to?: string; limit?: string; offset?: string };
}>('/players/:playerId/shots', async (request, reply) => {
  const { playerId } = request.params;
  if (!playerId?.trim()) {
    await reply.status(400).send({ error: 'playerId is required' });
    return;
  }
  const limit = Math.min(Number(request.query.limit) || 50, 200);
  const offset = Number(request.query.offset) || 0;
  const from = request.query.from;
  const to = request.query.to;

  const where: { playerId: string; match?: { startTime?: { gte?: Date; lte?: Date } } } = { playerId };
  if (from || to) {
    where.match = { startTime: {} };
    if (from) {
      const fromDate = new Date(from + 'T00:00:00.000Z');
      if (!Number.isNaN(fromDate.getTime())) where.match.startTime!.gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to + 'T23:59:59.999Z');
      if (!Number.isNaN(toDate.getTime())) where.match.startTime!.lte = toDate;
    }
  }

  const [shots, total] = await Promise.all([
    prisma.etlShotEvent.findMany({
      where,
      include: { match: { select: { startTime: true } } },
      orderBy: [{ match: { startTime: 'desc' } }, { minute: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.etlShotEvent.count({ where }),
  ]);

  const items = shots.map((s) => ({
    id: s.id,
    matchId: s.matchId,
    playerId: s.playerId,
    teamId: s.teamId,
    minute: s.minute,
    second: s.second,
    outcome: s.outcome,
    xg: s.xg,
    bodyPart: s.bodyPart,
    situation: s.situation,
    coordsX: s.coordsX,
    coordsY: s.coordsY,
    matchStartTime: s.match.startTime,
  }));

  await reply.send({ items, total, limit, offset });
});

const ON_TARGET_OUTCOMES = ['on_target', 'goal'];

server.get<{
  Params: { playerId: string };
  Querystring: { limit?: string };
}>('/players/:playerId/last-matches', async (request, reply) => {
  const { playerId } = request.params;
  if (!playerId?.trim()) {
    await reply.status(400).send({ error: 'playerId is required' });
    return;
  }
  const limit = Math.min(Number(request.query.limit) || 10, 20);

  const matchPlayers = await prisma.etlMatchPlayer.findMany({
    where: { playerId },
    include: {
      player: { select: { position: true, imageUrl: true } },
      match: {
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { match: { startTime: 'desc' } },
    take: limit,
  });

  const matchIds = matchPlayers.map((mp) => mp.matchId);
  let shotCountByMatch: Record<string, { total: number; onTarget: number }> = {};

  if (matchIds.length > 0) {
    const shots = await prisma.etlShotEvent.findMany({
      where: { playerId, matchId: { in: matchIds } },
      select: { matchId: true, outcome: true },
    });
    for (const m of matchIds) {
      shotCountByMatch[m] = { total: 0, onTarget: 0 };
    }
    for (const s of shots) {
      shotCountByMatch[s.matchId]!.total += 1;
      if (ON_TARGET_OUTCOMES.includes(s.outcome)) {
        shotCountByMatch[s.matchId]!.onTarget += 1;
      }
    }
  }

  if (matchPlayers.length > 0) {
    const first = matchPlayers[0]!;
    const items = matchPlayers.map((mp) => {
      const counts = shotCountByMatch[mp.matchId] ?? { total: 0, onTarget: 0 };
      return {
        matchId: mp.matchId,
        startTime: mp.match.startTime,
        tournament: mp.match.tournament,
        season: mp.match.season,
        homeTeamId: mp.match.homeTeamId,
        awayTeamId: mp.match.awayTeamId,
        homeTeamName: mp.match.homeTeam.name,
        awayTeamName: mp.match.awayTeam.name,
        shotCount: counts.total,
        shotsOnTarget: counts.onTarget,
        minutesPlayed: mp.minutesPlayed,
        playerTeamId: mp.teamId,
        homeScore: mp.match.homeScore ?? null,
        awayScore: mp.match.awayScore ?? null,
      };
    });
    await reply.send({
      player: {
        position: first.player.position,
        imageUrl: first.player.imageUrl,
      },
      items,
    });
    return;
  }

  const [shotsFromEvents, fallbackPlayer] = await Promise.all([
    prisma.etlShotEvent.findMany({
      where: { playerId },
      include: { match: { include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } } },
      orderBy: { match: { startTime: 'desc' } },
    }),
    prisma.etlPlayer.findUnique({
      where: { id: playerId },
      select: { position: true, imageUrl: true },
    }),
  ]);
  const seenMatchIds = new Set<string>();
  const fallbackItems: Array<{
    matchId: string;
    startTime: Date;
    tournament: string | null;
    season: string | null;
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    shotCount: number;
    shotsOnTarget: number;
    minutesPlayed: number | null;
    playerTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }> = [];
  for (const s of shotsFromEvents) {
    if (seenMatchIds.has(s.matchId)) continue;
    seenMatchIds.add(s.matchId);
    const matchShots = shotsFromEvents.filter((x) => x.matchId === s.matchId);
    const onTarget = matchShots.filter((x) => ON_TARGET_OUTCOMES.includes(x.outcome)).length;
    fallbackItems.push({
      matchId: s.matchId,
      startTime: s.match.startTime,
      tournament: s.match.tournament,
      season: s.match.season,
      homeTeamId: s.match.homeTeamId,
      awayTeamId: s.match.awayTeamId,
      homeTeamName: s.match.homeTeam.name,
      awayTeamName: s.match.awayTeam.name,
      shotCount: matchShots.length,
      shotsOnTarget: onTarget,
      minutesPlayed: null,
      playerTeamId: s.teamId,
      homeScore: s.match.homeScore ?? null,
      awayScore: s.match.awayScore ?? null,
    });
    if (fallbackItems.length >= limit) break;
  }
  await reply.send({
    player: fallbackPlayer
      ? { position: fallbackPlayer.position, imageUrl: fallbackPlayer.imageUrl }
      : { position: null, imageUrl: null },
    items: fallbackItems,
  });
});

server.get<{
  Params: { matchId: string };
  Querystring: { limit?: string; offset?: string };
}>('/matches/:matchId/shots', async (request, reply) => {
  const { matchId } = request.params;
  if (!matchId?.trim()) {
    await reply.status(400).send({ error: 'matchId is required' });
    return;
  }
  const limit = Math.min(Number(request.query.limit) || 50, 200);
  const offset = Number(request.query.offset) || 0;

  const [shots, total] = await Promise.all([
    prisma.etlShotEvent.findMany({
      where: { matchId },
      orderBy: [{ minute: 'asc' }, { second: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.etlShotEvent.count({ where: { matchId } }),
  ]);

  const items = shots.map((s) => ({
    id: s.id,
    matchId: s.matchId,
    playerId: s.playerId,
    teamId: s.teamId,
    minute: s.minute,
    second: s.second,
    outcome: s.outcome,
    xg: s.xg,
    bodyPart: s.bodyPart,
    situation: s.situation,
    coordsX: s.coordsX,
    coordsY: s.coordsY,
  }));

  await reply.send({ items, total, limit, offset });
});

async function start(): Promise<void> {
  try {
    if (process.env.CORS === '1' || process.env.CORS === 'true') {
      await server.register(cors);
    }
    await server.listen({ port: PORT, host: '0.0.0.0' });
    logger.info('API listening', { url: `http://0.0.0.0:${PORT}` });
  } catch (err) {
    logger.error('API failed to start', err);
    process.exit(1);
  }
}

start();
