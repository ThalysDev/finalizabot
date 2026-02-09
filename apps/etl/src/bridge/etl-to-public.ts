/**
 * ETL → Public Bridge
 *
 * Copia dados da schema `etl` para a schema `public`,
 * preenchendo Match, Player, PlayerMatchStats e MarketAnalysis.
 *
 * Execução: MODE=bridge tsx src/index.ts
 */

import { prisma } from "@finalizabot/shared";
import { calcHits, mean, stdev, calcCV } from "@finalizabot/shared";
import { logger } from "../lib/logger.js";
import { syncAllImages } from "../services/imageDownloader.js";

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
  logger.info("[Bridge] Iniciando sincronização ETL → Public...");

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
    logger.warn(
      `[Bridge] Image sync failed (non-fatal): ${err instanceof Error ? err.message : err}`,
    );
  }

  logger.info("[Bridge] Sincronização concluída!");
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
    orderBy: { startTime: "desc" },
    take: 200,
  });

  // Batch upserts in chunks of 50 inside a transaction
  const BATCH_SIZE = 50;
  let count = 0;

  for (let i = 0; i < etlMatches.length; i += BATCH_SIZE) {
    const batch = etlMatches.slice(i, i + BATCH_SIZE);
    const ops = batch.map((em) => {
      const resolvedStatus = mapStatus(em.statusType, em.statusCode, em.startTime);
      const homeTeamId = isNumericId(em.homeTeamId) ? em.homeTeamId : undefined;
      const awayTeamId = isNumericId(em.awayTeamId) ? em.awayTeamId : undefined;
      const data = {
        homeTeam: em.homeTeam.name,
        awayTeam: em.awayTeam.name,
        competition: em.tournament ?? "Unknown",
        matchDate: em.startTime,
        status: resolvedStatus,
        homeScore: em.homeScore ?? null,
        awayScore: em.awayScore ?? null,
        minute: em.minute ?? null,
        homeTeamImageUrl: em.homeTeam.imageUrl ?? (homeTeamId ? teamImageUrl(homeTeamId) : null),
        awayTeamImageUrl: em.awayTeam.imageUrl ?? (awayTeamId ? teamImageUrl(awayTeamId) : null),
        homeTeamSofascoreId: homeTeamId ?? null,
        awayTeamSofascoreId: awayTeamId ?? null,
      };
      return prisma.match.upsert({
        where: { sofascoreId: em.id },
        create: { sofascoreId: em.id, ...data },
        update: data,
      });
    });

    try {
      await prisma.$transaction(ops);
      count += batch.length;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao sync batch de matches (offset ${i}): ${err instanceof Error ? err.message : err}`,
      );
      // Fallback: try individually for this failed batch
      for (const em of batch) {
        try {
          const resolvedStatus = mapStatus(em.statusType, em.statusCode, em.startTime);
          const homeTeamId = isNumericId(em.homeTeamId) ? em.homeTeamId : undefined;
          const awayTeamId = isNumericId(em.awayTeamId) ? em.awayTeamId : undefined;
          const data = {
            homeTeam: em.homeTeam.name,
            awayTeam: em.awayTeam.name,
            competition: em.tournament ?? "Unknown",
            matchDate: em.startTime,
            status: resolvedStatus,
            homeScore: em.homeScore ?? null,
            awayScore: em.awayScore ?? null,
            minute: em.minute ?? null,
            homeTeamImageUrl: em.homeTeam.imageUrl ?? (homeTeamId ? teamImageUrl(homeTeamId) : null),
            awayTeamImageUrl: em.awayTeam.imageUrl ?? (awayTeamId ? teamImageUrl(awayTeamId) : null),
            homeTeamSofascoreId: homeTeamId ?? null,
            awayTeamSofascoreId: awayTeamId ?? null,
          };
          await prisma.match.upsert({
            where: { sofascoreId: em.id },
            create: { sofascoreId: em.id, ...data },
            update: data,
          });
          count++;
        } catch (innerErr) {
          logger.warn(
            `[Bridge] Erro ao sync match ${em.id}: ${innerErr instanceof Error ? innerErr.message : innerErr}`,
          );
        }
      }
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
  if (type === "finished") return "finished";
  if (type === "inprogress" || type === "live") return "live";
  if (type === "notstarted") return "scheduled";
  if (statusCode === 100) return "finished";
  if (statusCode === 0 || statusCode === 1) return "scheduled";
  if (statusCode === 2 || statusCode === 3) return "live";
  return startTime < new Date() ? "finished" : "scheduled";
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
          position: ep.position ?? "Unknown",
          sofascoreUrl: `https://www.sofascore.com/player/${ep.slug ?? ep.id}/${ep.id}`,
          imageUrl: ep.imageUrl ?? playerImageUrl(ep.id),
          teamName: ep.currentTeam?.name ?? null,
          teamImageUrl:
            ep.currentTeam?.imageUrl ??
            (ep.currentTeamId ? teamImageUrl(ep.currentTeamId) : null),
        },
        update: {
          // Only update name if the incoming value is a real name (not a numeric ID)
          ...(isNumericName ? {} : { name: ep.name }),
          position: ep.position ?? "Unknown",
          imageUrl: ep.imageUrl ?? playerImageUrl(ep.id),
          teamName: ep.currentTeam?.name ?? null,
          teamImageUrl:
            ep.currentTeam?.imageUrl ??
            (ep.currentTeamId ? teamImageUrl(ep.currentTeamId) : null),
        },
      });
      count++;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao sync player ${ep.id} (${ep.name}): ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  return count;
}

