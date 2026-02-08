import { Dataset, PlaywrightCrawler } from 'crawlee';
import { logger } from '../lib/logger.js';

const NAVIGATION_TIMEOUT_MS = 30_000;

export async function runDiscoverEndpoints(): Promise<void> {
  const matchUrl = process.env.MATCH_URL?.trim();
  if (!matchUrl) {
    logger.error('MATCH_URL is required when MODE=discover');
    process.exit(1);
  }

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    navigationTimeoutSecs: NAVIGATION_TIMEOUT_MS / 1000,
    requestHandlerTimeoutSecs: 60,
    preNavigationHooks: [
      async ({ page }) => {
        page.on('response', async (response) => {
          const url = response.url();
          const status = response.status();
          const contentType = response.headers()['content-type'] ?? '';
          if (status !== 200 || !contentType.includes('application/json')) return;
          if (/\.(js|css|woff2?|png|jpg|ico)(\?|$)/i.test(url)) return;

          try {
            const body = await response.json();
            const jsonKeys = typeof body === 'object' && body !== null && !Array.isArray(body)
              ? Object.keys(body as object)
              : Array.isArray(body)
                ? ['[array]']
                : ['[unknown]'];
            logger.info('JSON endpoint', { url, jsonKeys });
            await Dataset.pushData({ url, status: 200, jsonKeys });
          } catch {
            // ignore parse errors
          }
        });
      },
    ],
    requestHandler: async ({ page }) => {
      try {
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
      } catch {
        // continue
      }
    },
  });

  await crawler.run([matchUrl]);
}
