import { PrismaClient } from "@prisma/client";
import { buildMarketAnalysisPayload } from "../src/lib/calc/market";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // 1. Criar Match
  const match = await prisma.match.create({
    data: {
      homeTeam: "EUA",
      awayTeam: "Costa Rica",
      competition: "Concacaf - Copa Ouro",
      kickoffAt: new Date("2026-06-15T20:00:00Z"),
    },
  });
  console.log("✅ Match criado:", match.id);

  // 2. Criar Player
  const player = await prisma.player.create({
    data: {
      sofascoreId: "971232",
      name: "Alonso Martinez",
      position: "Atacante",
      sofascoreUrl:
        "https://www.sofascore.com/pt/jogador/martinez-alonso/971232",
    },
  });
  console.log("✅ Player criado:", player.id);

  // 3. Criar 10 PlayerMatchStats
  const shotsSeries = [2, 7, 0, 5, 6, 4, 7, 7, 2, 0];
  const minutesSeries = [85, 62, 46, 89, 90, 90, 90, 85, 138, 166];

  // Datas dos últimos 10 jogos (do mais antigo ao mais recente)
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
    await prisma.playerMatchStats.create({
      data: {
        playerId: player.id,
        matchId: match.id,
        matchDate: baseDates[i],
        minutesPlayed: minutesSeries[i],
        shots: shotsSeries[i],
      },
    });
  }
  console.log("✅ 10 PlayerMatchStats criados");

  // 4. Criar MarketAnalysis
  const line = 1.5;
  const odds = 1.83;

  const payload = buildMarketAnalysisPayload({
    shotsSeries,
    minutesSeries,
    line,
    odds,
  });

  const marketAnalysis = await prisma.marketAnalysis.create({
    data: {
      playerId: player.id,
      matchId: match.id,
      marketType: "SHOTS",
      line: payload.line,
      odds: payload.odds,
      u5Hits: payload.u5Hits,
      u10Hits: payload.u10Hits,
      cv: payload.cv,
      shotsSeries: payload.shotsSeries,
      minutesSeries: payload.minutesSeries,
      sourceUpdatedAt: new Date(),
    },
  });
  console.log("✅ MarketAnalysis criado:", marketAnalysis.id);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log(`\n📊 Dados criados:
  - Match ID: ${match.id}
  - Player ID: ${player.id}
  - MarketAnalysis ID: ${marketAnalysis.id}
  - U5 Hits: ${payload.u5Hits}/5
  - U10 Hits: ${payload.u10Hits}/10
  - CV: ${payload.cv?.toFixed(2) ?? "N/A"}
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
