import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes (public schema)
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
        imageUrl: "https://api.sofascore.com/api/v1/player/971232/image",
        teamName: "Flamengo",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/5981/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "934874",
        name: "Pedro",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/pedro/934874",
        imageUrl: "https://api.sofascore.com/api/v1/player/934874/image",
        teamName: "Flamengo",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/5981/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "865600",
        name: "Raphael Veiga",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/veiga-raphael/865600",
        imageUrl: "https://api.sofascore.com/api/v1/player/865600/image",
        teamName: "Palmeiras",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1963/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "952349",
        name: "Luiz Henrique",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/luiz-henrique/952349",
        imageUrl: "https://api.sofascore.com/api/v1/player/952349/image",
        teamName: "Botafogo",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1958/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "871673",
        name: "Arrascaeta",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/arrascaeta/871673",
        imageUrl: "https://api.sofascore.com/api/v1/player/871673/image",
        teamName: "Flamengo",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/5981/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "860652",
        name: "Estêvão",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/estevao/860652",
        imageUrl: "https://api.sofascore.com/api/v1/player/860652/image",
        teamName: "Palmeiras",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1963/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "822456",
        name: "Hulk",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/hulk/822456",
        imageUrl: "https://api.sofascore.com/api/v1/player/822456/image",
        teamName: "Atlético-MG",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1977/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "837209",
        name: "Vegetti",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/vegetti/837209",
        imageUrl: "https://api.sofascore.com/api/v1/player/837209/image",
        teamName: "Vasco",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1974/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "913651",
        name: "Yuri Alberto",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/yuri-alberto/913651",
        imageUrl: "https://api.sofascore.com/api/v1/player/913651/image",
        teamName: "Corinthians",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1957/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "889012",
        name: "Luciano",
        position: "Atacante",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/luciano/889012",
        imageUrl: "https://api.sofascore.com/api/v1/player/889012/image",
        teamName: "São Paulo",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1981/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "901234",
        name: "Ganso",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/ganso/901234",
        imageUrl: "https://api.sofascore.com/api/v1/player/901234/image",
        teamName: "Fluminense",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1961/image",
      },
    }),
    prisma.player.create({
      data: {
        sofascoreId: "945678",
        name: "Paulinho",
        position: "Meia",
        sofascoreUrl: "https://www.sofascore.com/pt/jogador/paulinho/945678",
        imageUrl: "https://api.sofascore.com/api/v1/player/945678/image",
        teamName: "Atlético-MG",
        teamImageUrl: "https://api.sofascore.com/api/v1/team/1977/image",
      },
    }),
  ]);

  console.log(`👥 ${players.length} jogadores criados`);

  // ── PARTIDAS DE HOJE ───────────────────────────────────────────────────
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const match1 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-1",
      homeTeam: "Flamengo",
      awayTeam: "Palmeiras",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T22:00:00Z`),
      status: "scheduled",
      homeTeamImageUrl: "https://api.sofascore.com/api/v1/team/5981/image",
      awayTeamImageUrl: "https://api.sofascore.com/api/v1/team/1963/image",
      homeTeamSofascoreId: "5981",
      awayTeamSofascoreId: "1963",
    },
  });

  const match2 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-2",
      homeTeam: "Botafogo",
      awayTeam: "Atlético-MG",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${tomorrowStr}T00:00:00Z`),
      status: "scheduled",
      homeTeamImageUrl: "https://api.sofascore.com/api/v1/team/1958/image",
      awayTeamImageUrl: "https://api.sofascore.com/api/v1/team/1977/image",
      homeTeamSofascoreId: "1958",
      awayTeamSofascoreId: "1977",
    },
  });

  const match3 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-3",
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T19:00:00Z`),
      status: "scheduled",
      homeTeamImageUrl: "https://api.sofascore.com/api/v1/team/1957/image",
      awayTeamImageUrl: "https://api.sofascore.com/api/v1/team/1981/image",
      homeTeamSofascoreId: "1957",
      awayTeamSofascoreId: "1981",
    },
  });

  const match4 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-today-4",
      homeTeam: "Vasco",
      awayTeam: "Fluminense",
      competition: "Brasileirão Série A",
      matchDate: new Date(`${todayStr}T21:00:00Z`),
      status: "scheduled",
      homeTeamImageUrl: "https://api.sofascore.com/api/v1/team/1974/image",
      awayTeamImageUrl: "https://api.sofascore.com/api/v1/team/1961/image",
      homeTeamSofascoreId: "1974",
      awayTeamSofascoreId: "1961",
    },
  });

  const match5 = await prisma.match.create({
    data: {
      sofascoreId: "seed-match-liberty-1",
      homeTeam: "Flamengo",
      awayTeam: "Peñarol",
      competition: "Copa Libertadores",
      matchDate: new Date(`${tomorrowStr}T00:30:00Z`),
      status: "scheduled",
      homeTeamImageUrl: "https://api.sofascore.com/api/v1/team/5981/image",
      awayTeamImageUrl: "https://api.sofascore.com/api/v1/team/3585/image",
      homeTeamSofascoreId: "5981",
      awayTeamSofascoreId: "3585",
    },
  });

  console.log("📅 5 partidas criadas");

  // ── MARKET ANALYSIS ────────────────────────────────────────────────────
  const analysisData = [
    // Match 1: Flamengo x Palmeiras — 6 players
    { match: match1, player: players[0], avg: 2.8, hitRate: 0.55, cv: 0.38, recommendation: "CONSIDERAR" },
    { match: match1, player: players[1], avg: 3.8, hitRate: 0.7, cv: 0.28, recommendation: "APOSTAR" },
    { match: match1, player: players[4], avg: 2.1, hitRate: 0.5, cv: 0.42, recommendation: "CONSIDERAR" },
    { match: match1, player: players[2], avg: 2.5, hitRate: 0.6, cv: 0.35, recommendation: "CONSIDERAR" },
    { match: match1, player: players[5], avg: 3.2, hitRate: 0.65, cv: 0.32, recommendation: "APOSTAR" },
    { match: match1, player: players[10], avg: 1.8, hitRate: 0.4, cv: 0.5, recommendation: "AGUARDAR" },
    // Match 2: Botafogo x Atlético-MG — 5 players
    { match: match2, player: players[3], avg: 4.1, hitRate: 0.8, cv: 0.22, recommendation: "APOSTAR" },
    { match: match2, player: players[6], avg: 3.5, hitRate: 0.7, cv: 0.3, recommendation: "APOSTAR" },
    { match: match2, player: players[11], avg: 1.9, hitRate: 0.45, cv: 0.48, recommendation: "AGUARDAR" },
    { match: match2, player: players[0], avg: 2.2, hitRate: 0.5, cv: 0.4, recommendation: "CONSIDERAR" },
    { match: match2, player: players[9], avg: 2.6, hitRate: 0.55, cv: 0.37, recommendation: "CONSIDERAR" },
    // Match 3: Corinthians x São Paulo — 5 players
    { match: match3, player: players[8], avg: 3.0, hitRate: 0.6, cv: 0.38, recommendation: "CONSIDERAR" },
    { match: match3, player: players[9], avg: 2.8, hitRate: 0.55, cv: 0.4, recommendation: "CONSIDERAR" },
    { match: match3, player: players[1], avg: 3.5, hitRate: 0.65, cv: 0.3, recommendation: "APOSTAR" },
    { match: match3, player: players[5], avg: 2.9, hitRate: 0.6, cv: 0.35, recommendation: "CONSIDERAR" },
    { match: match3, player: players[11], avg: 2.0, hitRate: 0.45, cv: 0.5, recommendation: "AGUARDAR" },
    // Match 4: Vasco x Fluminense — 5 players
    { match: match4, player: players[7], avg: 3.6, hitRate: 0.7, cv: 0.25, recommendation: "APOSTAR" },
    { match: match4, player: players[10], avg: 1.5, hitRate: 0.35, cv: 0.55, recommendation: "EVITAR" },
    { match: match4, player: players[4], avg: 2.3, hitRate: 0.5, cv: 0.42, recommendation: "CONSIDERAR" },
    { match: match4, player: players[2], avg: 2.7, hitRate: 0.6, cv: 0.33, recommendation: "APOSTAR" },
    { match: match4, player: players[6], avg: 3.2, hitRate: 0.65, cv: 0.28, recommendation: "APOSTAR" },
    // Match 5: Flamengo x Peñarol (Libertadores) — 5 players
    { match: match5, player: players[1], avg: 3.8, hitRate: 0.7, cv: 0.28, recommendation: "APOSTAR" },
    { match: match5, player: players[4], avg: 2.1, hitRate: 0.5, cv: 0.42, recommendation: "CONSIDERAR" },
    { match: match5, player: players[0], avg: 2.5, hitRate: 0.55, cv: 0.36, recommendation: "CONSIDERAR" },
    { match: match5, player: players[3], avg: 3.9, hitRate: 0.75, cv: 0.24, recommendation: "APOSTAR" },
    { match: match5, player: players[8], avg: 2.8, hitRate: 0.55, cv: 0.4, recommendation: "CONSIDERAR" },
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

  console.log(`📊 ${analysisData.length} análises criadas`);

  // ── PLAYER MATCH STATS ─────────────────────────────────────────────────
  const statsPlayers = [
    { player: players[0],  shotsSeries: [3, 2, 4, 3, 2, 5, 3, 2, 4, 3] }, // Alonso Martinez
    { player: players[1],  shotsSeries: [4, 5, 2, 3, 6, 4, 3, 5, 2, 4] }, // Pedro
    { player: players[2],  shotsSeries: [2, 3, 1, 4, 2, 3, 2, 1, 3, 2] }, // Raphael Veiga
    { player: players[3],  shotsSeries: [5, 3, 6, 4, 7, 3, 4, 2, 5, 3] }, // Luiz Henrique
    { player: players[4],  shotsSeries: [2, 4, 1, 3, 2, 3, 4, 2, 3, 1] }, // Arrascaeta
    { player: players[5],  shotsSeries: [3, 4, 5, 3, 4, 2, 5, 3, 4, 3] }, // Estêvão
    { player: players[6],  shotsSeries: [3, 4, 2, 5, 3, 4, 3, 2, 5, 4] }, // Hulk
    { player: players[7],  shotsSeries: [3, 5, 4, 2, 4, 3, 5, 4, 2, 3] }, // Vegetti
    { player: players[8],  shotsSeries: [2, 3, 4, 1, 5, 3, 2, 4, 3, 2] }, // Yuri Alberto
    { player: players[9],  shotsSeries: [3, 2, 3, 4, 2, 3, 5, 2, 3, 4] }, // Luciano
    { player: players[10], shotsSeries: [1, 2, 1, 3, 1, 2, 2, 1, 3, 1] }, // Ganso
    { player: players[11], shotsSeries: [2, 3, 2, 4, 3, 2, 3, 4, 2, 3] }, // Paulinho
  ];

  const histDates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i + 1) * 7);
    return d;
  });

  for (const sp of statsPlayers) {
    for (let i = 0; i < 10; i++) {
      const histId = `seed-hist-${sp.player.sofascoreId}-${i}`;
      const histMatch = await prisma.match.upsert({
        where: { sofascoreId: histId },
        update: {},
        create: {
          sofascoreId: histId,
          homeTeam: "Time A",
          awayTeam: "Time B",
          competition: "Brasileirão Série A",
          matchDate: histDates[i],
          status: "finished",
        },
      });

      await prisma.playerMatchStats.upsert({
        where: { playerId_matchId: { playerId: sp.player.id, matchId: histMatch.id } },
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

  console.log("📈 Estatísticas históricas criadas");

  const matchCount = await prisma.match.count();
  const playerCount = await prisma.player.count();
  const statsCount = await prisma.playerMatchStats.count();
  const analysisCount = await prisma.marketAnalysis.count();

  console.log(`\n✅ Seed concluído!\n  Partidas: ${matchCount}\n  Jogadores: ${playerCount}\n  Stats: ${statsCount}\n  Análises: ${analysisCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
