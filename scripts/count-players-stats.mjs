import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: './.env' });

const prisma = new PrismaClient();

async function main() {
  // Get all players with their stats count
  const playersWithStats = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { matchStats: true }
      }
    }
  });

  const with10Plus = playersWithStats.filter(p => p._count.matchStats >= 10);
  const with5to9 = playersWithStats.filter(p => p._count.matchStats >= 5 && p._count.matchStats < 10);
  const with2to4 = playersWithStats.filter(p => p._count.matchStats >= 2 && p._count.matchStats < 5);
  const with0to1 = playersWithStats.filter(p => p._count.matchStats < 2);

  console.log('\n📊 Distribuição de jogadores por quantidade de stats:\n');
  console.log(`  ✅ ≥10 stats: ${with10Plus.length} jogadores`);
  console.log(`  ⚠️  5-9 stats: ${with5to9.length} jogadores`);
  console.log(`  ⚠️  2-4 stats: ${with2to4.length} jogadores`);
  console.log(`  ❌ 0-1 stats: ${with0to1.length} jogadores (insuficiente para CV)\n`);

  if (with10Plus.length > 0) {
    console.log('📋 Top 10 jogadores com mais stats:');
    const top10 = with10Plus
      .sort((a, b) => b._count.matchStats - a._count.matchStats)
      .slice(0, 10);

    top10.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}: ${p._count.matchStats} stats`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
