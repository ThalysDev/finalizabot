import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { batchEnrichPlayers } from '@/lib/etl/enricher';
import { DEFAULT_LINE } from '@/lib/etl/config';
import { calcCV, calcHits, mean } from '@finalizabot/shared/calc';
import { formatDateTime } from '@/lib/format/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[DEBUG TABLE] Starting...');

  try {
    const line = DEFAULT_LINE;
    console.log('[DEBUG TABLE] Using line:', line);

    // Fetch players and upcoming match
    console.log('[DEBUG TABLE] Fetching players and match from DB...');

    // Get top players by match stats count
    const topPlayerIds = await prisma.$queryRaw<Array<{ playerId: string, count: bigint }>>`
      SELECT "playerId", COUNT(*) as count
      FROM "PlayerMatchStats"
      GROUP BY "playerId"
      HAVING COUNT(*) >= 5
      ORDER BY count DESC
      LIMIT 50
    `;
    console.log('[DEBUG TABLE] Top player IDs:', topPlayerIds.length);

    const [dbPlayers, upcomingMatch] = await Promise.all([
      prisma.player.findMany({
        where: {
          id: { in: topPlayerIds.map(p => p.playerId) }
        }
      }),
      prisma.match.findFirst({
        where: { status: 'scheduled', matchDate: { gte: new Date() } },
        orderBy: { matchDate: 'asc' },
      }),
    ]);

    console.log('[DEBUG TABLE] DB fetch success:', {
      playerCount: dbPlayers.length,
      hasMatch: !!upcomingMatch
    });

    // Try ETL enrichment
    let enriched = new Map();
    let etlError = null;
    try {
      console.log('[DEBUG TABLE] Attempting ETL enrichment...');
      enriched = await batchEnrichPlayers(
        dbPlayers.map((p) => ({ sofascoreId: p.sofascoreId })),
        line,
      );
      console.log('[DEBUG TABLE] ETL enrichment success:', enriched.size, 'players');
    } catch (etlErr: any) {
      etlError = {
        message: etlErr?.message,
        stack: etlErr?.stack,
        name: etlErr?.name,
      };
      console.log('[DEBUG TABLE] ETL enrichment failed:', etlErr);
    }

    // Fetch odds
    let oddsMap = new Map();
    try {
      const analyses = await prisma.marketAnalysis.findMany({
        where: { playerId: { in: dbPlayers.map((p) => p.id) } },
        orderBy: { createdAt: 'desc' },
        distinct: ['playerId'],
        select: { playerId: true, odds: true },
      });
      oddsMap = new Map(analyses.map((a) => [a.playerId, a.odds]));
      console.log('[DEBUG TABLE] Odds fetched:', oddsMap.size);
    } catch (err: any) {
      console.error('[DEBUG TABLE] Odds fetch failed:', err);
    }

    // Check ETL data
    const hasEtlData = Array.from(enriched.values()).some((e: any) => e.stats !== null);
    console.log('[DEBUG TABLE] Has ETL data:', hasEtlData);

    // Fetch PlayerMatchStats for fallback
    let allStats: any[] = [];
    let statsError = null;
    try {
      console.log('[DEBUG TABLE] Fetching PlayerMatchStats...');
      allStats = await prisma.playerMatchStats.findMany({
        where: { playerId: { in: dbPlayers.map((p) => p.id) } },
        orderBy: { match: { matchDate: 'desc' } },
        select: { playerId: true, shots: true, minutesPlayed: true },
      });
      console.log('[DEBUG TABLE] PlayerMatchStats fetch success:', allStats.length, 'records');
    } catch (err: any) {
      statsError = {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      };
      console.error('[DEBUG TABLE] PlayerMatchStats fetch failed:', err);
    }

    // Format match data
    let match = null;
    let matchError = null;
    try {
      if (upcomingMatch) {
        match = {
          homeTeam: upcomingMatch.homeTeam ?? '—',
          awayTeam: upcomingMatch.awayTeam ?? '—',
          competition: upcomingMatch.competition ?? '—',
          matchDate: formatDateTime(upcomingMatch.matchDate),
        };
      }
    } catch (err: any) {
      matchError = {
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
      };
      console.error('[DEBUG TABLE] Match formatting error:', err);
    }

    // Return debug info
    return NextResponse.json({
      success: true,
      debug: {
        playerCount: dbPlayers.length,
        hasMatch: !!upcomingMatch,
        hasEtlData,
        etlEnrichedCount: enriched.size,
        oddsCount: oddsMap.size,
        statsCount: allStats.length,
        line,
      },
      errors: {
        etlError,
        statsError,
        matchError,
      },
      data: {
        playersPreview: dbPlayers.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          sofascoreId: p.sofascoreId,
          position: p.position,
        })),
        match,
      },
    });

  } catch (err: any) {
    console.error('[DEBUG TABLE] Unexpected error:', err);
    return NextResponse.json({
      success: false,
      error: {
        message: err?.message || String(err),
        stack: err?.stack,
        name: err?.name,
        cause: err?.cause,
      },
    }, { status: 500 });
  }
}
