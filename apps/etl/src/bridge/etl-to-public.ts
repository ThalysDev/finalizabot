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
import { isNumericId, mapStatus } from "./utils.js";

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
   Constants
   ============================================================================ */

/** Advisory lock ID — must be unique across the database */
const BRIDGE_LOCK_ID = 987654321;
const BRIDGE_PAGE_SIZE = Math.max(
  100,
  parseInt(process.env.BRIDGE_PAGE_SIZE ?? "500", 10) || 500,
);

/* ============================================================================
   Main bridge function
   ============================================================================ */

export async function runBridge(): Promise<void> {
  logger.info("[Bridge] Iniciando sincronização ETL → Public...");

  // Acquire advisory lock to prevent concurrent syncs
  const [lockResult] = await prisma.$queryRaw<{ acquired: boolean }[]>`
    SELECT pg_try_advisory_lock(${BRIDGE_LOCK_ID}) as acquired
  `;

  if (!lockResult?.acquired) {
    logger.warn("[Bridge] Outra instância já está rodando — abortando.");
    return;
  }

  try {
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
    const skipImages =
      process.env.SKIP_IMAGE_SYNC === "1" ||
      process.env.SKIP_IMAGE_SYNC === "true";
    if (skipImages) {
      logger.warn(
        "[Bridge] ⚠️  SKIP_IMAGE_SYNC está ATIVADO — imagens NÃO serão baixadas!",
      );
      logger.warn(
        "[Bridge] ⚠️  Escudos e fotos de jogadores podem não carregar no front-end!",
      );
      logger.warn(
        "[Bridge] ⚠️  Recomendado apenas para desenvolvimento/testes rápidos.",
      );
    } else {
      try {
        await syncAllImages();
      } catch (err) {
        logger.warn(
          `[Bridge] Image sync failed (non-fatal): ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    logger.info("[Bridge] Sincronização concluída!");
  } finally {
    await prisma.$queryRaw`
      SELECT pg_advisory_unlock(${BRIDGE_LOCK_ID})
    `;
    logger.info("[Bridge] Advisory lock released.");
  }
}

/* ============================================================================
   Sync Matches
   ============================================================================ */

async function syncMatches(): Promise<number> {
  const matchDaysEnv = parseInt(process.env.BRIDGE_MATCH_DAYS ?? "", 10);
  const matchCutoff = Number.isFinite(matchDaysEnv)
    ? new Date(Date.now() - matchDaysEnv * 24 * 60 * 60 * 1000)
    : null;

  const BATCH_SIZE = 50;
  let count = 0;
  let cursorId: string | undefined;

  while (true) {
    const etlMatches = await prisma.etlMatch.findMany({
      where: matchCutoff ? { startTime: { gte: matchCutoff } } : undefined,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { id: "asc" },
      take: BRIDGE_PAGE_SIZE,
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
    });

    if (etlMatches.length === 0) break;

    for (let i = 0; i < etlMatches.length; i += BATCH_SIZE) {
      const batch = etlMatches.slice(i, i + BATCH_SIZE);
      const ops = batch.map((em) => {
        const data = buildMatchUpsertData(em);
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
        for (const em of batch) {
          try {
            const data = buildMatchUpsertData(em);
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

    cursorId = etlMatches[etlMatches.length - 1]?.id;
  }

  return count;
}

function buildMatchUpsertData(em: {
  statusType: string | null;
  statusCode: number | null;
  startTime: Date;
  tournament: string | null;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { name: string; imageUrl: string | null };
  awayTeam: { name: string; imageUrl: string | null };
}) {
  const resolvedStatus = mapStatus(em.statusType, em.statusCode, em.startTime);
  const homeTeamId = isNumericId(em.homeTeamId) ? em.homeTeamId : undefined;
  const awayTeamId = isNumericId(em.awayTeamId) ? em.awayTeamId : undefined;

  return {
    homeTeam: em.homeTeam.name,
    awayTeam: em.awayTeam.name,
    competition: em.tournament ?? "Unknown",
    matchDate: em.startTime,
    status: resolvedStatus,
    homeScore: em.homeScore ?? null,
    awayScore: em.awayScore ?? null,
    minute: em.minute ?? null,
    homeTeamImageUrl:
      em.homeTeam.imageUrl ?? (homeTeamId ? teamImageUrl(homeTeamId) : null),
    awayTeamImageUrl:
      em.awayTeam.imageUrl ?? (awayTeamId ? teamImageUrl(awayTeamId) : null),
    homeTeamSofascoreId: homeTeamId ?? null,
    awayTeamSofascoreId: awayTeamId ?? null,
  };
}

/* ============================================================================
   Sync Players
   ============================================================================ */

async function syncPlayers(): Promise<number> {
  const matchDaysEnv = parseInt(process.env.BRIDGE_MATCH_DAYS ?? "", 10);
  const matchCutoff = Number.isFinite(matchDaysEnv)
    ? new Date(Date.now() - matchDaysEnv * 24 * 60 * 60 * 1000)
    : null;

  const BATCH_SIZE = 50;
  let count = 0;
  let cursorId: string | undefined;

  while (true) {
    const etlPlayers = await prisma.etlPlayer.findMany({
      where: {
        matchPlayers: {
          some: matchCutoff
            ? { match: { startTime: { gte: matchCutoff } } }
            : {},
        },
      },
      include: {
        currentTeam: true,
      },
      orderBy: { id: "asc" },
      take: BRIDGE_PAGE_SIZE,
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
    });

    if (etlPlayers.length === 0) break;

    for (let i = 0; i < etlPlayers.length; i += BATCH_SIZE) {
      const batch = etlPlayers.slice(i, i + BATCH_SIZE);

      const ops = batch.map((ep) => {
        const isNumericName = /^\d+$/.test(ep.name);
        const safeName = isNumericName ? "Unknown" : ep.name;

        return prisma.player.upsert({
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
            ...(isNumericName ? {} : { name: ep.name }),
            position: ep.position ?? "Unknown",
            imageUrl: ep.imageUrl ?? playerImageUrl(ep.id),
            teamName: ep.currentTeam?.name ?? null,
            teamImageUrl:
              ep.currentTeam?.imageUrl ??
              (ep.currentTeamId ? teamImageUrl(ep.currentTeamId) : null),
          },
        });
      });

      try {
        await prisma.$transaction(ops);
        count += batch.length;
      } catch (err) {
        logger.warn(
          `[Bridge] Batch player sync failed (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${err instanceof Error ? err.message : err}`,
        );
        for (const ep of batch) {
          try {
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
          } catch (innerErr) {
            logger.warn(
              `[Bridge] Erro ao sync player ${ep.id}: ${innerErr instanceof Error ? innerErr.message : innerErr}`,
            );
          }
        }
      }
    }

    cursorId = etlPlayers[etlPlayers.length - 1]?.id;
  }

  return count;
}

/* ============================================================================
   Sync Player Match Stats
   ============================================================================ */

async function syncPlayerMatchStats(): Promise<number> {
  const matchDaysEnv = parseInt(process.env.BRIDGE_MATCH_DAYS ?? "", 10);
  const matchCutoff = Number.isFinite(matchDaysEnv)
    ? new Date(Date.now() - matchDaysEnv * 24 * 60 * 60 * 1000)
    : null;
  type CountRow = { count: number | bigint | string };

  const result = await prisma.$queryRaw<CountRow[]>`
      WITH aggregated AS (
        SELECT
          p."id" AS "playerId",
          m."id" AS "matchId",
          COUNT(se."id")::int AS "shots",
          COUNT(*) FILTER (
            WHERE se."outcome" IN ('goal', 'on_target')
          )::int AS "shotsOnTarget",
          COUNT(*) FILTER (
            WHERE se."outcome" = 'goal'
          )::int AS "goals",
          COALESCE(mp."minutesPlayed", 0)::int AS "minutesPlayed"
        FROM etl."MatchPlayer" mp
        INNER JOIN etl."Match" em
          ON em."id" = mp."matchId"
        INNER JOIN "Match" m
          ON m."sofascoreId" = mp."matchId"
        INNER JOIN "Player" p
          ON p."sofascoreId" = mp."playerId"
        LEFT JOIN etl."ShotEvent" se
          ON se."matchId" = mp."matchId"
          AND se."playerId" = mp."playerId"
        WHERE (${matchCutoff}::timestamptz IS NULL OR em."startTime" >= ${matchCutoff}::timestamptz)
        GROUP BY
          p."id",
          m."id",
          mp."minutesPlayed"
      ),
      upserted AS (
        INSERT INTO "PlayerMatchStats" (
          "playerId",
          "matchId",
          "shots",
          "shotsOnTarget",
          "goals",
          "assists",
          "minutesPlayed"
        )
        SELECT
          a."playerId",
          a."matchId",
          a."shots",
          a."shotsOnTarget",
          a."goals",
          0,
          a."minutesPlayed"
        FROM aggregated a
        ON CONFLICT ("playerId", "matchId")
        DO UPDATE SET
          "shots" = EXCLUDED."shots",
          "shotsOnTarget" = EXCLUDED."shotsOnTarget",
          "goals" = EXCLUDED."goals",
          "minutesPlayed" = EXCLUDED."minutesPlayed",
          "updatedAt" = NOW()
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count
      FROM upserted
    `;

  const total = result[0]?.count;
  if (typeof total === "number") return total;
  if (typeof total === "bigint") return Number(total);
  return total != null ? parseInt(String(total), 10) || 0 : 0;
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

  // ── Query last 10 stats per player in one DB roundtrip (avoid N+1) ─────
  const playerIds = [...allPlayerIds];
  const statsByPlayer = new Map<string, number[]>(
    playerIds.map((playerId) => [playerId, []]),
  );

  type PlayerShotRow = { playerId: string; shots: number };
  const recentShots = await prisma.$queryRaw<PlayerShotRow[]>`
      SELECT ranked."playerId" as "playerId", ranked."shots" as "shots"
      FROM (
        SELECT
          pms."playerId",
          pms."shots",
          ROW_NUMBER() OVER (
            PARTITION BY pms."playerId"
            ORDER BY m."matchDate" DESC
          ) as rn
        FROM "PlayerMatchStats" pms
        INNER JOIN "Match" m ON m."id" = pms."matchId"
        WHERE pms."playerId" = ANY(${playerIds}::text[])
          AND m."status" = 'finished'
      ) ranked
      WHERE ranked.rn <= 10
      ORDER BY ranked."playerId", ranked.rn
    `;

  for (const row of recentShots) {
    const shots = statsByPlayer.get(row.playerId);
    if (!shots) continue;
    shots.push(row.shots);
  }

  // ── Build analysis data in-memory, then batch upsert ───────────
  const BATCH_SIZE = 50;
  let count = 0;

  interface AnalysisData {
    id: string;
    playerId: string;
    matchId: string;
    market: string;
    odds: number;
    probability: number;
    confidence: number;
    recommendation: string;
    reasoning: string;
  }

  const analysisItems: AnalysisData[] = [];

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
      else if (probability >= 0.5 && confidence >= 0.5)
        recommendation = "CONSIDERAR";
      else if (probability < 0.3) recommendation = "EVITAR";

      const reasoning = `Baseado em ${shots.length} jogos: média ${avgShots.toFixed(1)} chutes, ${hits}/${shots.length} acima da linha ${DEFAULT_LINE}. CV: ${cv?.toFixed(2) ?? "N/A"}.`;

      analysisItems.push({
        id: `bridge-${playerId}-${match.id}`,
        playerId,
        matchId: match.id,
        market: `Over ${DEFAULT_LINE} Chutes`,
        odds: Number(odds.toFixed(2)),
        probability: Number(probability.toFixed(3)),
        confidence: Number(confidence.toFixed(2)),
        recommendation,
        reasoning,
      });
    }
  }

  // Helper to create a fresh upsert promise from data
  function buildAnalysisUpsert(item: AnalysisData) {
    return prisma.marketAnalysis.upsert({
      where: { id: item.id },
      create: item,
      update: {
        odds: item.odds,
        probability: item.probability,
        confidence: item.confidence,
        recommendation: item.recommendation,
        reasoning: item.reasoning,
      },
    });
  }

  // Execute in batched transactions
  for (let i = 0; i < analysisItems.length; i += BATCH_SIZE) {
    const batchData = analysisItems.slice(i, i + BATCH_SIZE);
    try {
      await prisma.$transaction(batchData.map(buildAnalysisUpsert));
      count += batchData.length;
    } catch (err) {
      logger.warn(
        `[Bridge] Erro ao gerar análise batch (offset ${i}): ${err instanceof Error ? err.message : err}`,
      );
      // Fallback: try individually (fresh promise per item)
      for (const item of batchData) {
        try {
          await buildAnalysisUpsert(item);
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
