import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.marketAnalysis.deleteMany();
  await prisma.playerMatchStats.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  console.log(" Dados anteriores limpos");

  // 1. Criar Player
  const player = await prisma.player.create({
    data: {
      sofascoreId: "971232",
      name: "Alonso Martinez",
      position: "Atacante",
      sofascoreUrl: "https://www.sofascore.com/pt/jogador/martinez-alonso/971232",
    },
  });
  console.log(" Player criado:", player.id);

  // 2. Criar 10 partidas históricas
  const shotsSeries = [2, 7, 0, 5, 6, 4, 7, 7, 2, 0];
  const minutesSeries = [85, 62, 46, 89, 90, 90, 90, 85, 90, 90];
  const opponents = [
    "Mexico", "Canada", "Jamaica", "Honduras", "Panama",
    "El Salvador", "Guatemala", "Trinidad", "Cuba", "Haiti"
  ];

  const baseDates = [
    new Date("2026-01-05T18:00:00Z"),
    new Date("2026-01-12T20:00:00Z"),
    new Date("2026-01-18T19:00:00Z"),
    new Date("2026-01-25T21:00:00Z"),
    new Date("2026-02-01T18:30:00Z"),
    new Date("2026-02-08T20:00:00Z"),
    new Date("2026-02-15T19:00:00Z"),
    new Date("2026-02-22T21:00:00Z"),
    new Date("2026-03-01T18:00:00Z"),
    new Date("2026-03-08T20:00:00Z"),
  ];

  for (let i = 0; i < 10; i++) {
    const match = await prisma.match.create({
      data: {
        sofascoreId: `match-hist-${i + 1}`,
        homeTeam: "Costa Rica",
        awayTeam: opponents[i],
        competition: "CONCACAF Nations League",
        matchDate: baseDates[i],
        status: "finished",
      },
    });

    await prisma.playerMatchStats.create({
      data: {
        playerId: player.id,
        matchId: match.id,
        goals: Math.floor(Math.random() * 2),
        assists: Math.floor(Math.random() * 2),
        shots: shotsSeries[i],
        shotsOnTarget: Math.floor(shotsSeries[i] * 0.5),
        minutesPlayed: minutesSeries[i],
        rating: 6.5 + Math.random() * 2,
      },
    });
  }
  console.log(" 10 partidas históricas criadas com stats");

  // 3. Criar partida principal (próxima)
  const mainMatch = await prisma.match.create({
    data: {
      sofascoreId: "match-main-001",
      homeTeam: "EUA",
      awayTeam: "Costa Rica",
      competition: "CONCACAF - Copa Ouro 2026",
      matchDate: new Date("2026-06-15T20:00:00Z"),
      status: "scheduled",
    },
  });
  console.log(" Partida principal criada:", mainMatch.id);

  // 4. Criar MarketAnalysis
  const marketAnalysis = await prisma.marketAnalysis.create({
    data: {
      playerId: player.id,
      matchId: mainMatch.id,
      market: "Over 1.5 Chutes",
      odds: 1.83,
      probability: 0.72,
      confidence: 0.85,
      recommendation: "APOSTAR",
      reasoning: "Alonso Martinez tem média de 4.0 chutes nos últimos 10 jogos. Em 7 de 10 partidas superou 1.5 chutes. CV baixo indica consistência.",
    },
  });
  console.log(" MarketAnalysis criado:", marketAnalysis.id);

  // Resumo
  const matchCount = await prisma.match.count();
  const playerCount = await prisma.player.count();
  const statsCount = await prisma.playerMatchStats.count();
  const analysisCount = await prisma.marketAnalysis.count();

  console.log("\n Seed concluído com sucesso!");
  console.log(`
 Dados criados:
  - Partidas: ${matchCount}
  - Jogadores: ${playerCount}
  - Stats de partidas: ${statsCount}
  - Análises de mercado: ${analysisCount}
  - Player ID: ${player.id}
  - Main Match ID: ${mainMatch.id}
  `);
}

main()
  .catch((e) => {
    console.error(" Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
