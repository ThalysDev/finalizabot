/**
 * Sync Script — FinalizaBOT
 *
 * Descobre partidas do dia via SofaScore API, busca escalações,
 * cria/atualiza registros no Neon PostgreSQL, e opcionalmente
 * enriquece com MarketAnalysis via ETL API.
 *
 * Uso:
 *   npm run sync            # Sincroniza hoje
 *   SYNC_DATE=2026-02-10 npm run sync   # Sincroniza data específica
 *
 * Variáveis de ambiente:
 *   DATABASE_URL           — Connection string Neon (obrigatório)
 *   SOFASCORE_ETL_API_URL  — URL do ETL API (opcional, para enriquecimento)
 *   SYNC_TOURNAMENTS       — IDs de torneios separados por vírgula (opcional)
 *   SYNC_DATE              — Data YYYY-MM-DD (default: hoje)
 *   SYNC_SKIP_LINEUPS      — "true" para pular busca de escalações
 */

import { PrismaClient } from "@prisma/client";
import {
  fetchScheduledEvents,
  filterByTournaments,
  fetchEventLineups,
  mapPosition,
  DEFAULT_TOURNAMENT_IDS,
  type SofascoreEvent,
  type SofascoreLineupPlayer,
} from "./sofascore-api";

const prisma = new PrismaClient();

/* ============================================================================
   CONFIG
   ============================================================================ */

