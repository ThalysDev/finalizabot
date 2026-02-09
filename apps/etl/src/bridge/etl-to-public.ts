/**
 * ETL → Public Bridge
 *
 * Copia dados da schema `etl` para a schema `public`,
 * preenchendo Match, Player, PlayerMatchStats e MarketAnalysis.
 *
 * Execução: MODE=bridge tsx src/index.ts
 */

import { prisma } from '@finalizabot/shared';
import { calcHits, mean, stdev, calcCV } from '@finalizabot/shared';
import { logger } from '../lib/logger.js';
import { syncAllImages } from '../services/imageDownloader.js';

/* ============================================================================
   SofaScore image URL helpers
   ============================================================================ */

function teamImageUrl(sofascoreId: string): string {
  return `https://api.sofascore.com/api/v1/team/${sofascoreId}/image`;
}

function playerImageUrl(sofascoreId: string): string {
  return `https://api.sofascore.com/api/v1/player/${sofascoreId}/image`;
}

/* ============================================================================
   Main bridge function
   ============================================================================ */

export async function runBridge(): Promise<void> {
  logger.info('[Bridge] Iniciando sincronização ETL → Public...');

  // 1. Sync matches (ETL → Public)
  const matchCount = await syncMatches();
  logger.info(`[Bridge] ${matchCount} partidas sincronizadas`);

  // 2. Sync players (ETL → Public)
  const playerCount = await syncPlayers();
  logger.info(`[Bridge] ${playerCount} jogadores sincronizados`);

  // 3. Sync player match stats
  const statsCount = await syncPlayerMatchStats();
  logger.info(`[Bridge] ${statsCount} estatísticas sincronizadas`);

  // 4. Generate market analysis from stats
  const analysisCount = await generateMarketAnalysis();
  logger.info(`[Bridge] ${analysisCount} análises de mercado geradas`);

  // 5. Download and cache images
  try {
    await syncAllImages();
  } catch (err) {
    logger.warn(`[Bridge] Image sync failed (non-fatal): ${err instanceof Error ? err.message : err}`);
  }

  logger.info('[Bridge] Sincronização concluída!');
}

/* ============================================================================
   Sync Matches
   ============================================================================ */

