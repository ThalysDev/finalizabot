import { describe, expect, it, vi, beforeEach } from "vitest";
import { jsonError, jsonRateLimited } from "../src/lib/api/responses";

describe("jsonError()", () => {
  it("returns standardized error payload with status", async () => {
    const response = jsonError("Unauthorized", 401);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("merges additional headers", async () => {
    const response = jsonError("Bad request", 400, { "X-Test": "1" });
    const body = (await response.json()) as { error: string };

    expect(response.headers.get("X-Test")).toBe("1");
    expect(body.error).toBe("Bad request");
  });
});

describe("jsonRateLimited()", () => {
  it("returns status 429 with retry-after header", async () => {
    const response = jsonRateLimited(42);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error).toBe("Too many requests");
  });
});

describe("GET /api/sync-status", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns latest sync timestamp with cache headers", async () => {
    const finishedAt = new Date("2026-02-14T10:00:00.000Z");
    const findFirst = vi.fn().mockResolvedValue({
      id: "run-1",
      startedAt: new Date("2026-02-14T09:00:00.000Z"),
      finishedAt,
      status: "success",
      error: null,
    });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { etlIngestRun: { findFirst } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn() },
    }));

    const { GET } = await import("../src/app/api/sync-status/route");
    const response = await GET();
    const body = (await response.json()) as { lastSync: string | null };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=60, stale-while-revalidate=300",
    );
    expect(body).toEqual({ lastSync: "2026-02-14T10:00:00.000Z" });
  });

  it("falls back to null and no-store on query failure", async () => {
    const dbError = new Error("db unavailable");
    const findFirst = vi.fn().mockRejectedValue(dbError);
    const error = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { etlIngestRun: { findFirst } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error },
    }));

    const { GET } = await import("../src/app/api/sync-status/route");
    const response = await GET();
    const body = (await response.json()) as { lastSync: string | null };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ lastSync: null });
    expect(error).toHaveBeenCalledWith(
      "[/api/sync-status] query failed",
      dbError,
    );
  });
});

describe("GET /api/images/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function mockValidationModule() {
    vi.doMock("@/lib/validation", () => ({
      validateImageCacheId: (id: string | undefined | null) => {
        if (!id || typeof id !== "string") return null;
        const trimmed = id.trim();
        return /^c[a-z0-9]{24,}$/.test(trimmed) ? trimmed : null;
      },
    }));
  }

  function mockApiResponsesModule() {
    vi.doMock("@/lib/api/responses", () => ({
      jsonError: (
        message: string,
        status: number,
        headers?: Record<string, string>,
      ) =>
        new Response(JSON.stringify({ error: message }), {
          status,
          headers: {
            "Cache-Control": "no-store",
            ...(headers ?? {}),
          },
        }),
    }));
  }

  it("returns binary image payload with cache headers", async () => {
    const imageId = "c123456789012345678901234";
    const findUnique = vi.fn().mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
    });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { imageCache: { findUnique } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn() },
    }));
    mockValidationModule();
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/images/[id]/route");
    const response = await GET({} as never, {
      params: Promise.resolve({ id: imageId }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toContain("immutable");
  });

  it("returns 400 for invalid image id", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      default: { imageCache: { findUnique: vi.fn() } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn() },
    }));
    mockValidationModule();
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/images/[id]/route");
    const response = await GET({} as never, {
      params: Promise.resolve({ id: "invalid" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Invalid image id" });
  });

  it("returns 404 with standardized payload when image does not exist", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    vi.doMock("@/lib/db/prisma", () => ({
      default: { imageCache: { findUnique } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn() },
    }));
    mockValidationModule();
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/images/[id]/route");
    const response = await GET({} as never, {
      params: Promise.resolve({ id: "c123456789012345678901234" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Image not found" });
  });

  it("returns 500 with standardized payload when DB query fails", async () => {
    const dbError = new Error("db error");
    const findUnique = vi.fn().mockRejectedValue(dbError);
    const error = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { imageCache: { findUnique } },
    }));
    vi.doMock("@/lib/logger", () => ({
      logger: { error },
    }));
    mockValidationModule();
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/images/[id]/route");
    const response = await GET({} as never, {
      params: Promise.resolve({ id: "c123456789012345678901234" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ error: "Failed to fetch image" });
    expect(error).toHaveBeenCalledWith("[/api/images] fetch failed", dbError);
  });
});

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function mockApiResponsesModule() {
    const jsonError = vi.fn(
      (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), {
          status,
          headers: { "Cache-Control": "no-store" },
        }),
    );
    const jsonRateLimited = vi.fn(
      (retryAfter: number) =>
        new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfter),
          },
        }),
    );

    vi.doMock("@/lib/api/responses", () => ({
      jsonError,
      jsonRateLimited,
    }));

    return { jsonError, jsonRateLimited };
  }

  it("returns cached empty results when query is invalid", async () => {
    const findMany = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { player: { findMany } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeSearchQueryParams: vi.fn(() => ({ q: "  ", limit: 8 })),
    }));
    vi.doMock("@/lib/validation", () => ({
      validateSearchQuery: vi.fn(() => null),
    }));
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/search/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { results: unknown[] };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=30, stale-while-revalidate=15",
    );
    expect(body).toEqual({ results: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns rate-limited response when limiter blocks request", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      default: { player: { findMany: vi.fn() } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: false, retryAfter: 17 })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeSearchQueryParams: vi.fn(() => ({ q: "Messi", limit: 8 })),
    }));
    vi.doMock("@/lib/validation", () => ({
      validateSearchQuery: vi.fn((q: string) => q),
    }));
    const { jsonRateLimited } = mockApiResponsesModule();

    const { GET } = await import("../src/app/api/search/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("17");
    expect(body.error).toBe("Too many requests");
    expect(jsonRateLimited).toHaveBeenCalledWith(17);
  });

  it("returns standardized 500 payload when query fails", async () => {
    const dbError = new Error("db exploded");
    const findMany = vi.fn().mockRejectedValue(dbError);
    const logError = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { player: { findMany } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeSearchQueryParams: vi.fn(() => ({ q: "Messi", limit: 8 })),
    }));
    vi.doMock("@/lib/validation", () => ({
      validateSearchQuery: vi.fn((q: string) => q),
    }));
    const { jsonError } = mockApiResponsesModule();

    const { GET } = await import("../src/app/api/search/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Search failed" });
    expect(jsonError).toHaveBeenCalledWith("Search failed", 500);
    expect(logError).toHaveBeenCalledWith(
      "[/api/search] query failed",
      dbError,
    );
  });
});

