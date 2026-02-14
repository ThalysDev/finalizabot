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
    expect(error).toHaveBeenCalledWith("[/api/sync-status] query failed", dbError);
  });
});
