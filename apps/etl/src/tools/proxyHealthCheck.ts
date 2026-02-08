import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProxyUrls } from "../crawlers/proxyPool.js";
import { curlFetchJson } from "../crawlers/curlFetch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../../.env") });

const DATE = new Date().toISOString().slice(0, 10);
const TEST_URL = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${DATE}`;
const LIMIT = parseInt(process.env.PROXY_CHECK_LIMIT ?? "10", 10) || 10;

function maskProxy(proxyUrl: string): string {
  try {
    const parsed = new URL(proxyUrl);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  } catch {
    return "unknown";
  }
}

async function checkProxy(proxyUrl: string): Promise<void> {
  const result = await curlFetchJson(TEST_URL, { proxyUrl, timeout: 15 });
  const masked = maskProxy(proxyUrl);
  const hasData = result.data != null;
  console.log(`${masked} -> ${result.status}${hasData ? " ✓ JSON" : ""}`);
}

async function main(): Promise<void> {
  console.log(
    `SOFASCORE_PROXY_LIST_PATH=${process.env.SOFASCORE_PROXY_LIST_PATH ?? ""}`,
  );
  const proxies = await loadProxyUrls();
  if (proxies.length === 0) {
    console.log("No proxies loaded.");
    return;
  }
  const sample = proxies.slice(0, LIMIT);
  console.log(`Testing ${sample.length} proxies against ${TEST_URL} (via curl)`);
  for (const proxyUrl of sample) {
    try {
      await checkProxy(proxyUrl);
    } catch (err) {
      const masked = maskProxy(proxyUrl);
      const message = err instanceof Error ? err.message : String(err);
      console.log(`${masked} -> error (${message})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
