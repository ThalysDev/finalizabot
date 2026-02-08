import { readFile } from "node:fs/promises";
import { ProxyAgent } from "undici";
import { logger } from "../lib/logger.js";

const LIST_HEADERS: HeadersInit = {
  Accept: "text/plain,*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

let cachedProxyUrls: string[] | null | undefined;
let proxyIndex = 0;
const proxyAgents = new Map<string, ProxyAgent>();
const proxyFailCounts = new Map<string, number>();
const MAX_PROXY_FAILS = 3;

export async function getProxyDispatcher(): Promise<{
  dispatcher?: ProxyAgent;
  proxyUrl?: string;
}> {
  const proxyUrl = await selectProxyUrl();
  if (!proxyUrl) return {};
  const cached = proxyAgents.get(proxyUrl);
  if (cached) return { dispatcher: cached, proxyUrl };
  try {
    const agent = new ProxyAgent(proxyUrl);
    proxyAgents.set(proxyUrl, agent);
    return { dispatcher: agent, proxyUrl };
  } catch (err) {
    logger.warn("Failed to initialize proxy agent", {
      error: err instanceof Error ? err.message : String(err),
    });
    markProxyFailure(proxyUrl);
    return {};
  }
}

export function markProxyFailure(proxyUrl: string): void {
  const current = proxyFailCounts.get(proxyUrl) ?? 0;
  proxyFailCounts.set(proxyUrl, current + 1);
}

export function markProxySuccess(proxyUrl: string): void {
  proxyFailCounts.set(proxyUrl, 0);
}

export async function selectProxyUrl(): Promise<string | undefined> {
  const urls = await loadProxyUrls();
  if (urls.length === 0) return undefined;
  for (let i = 0; i < urls.length; i += 1) {
    const candidate = urls[proxyIndex % urls.length];
    proxyIndex += 1;
    const fails = proxyFailCounts.get(candidate) ?? 0;
    if (fails < MAX_PROXY_FAILS) return candidate;
  }
  return urls[proxyIndex % urls.length];
}

export async function loadProxyUrls(): Promise<string[]> {
  if (cachedProxyUrls !== undefined) return cachedProxyUrls ?? [];
  const listPath = process.env.SOFASCORE_PROXY_LIST_PATH?.trim();
  const listUrl = process.env.SOFASCORE_PROXY_LIST_URL?.trim();
  const single =
    process.env.SOFASCORE_PROXY_URL?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim();
  if (listPath) {
    try {
      const text = await readFile(listPath, "utf-8");
      const urls = parseProxyList(text);
      cachedProxyUrls = urls.length > 0 ? urls : single ? [single] : [];
      logger.info("Loaded proxy list from file", {
        count: cachedProxyUrls.length,
      });
      return cachedProxyUrls;
    } catch (err) {
      logger.warn("Proxy list file read error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  if (!listUrl) {
    cachedProxyUrls = single ? [single] : [];
    return cachedProxyUrls;
  }
  try {
    const res = await fetch(listUrl, {
      headers: LIST_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      logger.warn("Proxy list fetch non-OK", {
        status: res.status,
        statusText: res.statusText,
      });
      cachedProxyUrls = single ? [single] : [];
      return cachedProxyUrls;
    }
    const text = await res.text();
    const urls = parseProxyList(text);
    cachedProxyUrls = urls.length > 0 ? urls : single ? [single] : [];
    logger.info("Loaded proxy list", { count: cachedProxyUrls.length });
    return cachedProxyUrls;
  } catch (err) {
    logger.warn("Proxy list fetch error", {
      error: err instanceof Error ? err.message : String(err),
    });
    cachedProxyUrls = single ? [single] : [];
    return cachedProxyUrls;
  }
}

export function parseProxyList(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (
        line.startsWith("http://") ||
        line.startsWith("https://") ||
        line.startsWith("socks5://") ||
        line.startsWith("socks5h://")
      ) {
        return line;
      }
      if (line.includes("@")) {
        return `http://${line}`;
      }
      const parts = line.split(":");
      if (parts.length >= 4) {
        const [host, port, user, pass] = parts;
        return `http://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
      }
      if (parts.length === 2) {
        const [host, port] = parts;
        return `http://${host}:${port}`;
      }
      return "";
    })
    .filter(Boolean);
}

export function toPlaywrightProxy(
  proxyUrl: string,
): { server: string; username?: string; password?: string } | undefined {
  try {
    const parsed = new URL(proxyUrl);
    const server = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`;
    const username = parsed.username
      ? decodeURIComponent(parsed.username)
      : undefined;
    const password = parsed.password
      ? decodeURIComponent(parsed.password)
      : undefined;
    return { server, username, password };
  } catch {
    return undefined;
  }
}
