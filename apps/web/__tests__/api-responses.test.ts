import { describe, expect, it } from "vitest";
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