function getSyncDate(): string {
  if (process.env.SYNC_DATE) return process.env.SYNC_DATE;
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getTournamentIds(): number[] {
  if (process.env.SYNC_TOURNAMENTS) {
    return process.env.SYNC_TOURNAMENTS.split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  return DEFAULT_TOURNAMENT_IDS;
}

function getEtlBaseUrl(): string {
  const url =
    process.env.SOFASCORE_ETL_API_URL ?? process.env.ETL_API_BASE_URL ?? "";
  return url.replace(/\/+$/, "");
}

/* ============================================================================
   ETL API CALLS (optional enrichment)
   ============================================================================ */

interface EtlLastMatchItem {
  matchId: string;
  startTime: string;
  tournament: string;
  season: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  shotCount: number;
  shotsOnTarget: number;
  minutesPlayed: number | null;
}

async function fetchEtlLastMatches(
  etlBase: string,
  sofascoreId: string,
  limit = 10,
): Promise<EtlLastMatchItem[] | null> {
  try {
    const res = await fetch(
      `${etlBase}/players/${sofascoreId}/last-matches?limit=${limit}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { items: EtlLastMatchItem[] };
    return data.items ?? null;
  } catch {
    return null;
  }
}

/* ============================================================================
   MARKET ANALYSIS COMPUTATION
   ============================================================================ */

function computeMarketAnalysis(
  items: EtlLastMatchItem[],
  line: number,
): {
  market: string;
  odds: number;
  probability: number;
  confidence: number;
  recommendation: string;
  reasoning: string;
} {
  if (items.length === 0) {
    return {
      market: `Over ${line} Chutes`,
      odds: 0,
      probability: 0,
      confidence: 0,
      recommendation: "AGUARDAR",
      reasoning: "Dados insuficientes",
    };
  }

  const shots = items.map((i) => i.shotCount);
  const total = shots.reduce((a, b) => a + b, 0);
  const avg = total / shots.length;
  const overCount = shots.filter((s) => s > line).length;
  const hitRate = overCount / shots.length;

  // Coefficient of Variation
  const variance =
    shots.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / shots.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 1;

  // Fair probability (historical hit rate)
  const probability = hitRate;

  // Implied odds (with ~10% margin for bookmaker edge)
  const fairOdds = probability > 0 ? 1 / probability : 10;
  const bookmakerOdds = fairOdds * 0.9; // ~10% vig

  // Confidence based on sample size and CV
  let confidence = 0.5;
  if (items.length >= 8) confidence += 0.15;
  if (items.length >= 5) confidence += 0.1;
  if (cv <= 0.3) confidence += 0.15;
  else if (cv <= 0.5) confidence += 0.05;
  confidence = Math.min(confidence, 1);

  // Recommendation
  let recommendation = "AGUARDAR";
  if (probability >= 0.7 && cv <= 0.35) recommendation = "APOSTAR";
  else if (probability >= 0.6 && cv <= 0.45) recommendation = "CONSIDERAR";
  else if (probability < 0.4) recommendation = "EVITAR";

  // Reasoning
  const reasoning = `${items.length} jogos analisados. Média: ${avg.toFixed(1)} chutes. Hit rate Over ${line}: ${(hitRate * 100).toFixed(0)}% (${overCount}/${items.length}). CV: ${cv.toFixed(2)}.`;

  return {
    market: `Over ${line} Chutes`,
    odds: Number(bookmakerOdds.toFixed(2)),
    probability: Number(probability.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    recommendation,
    reasoning,
  };
}

/* ============================================================================
   MAIN SYNC
   ============================================================================ */

async function sync() {
  const date = getSyncDate();
  const tournamentIds = getTournamentIds();
  const etlBase = getEtlBaseUrl();
  const skipLineups = process.env.SYNC_SKIP_LINEUPS === "true";
  const line = 1.5; // Linha padrão

  console.log(`\n🔄 Sync FinalizaBOT — ${date}`);
  console.log(`   Torneios monitorados: ${tournamentIds.length}`);
  console.log(`   ETL API: ${etlBase || "NÃO CONFIGURADA"}`);
  console.log(`   Skip lineups: ${skipLineups}\n`);

  // ── Step 1: Descobrir partidas do dia ──────────────────────────────────
  console.log("📅 Buscando partidas agendadas...");
  const allEvents = await fetchScheduledEvents(date);
  console.log(`   Total de eventos futebol: ${allEvents.length}`);

  const events = filterByTournaments(allEvents, tournamentIds);
  console.log(`   Partidas em torneios monitorados: ${events.length}`);

  if (events.length === 0) {
    console.log("ℹ️  Nenhuma partida encontrada para os torneios monitorados.");
    console.log("   Torneios configurados:", tournamentIds.join(", "));
    await prisma.$disconnect();
    return;
  }

  // ── Step 2: Upsert partidas no banco ───────────────────────────────────
  console.log("\n💾 Salvando partidas no banco...");
  const matchMap = new Map<number, string>(); // sofascoreEventId → prismaMatchId

  for (const event of events) {
    const matchDate = new Date(event.startTimestamp * 1000);
    const competition =
      event.tournament.uniqueTournament?.name ?? event.tournament.name;
    const sofascoreId = String(event.id);

    try {
      const match = await prisma.match.upsert({
        where: { sofascoreId },
        update: {
          homeTeam: event.homeTeam.name,
          awayTeam: event.awayTeam.name,
          competition,
          matchDate,
          status: mapEventStatus(event.status.type),
        },
        create: {
          sofascoreId,
          homeTeam: event.homeTeam.name,
          awayTeam: event.awayTeam.name,
          competition,
          matchDate,
          status: mapEventStatus(event.status.type),
        },
      });

      matchMap.set(event.id, match.id);
      console.log(
        `   ✅ ${event.homeTeam.name} vs ${event.awayTeam.name} (${competition})`,
      );
    } catch (err) {
      console.warn(
        `   ⚠️  Erro ao salvar partida ${event.id}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`   ${matchMap.size} partidas salvas\n`);

  if (skipLineups) {
    console.log("⏭️  Pulando busca de escalações (SYNC_SKIP_LINEUPS=true)");
    await prisma.$disconnect();
    return;
  }

  // ── Step 3: Buscar escalações e upsert jogadores ───────────────────────
  console.log("👥 Buscando escalações...");
  let totalPlayers = 0;
  let totalAnalyses = 0;

  for (const event of events) {
    const prismaMatchId = matchMap.get(event.id);
    if (!prismaMatchId) continue;

    // Rate limiting — espera 500ms entre chamadas para não sobrecarregar
    await sleep(500);

    const lineups = await fetchEventLineups(event.id);
    if (!lineups) {
      console.log(
        `   ⏭️  Sem escalação: ${event.homeTeam.name} vs ${event.awayTeam.name}`,
      );
      continue;
    }

    const allPlayers: Array<{
      player: SofascoreLineupPlayer;
      teamName: string;
    }> = [];

    // Players do time da casa (apenas titulares, não goleiros)
    if (lineups.home?.players) {
      for (const p of lineups.home.players) {
        if (!p.substitute && p.player.position !== "G") {
          allPlayers.push({ player: p, teamName: event.homeTeam.name });
        }
      }
    }

    // Players do time visitante (apenas titulares, não goleiros)
    if (lineups.away?.players) {
      for (const p of lineups.away.players) {
        if (!p.substitute && p.player.position !== "G") {
          allPlayers.push({ player: p, teamName: event.awayTeam.name });
        }
      }
    }

    console.log(
      `   📋 ${event.homeTeam.name} vs ${event.awayTeam.name}: ${allPlayers.length} jogadores de campo`,
    );

    // Upsert cada jogador
    for (const { player: lp, teamName } of allPlayers) {
      const sofascoreId = String(lp.player.id);
      const name = lp.player.name ?? lp.player.shortName ?? "Desconhecido";
      const position = mapPosition(lp.player.position);
      const slug = lp.player.slug ?? sofascoreId;

      try {
        const player = await prisma.player.upsert({
          where: { sofascoreId },
          update: { name, position },
          create: {
            sofascoreId,
            name,
            position,
            sofascoreUrl: `https://www.sofascore.com/pt/jogador/${slug}/${sofascoreId}`,
          },
        });

        totalPlayers++;

        // ── Step 4: Enriquecer com ETL (se disponível) ───────────────
        if (etlBase) {
          const items = await fetchEtlLastMatches(etlBase, sofascoreId, 10);

          if (items && items.length > 0) {
            const analysis = computeMarketAnalysis(items, line);

            // Delete existing analysis for this player+match, then create new
            await prisma.marketAnalysis.deleteMany({
              where: {
                playerId: player.id,
                matchId: prismaMatchId,
              },
            });

            await prisma.marketAnalysis.create({
              data: {
                playerId: player.id,
                matchId: prismaMatchId,
                ...analysis,
              },
            });

            totalAnalyses++;
          }
        }
      } catch (err) {
        console.warn(
          `   ⚠️  Erro jogador ${name}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  console.log(`\n✅ Sync concluído!`);
  console.log(`   📅 Partidas: ${matchMap.size}`);
  console.log(`   👥 Jogadores: ${totalPlayers}`);
  console.log(`   📊 Análises: ${totalAnalyses}`);

  await prisma.$disconnect();
}

/* ============================================================================
   HELPERS
   ============================================================================ */

function mapEventStatus(type: string): string {
  switch (type) {
    case "notstarted":
      return "scheduled";
    case "inprogress":
      return "live";
    case "finished":
      return "finished";
    default:
      return "scheduled";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ============================================================================
   RUN
   ============================================================================ */

sync().catch((err) => {
  console.error("❌ Erro no sync:", err);
  process.exit(1);
});
