import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.marketAnalysis.deleteMany();
  await prisma.playerMatchStats.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  console.log("🗑️  Dados anteriores limpos");

  // ── JOGADORES ──────────────────────────────────────────────────────────
  const players = await Promise.all([
    prisma.player.create({
      data: {
        sofascoreId: "971232",
        name: "Alonso Martinez",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/martinez-alonso/971232",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "934874",
        name: "Pedro",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/pedro/934874",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "865600",
        name: "Raphael Veiga",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/veiga-raphael/865600",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "952349",
        name: "Luiz Henrique",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/luiz-henrique/952349",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "871673",
        name: "Arrascaeta",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/arrascaeta/871673",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "860652",
        name: "Estêvão",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/estevao/860652",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "822456",
        name: "Hulk",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/hulk/822456",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "837209",
        name: "Vegetti",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/vegetti/837209",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "913651",
        name: "Yuri Alberto",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/yuri-alberto/913651",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "889012",
        name: "Luciano",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/luciano/889012",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "901234",
        name: "Ganso",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/ganso/901234",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "945678",
        name: "Paulinho",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/paulinho/945678",
      },
    }),
  ]);

  console.log(`👥 ${players.length} jogadores criados`);

  // ── PARTIDAS DE HOJE (com horários BRT) ────────────────────────────────
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Partida 1: Flamengo vs Palmeiras — 19h BRT (22h UTC)
  const match1 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-1",
      homeTeam: "Flamengo",
      awayTeam: "Palmeiras",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T22:00:00Z`),
      status: "scheduled",
    },
  });

  // Partida 2: Botafogo vs Atlético-MG — 21h BRT (00h UTC)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const match2 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-2",
      homeTeam: "Botafogo",
      awayTeam: "Atlético-MG",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${tomorrowStr}T00:00:00Z`), // 21h BRT
      status: "scheduled",
    },
  });

  // Partida 3: Corinthians vs São Paulo — 16h BRT (19h UTC)
  const match3 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-3",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T19:00:00Z`),
      status: "scheduled",
    },
  });

  // Partida 4: Vasco vs Fluminense — 18h BRT (21h UTC)
  const match4 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-4",
      homeTeam: "Vasco",
      awayTeam: "Fluminense",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T21:00:00Z`),
      status: "scheduled",
    },
  });

  // Partida 5 (Libertadores) — amanhã
  const match5 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-liberty-1",
      homeTeam: "Flamengo",
      awayTeam: "Peñarol",
      competition: "Copa Libertadores",
      matchDate: new Date(`${tomorrowStr}T00:30:00Z`), // 21:30 BRT
      status: "scheduled",
    },
  });

  console.log("📅 5 partidas criadas (4 Série A + 1 Libertadores)");

  // ── MARKET ANALYSIS (jogadores por partida) ────────────────────────────
  // Cada partida recebe 3-5 jogadores com análises

  const analysisData = [
    // Match 1: Flamengo vs Palmeiras
    { match: match1, player: players[1], avg: 3.8, hitRate: 0.7, cv: 0.28, recommendation: "APOSTAR" }, // Pedro
    { match: match1, player: players[4], avg: 2.1, hitRate: 0.5, cv: 0.42, recommendation: "CONSIDERAR" }, // Arrascaeta
    { match: match1, player: players[2], avg: 2.5, hitRate: 0.6, cv: 0.35, recommendation: "CONSIDERAR" }, // Raphael Veiga
    { match: match1, player: players[5], avg: 3.2, hitRate: 0.65, cv: 0.32, recommendation: "APOSTAR" }, // Estêvão

    // Match 2: Botafogo vs Atlético-MG
    { match: match2, player: players[3], avg: 4.1, hitRate: 0.8, cv: 0.22, recommendation: "APOSTAR" }, // Luiz Henrique
    { match: match2, player: players[6], avg: 3.5, hitRate: 0.7, cv: 0.3, recommendation: "APOSTAR" }, // Hulk
    { match: match2, player: players[11], avg: 1.9, hitRate: 0.45, cv: 0.48, recommendation: "AGUARDAR" }, // Paulinho

    // Match 3: Corinthians vs São Paulo
    { match: match3, player: players[8], avg: 3.0, hitRate: 0.6, cv: 0.38, recommendation: "CONSIDERAR" }, // Yuri Alberto
    { match: match3, player: players[9], avg: 2.8, hitRate: 0.55, cv: 0.4, recommendation: "CONSIDERAR" }, // Luciano

    // Match 4: Vasco vs Fluminense
    { match: match4, player: players[7], avg: 3.6, hitRate: 0.7, cv: 0.25, recommendation: "APOSTAR" }, // Vegetti
    { match: match4, player: players[10], avg: 1.5, hitRate: 0.35, cv: 0.55, recommendation: "EVITAR" }, // Ganso

    // Match 5: Flamengo vs Peñarol (Libertadores)
    { match: match5, player: players[1], avg: 3.8, hitRate: 0.7, cv: 0.28, recommendation: "APOSTAR" }, // Pedro
    { match: match5, player: players[4], avg: 2.1, hitRate: 0.5, cv: 0.42, recommendation: "CONSIDERAR" }, // Arrascaeta
  ];

  for (const a of analysisData) {
    const odds = a.hitRate > 0 ? Number((1 / a.hitRate * 0.9).toFixed(2)) : 2.0;

    await prisma.marketAnalysis.create({
      data: {
        playerId: a.player.id,
        matchId: a.match.id,
        market: "Over 1.5 Chutes",
        odds,
        probability: a.hitRate,
        confidence: a.cv <= 0.3 ? 0.85 : a.cv <= 0.45 ? 0.65 : 0.45,
        recommendation: a.recommendation,
        reasoning: `Média: ${a.avg} chutes/jogo. Hit rate Over 1.5: ${(a.hitRate * 100).toFixed(0)}%. CV: ${a.cv}.`,
      },
    });
  }

  console.log(`📊 ${analysisData.length} análises de mercado criadas`);

  // ── PLAYER MATCH STATS (histórico para fallback) ───────────────────────
  const statsPlayers = [
    { player: players[1], shotsSeries: [4, 5, 2, 3, 6, 4, 3, 5, 2, 4] }, // Pedro
    { player: players[3], shotsSeries: [5, 3, 6, 4, 7, 3, 4, 2, 5, 3] }, // Luiz Henrique
    { player: players[6], shotsSeries: [3, 4, 2, 5, 3, 4, 3, 2, 5, 4] }, // Hulk
    { player: players[7], shotsSeries: [3, 5, 4, 2, 4, 3, 5, 4, 2, 3] }, // Vegetti
    { player: players[8], shotsSeries: [2, 3, 4, 1, 5, 3, 2, 4, 3, 2] }, // Yuri Alberto
  ];

  // Create historical matches for stats
  const histDates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1) * 7);
    return d;
  });

  for (const sp of statsPlayers) {
    for (let i = 0; i < 10; i++) {
      const histMatch = await prisma.match.upsert({
        where: { sofascoreId: `seed-hist-${i}` },
        update: {},
        create: {
          sofascoreId: `seed-hist-${i}`,
          homeTeam: "Time A",
          awayTeam: "Time B",
          competition: "Brasileirão Série A",
          matchDate: histDates[i],
          status: "finished",
        },
      });

      await prisma.playerMatchStats.upsert({
        where: {
          playerId_matchId: {
            playerId: sp.player.id,
            matchId: histMatch.id,
          },
        },
        update: {},
        create: {
          playerId: sp.player.id,
          matchId: histMatch.id,
          shots: sp.shotsSeries[i],
          shotsOnTarget: Math.floor(sp.shotsSeries[i] * 0.45),
          minutesPlayed: 75 + Math.floor(Math.random() * 15),
          goals: Math.random() > 0.7 ? 1 : 0,
          assists: Math.random() > 0.8 ? 1 : 0,
          rating: 6.0 + Math.random() * 2.5,
        },
      });
    }
  }

  console.log("📈 Estatísticas históricas criadas para 5 jogadores");

  // ── RESUMO ─────────────────────────────────────────────────────────────
  const matchCount = await prisma.match.count();
  const playerCount = await prisma.player.count();
  const statsCount = await prisma.playerMatchStats.count();
  const analysisCount = await prisma.marketAnalysis.count();

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`
📦 Dados criados:
  - Partidas: ${matchCount}
  - Jogadores: ${playerCount}
  - Stats de partidas: ${statsCount}
  - Análises de mercado: ${analysisCount}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
