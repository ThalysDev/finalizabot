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
