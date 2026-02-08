import 'dotenv/config';
import { logger } from './lib/logger.js';
import { runDiscoverEndpoints } from './crawlers/discoverEndpoints.js';
import { runSofaScoreIngest } from './crawlers/sofascoreIngest.js';
import { runBridge } from './bridge/etl-to-public.js';
import { disconnectDb } from './services/db.js';

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

  if (mode === 'bridge') {
    try {
      await runBridge();
    } finally {
      await disconnectDb();
    }
    return;
  }

  if (mode === 'full') {
    try {
      logger.info('[Full] Executando ingest + bridge...');
      await runSofaScoreIngest();
      await runBridge();
      logger.info('[Full] Pipeline completo!');
    } finally {
      await disconnectDb();
    }
    return;
  }

  if (!mode || mode === '') {
    logger.info('No MODE set. Use MODE=discover | MODE=ingest | MODE=bridge | MODE=full');
  }
}

main().catch((err) => {
  logger.error('Fatal', err);
  process.exit(1);
});
