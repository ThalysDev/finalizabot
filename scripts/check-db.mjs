#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkDatabase() {
  console.log('\n🔍 Verificando estado do banco de dados...\n');

  try {
    // Public schema
    const matchCount = await prisma.match.count();
    const playerCount = await prisma.player.count();
    const imageCacheCount = await prisma.imageCache.count();
    const marketAnalysisCount = await prisma.marketAnalysis.count();
    const playerStatsCount = await prisma.playerMatchStats.count();

    console.log('📊 PUBLIC SCHEMA:');
    console.log(`  ✅ Matches: ${matchCount}`);
    console.log(`  ✅ Players: ${playerCount}`);
    console.log(`  ✅ ImageCache: ${imageCacheCount}`);
    console.log(`  ✅ MarketAnalysis: ${marketAnalysisCount}`);
    console.log(`  ✅ PlayerMatchStats: ${playerStatsCount}`);

    // Sample image data
    if (imageCacheCount > 0) {
      const sampleImage = await prisma.imageCache.findFirst({
        select: { id: true, sourceUrl: true, contentType: true }
      });
      console.log(`\n  📸 Sample Image:`);
      console.log(`     ID: ${sampleImage.id}`);
      console.log(`     URL: ${sampleImage.sourceUrl.substring(0, 50)}...`);
      console.log(`     Type: ${sampleImage.contentType}`);
    }

    // Matches with images
    const matchesWithImages = await prisma.match.count({
      where: {
        OR: [
          { homeTeamImageId: { not: null } },
          { awayTeamImageId: { not: null } }
        ]
      }
    });

    const imagePercentage = matchCount > 0
      ? ((matchesWithImages / matchCount) * 100).toFixed(1)
      : '0';

    console.log(`\n  🖼️  Matches com imagens: ${matchesWithImages}/${matchCount} (${imagePercentage}%)`);

    // Recent matches
    if (matchCount > 0) {
      const recentMatches = await prisma.match.findMany({
        take: 3,
        orderBy: { matchDate: 'desc' },
        select: {
          homeTeam: true,
          awayTeam: true,
          matchDate: true,
          status: true
        }
      });

      console.log(`\n  🔴 Últimas 3 partidas:`);
      recentMatches.forEach((m, i) => {
        console.log(`     ${i + 1}. ${m.homeTeam} vs ${m.awayTeam} (${m.status})`);
      });
    }

    console.log('\n✅ Verificação concluída!\n');

    // Recommendations
    if (imageCacheCount === 0) {
      console.log('⚠️  ATENÇÃO: ImageCache vazio - executar image sync!');
    }
    if (matchCount === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma partida no banco - executar ETL sync!');
    }

  } catch (err) {
    console.error('❌ Erro ao verificar banco:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