/* ============================================================================
   Sync Player Match Stats
   ============================================================================ */

async function syncPlayerMatchStats(): Promise<number> {
  // Get all ETL match-player records
  const matchPlayers = await prisma.etlMatchPlayer.findMany({
    include: {
      match: true,
      player: true,
    },
    orderBy: { match: { startTime: "desc" } },
    take: 5000,
  });

  if (matchPlayers.length === 0) return 0;

  // ── Pre-load lookup maps (eliminates N+1) ─────────────────────
  const etlMatchIds = [...new Set(matchPlayers.map((mp) => mp.matchId))];
  const etlPlayerIds = [...new Set(matchPlayers.map((mp) => mp.playerId))];

  // Load all public matches by sofascoreId
  const publicMatches = await prisma.match.findMany({
    where: { sofascoreId: { in: etlMatchIds } },
    select: { id: true, sofascoreId: true },
  });
  const matchMap = new Map(publicMatches.map((m) => [m.sofascoreId, m.id]));

  // Load all public players by sofascoreId
  const publicPlayers = await prisma.player.findMany({
    where: { sofascoreId: { in: etlPlayerIds } },
    select: { id: true, sofascoreId: true },
  });
  const playerMap = new Map(publicPlayers.map((p) => [p.sofascoreId, p.id]));

  // Pre-load ALL shot events for these matches/players in a single query
  const allShotEvents = await prisma.etlShotEvent.findMany({
    where: {
      matchId: { in: etlMatchIds },
      playerId: { in: etlPlayerIds },
    },
    select: { matchId: true, playerId: true, outcome: true },
  });

  // Group shot events by matchId+playerId
  const shotMap = new Map<string, typeof allShotEvents>();
  for (const shot of allShotEvents) {
    const key = `${shot.matchId}:${shot.playerId}`;
    const arr = shotMap.get(key) ?? [];
    arr.push(shot);
    shotMap.set(key, arr);
  }

  // ── Build upsert operations ───────────────────────────────────
  const BATCH_SIZE = 50;
  let count = 0;

  const validOps: Array<ReturnType<typeof prisma.playerMatchStats.upsert>> = [];

  for (const mp of matchPlayers) {
    const publicMatchId = matchMap.get(mp.matchId);
    const publicPlayerId = playerMap.get(mp.playerId);
    if (!publicMatchId || !publicPlayerId) continue;

    const shotEvents = shotMap.get(`${mp.matchId}:${mp.playerId}`) ?? [];
    const totalShots = shotEvents.length;
    const shotsOnTarget = shotEvents.filter(
      (s) => s.outcome === "goal" || s.outcome === "on_target",
    ).length;
    const goals = shotEvents.filter((s) => s.outcome === "goal").length;

    validOps.push(
      prisma.playerMatchStats.upsert({
        where: {
          playerId_matchId: {
            playerId: publicPlayerId,
            matchId: publicMatchId,
          },
        },
        create: {
          playerId: publicPlayerId,
          matchId: publicMatchId,
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
      }),
    );
  }

  // Execute in batched transactions
  for (let i = 0; i < validOps.length; i += BATCH_SIZE) {
    const batch = validOps.slice(i, i + BATCH_SIZE);
    try {
      await prisma.$transaction(batch);
      count += batch.length;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao sync stats batch (offset ${i}): ${err instanceof Error ? err.message : err}`,
      );
      // Fallback: try individually
      for (const op of batch) {
        try {
          await op;
          count++;
        } catch (innerErr) {
          logger.warn(
            `[Bridge] Erro ao sync stat individual: ${innerErr instanceof Error ? innerErr.message : innerErr}`,
          );
        }
      }
    }
  }

  return count;
}

/* ============================================================================
   Generate Market Analysis
   ============================================================================ */

async function generateMarketAnalysis(): Promise<number> {
  const DEFAULT_LINE = 1.5;

  // Get all public matches that are scheduled or recent
  const scheduledMatches = await prisma.match.findMany({
    where: {
      OR: [
        { status: "scheduled" },
        { matchDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
    include: {
      playerStats: {
        include: { player: true },
      },
    },
  });

  if (scheduledMatches.length === 0) return 0;

  // ── Collect all unique playerIds across all matches ───────────
  const allPlayerIds = new Set<string>();
  const matchPlayerMap = new Map<string, Set<string>>(); // matchId → Set<playerId>

  for (const match of scheduledMatches) {
    const pids = new Set<string>();
    for (const ps of match.playerStats) {
      pids.add(ps.player.id);
      allPlayerIds.add(ps.player.id);
    }
    matchPlayerMap.set(match.id, pids);
  }

  // For matches with no direct stats, find players from same teams (batched)
  const matchesWithoutPlayers = scheduledMatches.filter(
    (m) => (matchPlayerMap.get(m.id)?.size ?? 0) === 0,
  );

  if (matchesWithoutPlayers.length > 0) {
    const teamNames = new Set<string>();
    for (const m of matchesWithoutPlayers) {
      teamNames.add(m.homeTeam);
      teamNames.add(m.awayTeam);
    }

    const teamPlayers = await prisma.player.findMany({
      where: { teamName: { in: [...teamNames] } },
      select: { id: true, teamName: true },
    });

    // Map team → playerIds
    const teamToPlayers = new Map<string, string[]>();
    for (const p of teamPlayers) {
      if (!p.teamName) continue;
      const arr = teamToPlayers.get(p.teamName) ?? [];
      arr.push(p.id);
      teamToPlayers.set(p.teamName, arr);
    }

    for (const match of matchesWithoutPlayers) {
      const pids = matchPlayerMap.get(match.id) ?? new Set();
      const homePlayers = teamToPlayers.get(match.homeTeam) ?? [];
      const awayPlayers = teamToPlayers.get(match.awayTeam) ?? [];
      for (const pid of [...homePlayers, ...awayPlayers].slice(0, 30)) {
        pids.add(pid);
        allPlayerIds.add(pid);
      }
      matchPlayerMap.set(match.id, pids);
    }
  }

  if (allPlayerIds.size === 0) return 0;

  // ── Pre-load all recent stats for all players in ONE query ────
  const allRecentStats = await prisma.playerMatchStats.findMany({
    where: { playerId: { in: [...allPlayerIds] } },
    orderBy: { match: { matchDate: "desc" } },
    select: { playerId: true, shots: true },
  });

  // Group by playerId, keep only last 10 per player
  const statsByPlayer = new Map<string, number[]>();
  for (const s of allRecentStats) {
    const arr = statsByPlayer.get(s.playerId) ?? [];
    if (arr.length < 10) arr.push(s.shots);
    statsByPlayer.set(s.playerId, arr);
  }

  // ── Build all upsert operations in-memory ─────────────────────
  const BATCH_SIZE = 50;
  let count = 0;
  const ops: Array<ReturnType<typeof prisma.marketAnalysis.upsert>> = [];

  for (const match of scheduledMatches) {
    const playerIds = matchPlayerMap.get(match.id) ?? new Set();

    for (const playerId of playerIds) {
      const shots = statsByPlayer.get(playerId);
      if (!shots || shots.length < 2) continue;

      const avgShots = mean(shots);
      const cv = calcCV(shots);
      const hits = calcHits(shots, DEFAULT_LINE, shots.length);
      const probability = hits / shots.length;
      const odds = probability > 0 ? 1 / probability : 10;

      let confidence = 0.5;
      if (cv !== null && cv < 0.3 && shots.length >= 5) confidence = 0.8;
      else if (cv !== null && cv < 0.5 && shots.length >= 3) confidence = 0.6;
      else if (shots.length < 3) confidence = 0.3;

      let recommendation = "NEUTRO";
      if (probability >= 0.7 && confidence >= 0.6) recommendation = "APOSTAR";
      else if (probability >= 0.5 && confidence >= 0.5) recommendation = "CONSIDERAR";
      else if (probability < 0.3) recommendation = "EVITAR";

      const reasoning = `Baseado em ${shots.length} jogos: média ${avgShots.toFixed(1)} chutes, ${hits}/${shots.length} acima da linha ${DEFAULT_LINE}. CV: ${cv?.toFixed(2) ?? "N/A"}.`;

      ops.push(
        prisma.marketAnalysis.upsert({
          where: { id: `bridge-${playerId}-${match.id}` },
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
        }),
      );
    }
  }

  // Execute in batched transactions
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = ops.slice(i, i + BATCH_SIZE);
    try {
      await prisma.$transaction(batch);
      count += batch.length;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao gerar análise batch (offset ${i}): ${err instanceof Error ? err.message : err}`,
      );
      // Fallback: try individually
      for (const op of batch) {
        try {
          await op;
          count++;
        } catch (innerErr) {
          logger.warn(
            `[Bridge] Erro ao gerar análise individual: ${innerErr instanceof Error ? innerErr.message : innerErr}`,
          );
        }
      }
    }
  }

  return count;
}