describe("GET /api/matches", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function mockApiResponsesModule() {
    const jsonError = vi.fn(
      (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), {
          status,
          headers: { "Cache-Control": "no-store" },
        }),
    );
    const jsonRateLimited = vi.fn(
      (retryAfter: number) =>
        new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfter),
          },
        }),
    );

    vi.doMock("@/lib/api/responses", () => ({
      jsonError,
      jsonRateLimited,
    }));

    return { jsonError, jsonRateLimited };
  }

  it("returns matches list with cache header", async () => {
    const matches = [
      {
        id: "m1",
        homeTeam: "A",
        awayTeam: "B",
        competition: "League",
        matchDate: new Date("2026-02-14T12:00:00.000Z"),
      },
    ];
    const findMany = vi.fn().mockResolvedValue(matches);

    vi.doMock("@/lib/db/prisma", () => ({
      default: { match: { findMany } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeMatchesQueryParams: vi.fn(() => ({ days: 7, limit: 50 })),
    }));
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/matches/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { matches: typeof matches };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=120, stale-while-revalidate=60",
    );
    expect(body.matches).toHaveLength(1);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("returns rate-limited response when limiter blocks request", async () => {
    vi.doMock("@/lib/db/prisma", () => ({
      default: { match: { findMany: vi.fn() } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: false, retryAfter: 33 })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeMatchesQueryParams: vi.fn(() => ({ days: 7, limit: 50 })),
    }));
    const { jsonRateLimited } = mockApiResponsesModule();

    const { GET } = await import("../src/app/api/matches/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("33");
    expect(body.error).toBe("Too many requests");
    expect(jsonRateLimited).toHaveBeenCalledWith(33);
  });

  it("returns standardized 500 payload when DB query fails", async () => {
    const dbError = new Error("matches db exploded");
    const findMany = vi.fn().mockRejectedValue(dbError);
    const logError = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { match: { findMany } },
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizeMatchesQueryParams: vi.fn(() => ({ days: 7, limit: 50 })),
    }));
    const { jsonError } = mockApiResponsesModule();

    const { GET } = await import("../src/app/api/matches/route");
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as never;
    const response = await GET(req);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to fetch matches" });
    expect(jsonError).toHaveBeenCalledWith("Failed to fetch matches", 500);
    expect(logError).toHaveBeenCalledWith(
      "[/api/matches] list failed",
      dbError,
    );
  });
});

