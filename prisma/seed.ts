import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(" Iniciando seed do banco de dados...");

  // 1. Criar Match
  const match = await prisma.match.create({
    data: {
      sofascoreId: "match-001",
      homeTeam: "EUA",
      awayTeam: "Costa Rica",
      competition: "Concacaf - Copa Ouro",
      matchDate: new Date("2026-06-15T20:00:00Z"),
      status: "scheduled",
    },
  });
  console.log(" Match criado:", match.id);

  // 2. Criar Player
  const player = await prisma.player.create({
    data: {
      sofascoreId: "971232",
      name: "Alonso Martinez",
      position: "Atacante",
      sofascoreUrl: "https://www.sofascore.com/pt/jogador/martinez-alonso/971232",
    },
  });
  console.log(" Player criado:", player.id);

  // 3. Criar 10 PlayerMatchStats
  const shotsSeries = [2, 7, 0, 5, 6, 4, 7, 7, 2, 0];
  const minutesSeries = [85, 62, 46, 89, 90, 90, 90, 85, 90, 90];

  for (let i = 0; i < 10; i++) {
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
  console.log(" 10 PlayerMatchStats criados");

  // 4. Criar MarketAnalysis
  const marketAnalysis = await prisma.marketAnalysis.create({
    data: {
      playerId: player.id,
      matchId: match.id,
      market: "Over 1.5 Chutes",
      odds: 1.83,
      probability: 0.72,
      confidence: 0.85,
      recommendation: "APOSTAR",
      reasoning: "Jogador com média de 4.0 chutes nos últimos 10 jogos, 7/10 acima de 1.5",
    },
  });
  console.log(" MarketAnalysis criado:", marketAnalysis.id);

  console.log("\n Seed concluído com sucesso!");
  console.log(`\n Dados criados:
  - Match ID: ${match.id}
  - Player ID: ${player.id}
  - MarketAnalysis ID: ${marketAnalysis.id}
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