async function syncMatches(): Promise<number> {
  const etlMatches = await prisma.etlMatch.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { startTime: 'desc' },
    take: 200, // last 200 matches
  });

  let count = 0;
  for (const em of etlMatches) {
    try {
      const resolvedStatus = mapStatus(em.statusType, em.statusCode, em.startTime);
      const homeTeamId = isNumericId(em.homeTeamId) ? em.homeTeamId : undefined;
      const awayTeamId = isNumericId(em.awayTeamId) ? em.awayTeamId : undefined;
      await prisma.match.upsert({
        where: { sofascoreId: em.id },
        create: {
          sofascoreId: em.id,
          homeTeam: em.homeTeam.name,
          awayTeam: em.awayTeam.name,
          competition: em.tournament ?? 'Unknown',
          matchDate: em.startTime,
          status: resolvedStatus,
          homeScore: em.homeScore ?? null,
          awayScore: em.awayScore ?? null,
          minute: em.minute ?? null,
          homeTeamImageUrl: em.homeTeam.imageUrl ?? (homeTeamId ? teamImageUrl(homeTeamId) : null),
          awayTeamImageUrl: em.awayTeam.imageUrl ?? (awayTeamId ? teamImageUrl(awayTeamId) : null),
          homeTeamSofascoreId: homeTeamId ?? null,
          awayTeamSofascoreId: awayTeamId ?? null,
        },
        update: {
          homeTeam: em.homeTeam.name,
          awayTeam: em.awayTeam.name,
          competition: em.tournament ?? 'Unknown',
          matchDate: em.startTime,
          status: resolvedStatus,
          homeScore: em.homeScore ?? null,
          awayScore: em.awayScore ?? null,
          minute: em.minute ?? null,
          homeTeamImageUrl: em.homeTeam.imageUrl ?? (homeTeamId ? teamImageUrl(homeTeamId) : null),
          awayTeamImageUrl: em.awayTeam.imageUrl ?? (awayTeamId ? teamImageUrl(awayTeamId) : null),
          homeTeamSofascoreId: homeTeamId ?? null,
          awayTeamSofascoreId: awayTeamId ?? null,
        },
      });
      count++;
    } catch (err) {
      logger.warn(`[Bridge] Erro ao sync match ${em.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return count;
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function mapStatus(
  statusType: string | null,
  statusCode: number | null,
  startTime: Date,
): string {
  const type = statusType?.toLowerCase();
  if (type === 'finished') return 'finished';
  if (type === 'inprogress' || type === 'live') return 'live';
  if (type === 'notstarted') return 'scheduled';
  if (statusCode === 100) return 'finished';
  if (statusCode === 0 || statusCode === 1) return 'scheduled';
  if (statusCode === 2 || statusCode === 3) return 'live';
  return startTime < new Date() ? 'finished' : 'scheduled';
}

/* ============================================================================
   Sync Players
   ============================================================================ */

async function syncPlayers(): Promise<number> {
  // Get all ETL players that have participated in matches
  const etlPlayers = await prisma.etlPlayer.findMany({
    where: {
      matchPlayers: { some: {} }, // only players with match data
    },
    include: {
      currentTeam: true,
    },
  });

  let count = 0;
  for (const ep of etlPlayers) {
    try {
      // Don't overwrite a real name with a numeric ID
      const isNumericName = /^\d+$/.test(ep.name);
      const safeName = isNumericName ? "Unknown" : ep.name;

      await prisma.player.upsert({
        where: { sofascoreId: ep.id },
        create: {
          sofascoreId: ep.id,
          name: safeName,
          position: ep.position ?? 'Unknown',
          sofascoreUrl: `https://www.sofascore.com/player/${ep.slug ?? ep.id}/${ep.id}`,
          imageUrl: ep.imageUrl ?? playerImageUrl(ep.id),
          teamName: ep.currentTeam?.name ?? null,
          teamImageUrl: ep.currentTeam?.imageUrl ?? (ep.currentTeamId ? teamImageUrl(ep.currentTeamId) : null),
        },
        update: {
          // Only update name if the incoming value is a real name (not a numeric ID)
          ...(isNumericName ? {} : { name: ep.name }),
          position: ep.position ?? 'Unknown',
          imageUrl: ep.imageUrl ?? playerImageUrl(ep.id),
          teamName: ep.currentTeam?.name ?? null,
          teamImageUrl: ep.currentTeam?.imageUrl ?? (ep.currentTeamId ? teamImageUrl(ep.currentTeamId) : null),
        },
      });
      count++;
    } catch (err) {
      logger.warn(`[Bridge] Erro ao sync player ${ep.id} (${ep.name}): ${err instanceof Error ? err.message : err}`);
    }
  }
  return count;
}

/* ============================================================================
   Sync Player Match Stats
   ============================================================================ */

