import { prisma } from '@finalizabot/shared';
import type { PrismaClient } from '@finalizabot/shared';
import type { NormalizedShot } from '../parsers/normalize.js';

const BATCH_SIZE = 500;

export function getPrisma(): PrismaClient {
  return prisma;
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export interface TeamData {
  id: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
}

export async function upsertTeam(data: TeamData): Promise<void> {
  await prisma.etlTeam.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      name: data.name,
      slug: data.slug ?? null,
      imageUrl: data.imageUrl ?? null,
    },
    update: {
      name: data.name,
      slug: data.slug ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });
}

export interface PlayerData {
  id: string;
  name: string;
  slug?: string | null;
  position?: string | null;
  imageUrl?: string | null;
  currentTeamId?: string | null;
}

export async function upsertPlayer(data: PlayerData): Promise<void> {
  // Don't overwrite a good name with a numeric ID
  const isNumericName = /^\d+$/.test(data.name);

  const updateData: Record<string, unknown> = {
    slug: data.slug ?? null,
    position: data.position ?? null,
    imageUrl: data.imageUrl ?? null,
    currentTeamId: data.currentTeamId ?? null,
  };

  // Only update name if the incoming value is an actual name (not a numeric ID)
  if (!isNumericName) {
    updateData.name = data.name;
  }

  await prisma.etlPlayer.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      name: data.name,
      slug: data.slug ?? null,
      position: data.position ?? null,
      imageUrl: data.imageUrl ?? null,
      currentTeamId: data.currentTeamId ?? null,
    },
    update: updateData,
  });
}

export interface MatchData {
  id: string;
  startTime: Date;
  homeTeamId: string;
  awayTeamId: string;
  tournament?: string | null;
  season?: string | null;
  statusCode?: number | null;
  statusType?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
}

export async function upsertMatch(data: MatchData): Promise<void> {
  await prisma.etlMatch.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      startTime: data.startTime,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      tournament: data.tournament ?? null,
      season: data.season ?? null,
      statusCode: data.statusCode ?? null,
      statusType: data.statusType ?? null,
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      minute: data.minute ?? null,
    },
    update: {
      startTime: data.startTime,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      tournament: data.tournament ?? null,
      season: data.season ?? null,
      statusCode: data.statusCode ?? null,
      statusType: data.statusType ?? null,
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      minute: data.minute ?? null,
    },
  });
}

export interface MatchPlayerData {
  matchId: string;
  playerId: string;
  teamId: string;
  minutesPlayed?: number | null;
}

export async function attachMatchPlayer(
  matchId: string,
  playerId: string,
  teamId: string,
  minutesPlayed?: number | null
): Promise<void> {
  const minutes = minutesPlayed ?? undefined;
  await prisma.etlMatchPlayer.upsert({
    where: {
      matchId_playerId: { matchId, playerId },
    },
    create: { matchId, playerId, teamId, minutesPlayed: minutes },
    update: minutes !== undefined ? { teamId, minutesPlayed: minutes } : { teamId },
  });
}

export async function insertShotEvents(events: NormalizedShot[]): Promise<void> {
  if (events.length === 0) return;
  const rows = events.map((e) => ({
    id: e.id,
    matchId: e.matchId,
    playerId: e.playerId,
    teamId: e.teamId,
    minute: e.minute,
    second: e.second ?? null,
    type: 'shot',
    outcome: e.outcome,
    xg: e.xg ?? null,
    bodyPart: e.bodyPart ?? null,
    situation: e.situation ?? null,
    coordsX: e.coordsX ?? null,
    coordsY: e.coordsY ?? null,
  }));
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await prisma.etlShotEvent.createMany({ data: chunk, skipDuplicates: true });
  }
}