describe("GET /api/health", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns healthy status when db and etl are available", async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ "?column?": 1 }]);
    const etlHealth = vi
      .fn()
      .mockResolvedValue({ data: { ok: true }, error: null });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { $queryRawUnsafe: queryRaw },
    }));
    vi.doMock("@/lib/etl/client", () => ({ etlHealth }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const body = (await response.json()) as {
      status: string;
      db: string;
      etl: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.db).toBe("ok");
    expect(body.etl).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("hides detailed errors in production when dependencies fail", async () => {
    process.env.NODE_ENV = "production";
    const queryRaw = vi.fn().mockRejectedValue(new Error("db down"));
    const etlHealth = vi
      .fn()
      .mockResolvedValue({ data: null, error: "etl down" });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { $queryRawUnsafe: queryRaw },
    }));
    vi.doMock("@/lib/etl/client", () => ({ etlHealth }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.db).toBe("unavailable");
    expect(body.etl).toBe("unavailable");
    expect(body).not.toHaveProperty("dbError");
    expect(body).not.toHaveProperty("etlError");
  });

  it("includes detailed errors outside production", async () => {
    process.env.NODE_ENV = "test";
    const queryRaw = vi.fn().mockRejectedValue(new Error("db down"));
    const etlHealth = vi
      .fn()
      .mockResolvedValue({ data: null, error: "etl down" });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { $queryRawUnsafe: queryRaw },
    }));
    vi.doMock("@/lib/etl/client", () => ({ etlHealth }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

    const { GET } = await import("../src/app/api/health/route");
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(503);
    expect(body.dbError).toBe("db down");
    expect(body.etlError).toBe("etl down");
  });
});

describe("GET /api/players/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function mockApiResponsesModule() {
    vi.doMock("@/lib/api/responses", () => ({
      jsonError: (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), {
          status,
          headers: { "Cache-Control": "no-store" },
        }),
      jsonRateLimited: (retryAfter: number) =>
        new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfter),
          },
        }),
    }));
  }

  it("skips ETL call when player has invalid sofascoreId", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "p1",
      sofascoreId: "invalid-id",
      matchStats: [],
      marketAnalyses: [],
    });
    const etlPlayerShots = vi.fn();

    vi.doMock("@/lib/db/prisma", () => ({
      default: { player: { findUnique } },
    }));
    vi.doMock("@/lib/etl/client", () => ({ etlPlayerShots }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizePlayerShotsDateRangeQueryParams: vi.fn(() => ({
        from: undefined,
        to: undefined,
      })),
    }));
    vi.doMock("@/lib/validation", () => ({
      validateId: vi.fn((id: string) => id),
      validateSofascoreId: vi.fn(() => null),
    }));
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/players/[id]/route");
    const response = await GET(new Request("http://localhost/api/players/p1"), {
      params: Promise.resolve({ id: "p1" }),
    });
    const body = (await response.json()) as {
      player: { id: string };
      etlShots: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.player.id).toBe("p1");
    expect(body.etlShots).toEqual([]);
    expect(etlPlayerShots).not.toHaveBeenCalled();
  });

  it("calls ETL when player has valid numeric sofascoreId", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "p1",
      sofascoreId: "12345",
      matchStats: [],
      marketAnalyses: [],
    });
    const etlPlayerShots = vi.fn().mockResolvedValue({
      data: { items: [{ shotType: "goal" }] },
    });

    vi.doMock("@/lib/db/prisma", () => ({
      default: { player: { findUnique } },
    }));
    vi.doMock("@/lib/etl/client", () => ({ etlPlayerShots }));
    vi.doMock("@/lib/rate-limit", () => ({
      checkRateLimit: vi.fn(() => ({ allowed: true })),
      getClientIp: vi.fn(() => "127.0.0.1"),
    }));
    vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
    vi.doMock("@/lib/api/query-params", () => ({
      normalizePlayerShotsDateRangeQueryParams: vi.fn(() => ({
        from: undefined,
        to: undefined,
      })),
    }));
    vi.doMock("@/lib/validation", () => ({
      validateId: vi.fn((id: string) => id),
      validateSofascoreId: vi.fn((id: string) => id),
    }));
    mockApiResponsesModule();

    const { GET } = await import("../src/app/api/players/[id]/route");
    const response = await GET(new Request("http://localhost/api/players/p1"), {
      params: Promise.resolve({ id: "p1" }),
    });
    const body = (await response.json()) as {
      etlShots: Array<{ shotType: string }>;
    };

    expect(response.status).toBe(200);
    expect(etlPlayerShots).toHaveBeenCalledWith("12345", {
      limit: 50,
      from: undefined,
      to: undefined,
    });
    expect(body.etlShots).toEqual([{ shotType: "goal" }]);
  });
});