async function syncPlayerMatchStats(): Promise<number> {
  // Get all ETL match-player records with shot data
  const matchPlayers = await prisma.etlMatchPlayer.findMany({
    include: {
      match: true,
      player: true,
    },
    orderBy: { match: { startTime: 'desc' } },
    take: 5000,
  });

  let count = 0;

  for (const mp of matchPlayers) {
    try {
      // Find the public match and player
      const publicMatch = await prisma.match.findUnique({
        where: { sofascoreId: mp.matchId },
      });
      const publicPlayer = await prisma.player.findUnique({
        where: { sofascoreId: mp.playerId },
      });

      if (!publicMatch || !publicPlayer) continue;

      // Count shots for this player in this match
      const shotEvents = await prisma.etlShotEvent.findMany({
        where: {
          matchId: mp.matchId,
          playerId: mp.playerId,
        },
      });

      const totalShots = shotEvents.length;
      const shotsOnTarget = shotEvents.filter(
        (s) => s.outcome === 'goal' || s.outcome === 'saved' || s.outcome === 'on-target'
      ).length;
      const goals = shotEvents.filter((s) => s.outcome === 'goal').length;

      await prisma.playerMatchStats.upsert({
        where: {
          playerId_matchId: {
            playerId: publicPlayer.id,
            matchId: publicMatch.id,
          },
        },
        create: {
          playerId: publicPlayer.id,
          matchId: publicMatch.id,
          shots: totalShots,
          shotsOnTarget,
          goals,
          assists: 0,
          minutesPlayed: mp.minutesPlayed ?? 0,
        },
        update: {
          shots: totalShots,
          shotsOnTarget,
          goals,
          minutesPlayed: mp.minutesPlayed ?? 0,
        },
      });
      count++;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao sync stats ${mp.playerId}@${mp.matchId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return count;
}

/* ============================================================================
   Generate Market Analysis
   ============================================================================ */

async function generateMarketAnalysis(): Promise<number> {
  const DEFAULT_LINE = 1.5;

  // Get all public matches that are scheduled (future)
  const scheduledMatches = await prisma.match.findMany({
    where: {
      OR: [
        { status: 'scheduled' },
        { matchDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // include matches within last 24h
      ],
    },
    include: {
      playerStats: {
        include: { player: true },
      },
    },
  });

  let count = 0;

  for (const match of scheduledMatches) {
    // Get all players linked to this match via PlayerMatchStats from other matches
    // Use players that have stats in any match
    const playerIds = new Set<string>();

    // Collect players from this match's stats
    for (const ps of match.playerStats) {
      playerIds.add(ps.player.id);
    }

    // If no direct stats, try to find players from the same teams
    if (playerIds.size === 0) {
      const teamPlayers = await prisma.player.findMany({
        where: {
          OR: [
            { teamName: match.homeTeam },
            { teamName: match.awayTeam },
          ],
        },
        take: 30,
      });
      for (const p of teamPlayers) {
        playerIds.add(p.id);
      }
    }

    for (const playerId of playerIds) {
      try {
        // Get the player's recent match stats (last 10)
        const recentStats = await prisma.playerMatchStats.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        if (recentStats.length < 2) continue; // Need at least 2 matches for analysis

        const shots = recentStats.map((s) => s.shots);
        const avgShots = mean(shots);
        const cv = calcCV(shots);
        const hits = calcHits(shots, DEFAULT_LINE, shots.length);
        const probability = hits / shots.length;

        // Simple odds estimation from probability
        const odds = probability > 0 ? 1 / probability : 10;

        // Confidence based on CV and sample size
        let confidence = 0.5;
        if (cv !== null && cv < 0.3 && shots.length >= 5) confidence = 0.8;
        else if (cv !== null && cv < 0.5 && shots.length >= 3) confidence = 0.6;
        else if (shots.length < 3) confidence = 0.3;

        // Recommendation
        let recommendation = 'NEUTRO';
        if (probability >= 0.7 && confidence >= 0.6) recommendation = 'APOSTAR';
        else if (probability >= 0.5 && confidence >= 0.5) recommendation = 'CONSIDERAR';
        else if (probability < 0.3) recommendation = 'EVITAR';

        const reasoning = `Baseado em ${shots.length} jogos: média ${avgShots.toFixed(1)} chutes, ${hits}/${shots.length} acima da linha ${DEFAULT_LINE}. CV: ${cv?.toFixed(2) ?? 'N/A'}.`;

        await prisma.marketAnalysis.upsert({
          where: {
            // Use a compound approach — find existing or create new
            id: `bridge-${playerId}-${match.id}`,
          },
          create: {
            id: `bridge-${playerId}-${match.id}`,
            playerId,
            matchId: match.id,
            market: `Over ${DEFAULT_LINE} Chutes`,
            odds: Number(odds.toFixed(2)),
            probability: Number(probability.toFixed(3)),
            confidence: Number(confidence.toFixed(2)),
            recommendation,
            reasoning,
          },
          update: {
            odds: Number(odds.toFixed(2)),
            probability: Number(probability.toFixed(3)),
            confidence: Number(confidence.toFixed(2)),
            recommendation,
            reasoning,
          },
        });
        count++;
      } catch (err) {
        logger.warn(
          `[Bridge] Erro ao gerar análise ${playerId}@${match.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  return count;
}
