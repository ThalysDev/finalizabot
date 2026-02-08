import 'dotenv/config';
import { CheerioCrawler } from 'crawlee';
import { logger } from './lib/logger.js';
import { runDiscoverEndpoints } from './crawlers/discoverEndpoints.js';
import { runSofaScoreIngest } from './crawlers/sofascoreIngest.js';
import { disconnectDb } from './services/db.js';

async function runCrawler(): Promise<void> {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 1,
    requestHandler: async () => {},
  });
  await crawler.run([]);
}

async function main(): Promise<void> {
  const mode = process.env.MODE;

  if (mode === 'discover') {
    try {
      await runDiscoverEndpoints();
    } finally {
      await disconnectDb();
    }
    return;
  }

  if (mode === 'ingest') {
    try {
      await runSofaScoreIngest();
    } finally {
      await disconnectDb();
    }
    return;
  }

  if (!mode || mode === '') {
    logger.info('No MODE set. Use MODE=discover (with MATCH_URL) or MODE=ingest (npm run sync)');
  }
  logger.info('SofaScore ETL starting');
  await runCrawler();
  logger.info('SofaScore ETL finished');
}

main().catch((err) => {
  logger.error('Fatal', err);
  process.exit(1);
});
