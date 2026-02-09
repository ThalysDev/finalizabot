import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../src/lib/rate-limit";
import { validateId, validateSearchQuery } from "../src/lib/validation";

/* ============================================================================
   Rate Limiter
   ============================================================================ */

describe("checkRateLimit()", () => {
  // Each test uses a unique identifier to avoid interference
  let counter = 0;
  function uniqueId() {
    return `test-${Date.now()}-${++counter}`;
  }

  it("allows first request", () => {
    const result = checkRateLimit(uniqueId(), { limit: 5, windowSec: 60 });
    expect(result.allowed).toBe(true);
  });

  it("allows up to limit requests", () => {
    const id = uniqueId();
    const config = { limit: 3, windowSec: 60 };
    expect(checkRateLimit(id, config).allowed).toBe(true);
    expect(checkRateLimit(id, config).allowed).toBe(true);
    expect(checkRateLimit(id, config).allowed).toBe(true);
  });

  it("blocks after limit exceeded", () => {
    const id = uniqueId();
    const config = { limit: 2, windowSec: 60 };
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const result = checkRateLimit(id, config);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfter).toBeGreaterThan(0);
    }
  });

  it("different identifiers have separate buckets", () => {
    const config = { limit: 1, windowSec: 60 };
    const id1 = uniqueId();
    const id2 = uniqueId();
    checkRateLimit(id1, config);
    // id1 is exhausted, but id2 should still work
    expect(checkRateLimit(id2, config).allowed).toBe(true);
  });
});

/* ============================================================================
   Validation
   ============================================================================ */

describe("validateId()", () => {
  it("accepts CUID format", () => {
    expect(validateId("clx1234567890abcdefghijklm")).toBe("clx1234567890abcdefghijklm");
  });

  it("accepts numeric IDs", () => {
    expect(validateId("12345")).toBe("12345");
    expect(validateId("1")).toBe("1");
  });

  it("rejects empty/null/undefined", () => {
    expect(validateId("")).toBeNull();
    expect(validateId(null)).toBeNull();
    expect(validateId(undefined)).toBeNull();
  });

  it("rejects SQL injection attempts", () => {
    expect(validateId("1; DROP TABLE users")).toBeNull();
    expect(validateId("' OR 1=1 --")).toBeNull();
  });

  it("rejects path traversal", () => {
    expect(validateId("../../../etc/passwd")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(validateId("  12345  ")).toBe("12345");
  });
});

describe("validateSearchQuery()", () => {
  it("accepts valid queries", () => {
    expect(validateSearchQuery("Neymar")).toBe("Neymar");
    expect(validateSearchQuery("ab")).toBe("ab");
  });

  it("rejects too short queries", () => {
    expect(validateSearchQuery("a")).toBeNull();
    expect(validateSearchQuery("")).toBeNull();
  });

  it("rejects null/undefined", () => {
    expect(validateSearchQuery(null)).toBeNull();
    expect(validateSearchQuery(undefined)).toBeNull();
  });

  it("trims and validates", () => {
    expect(validateSearchQuery("  Neymar  ")).toBe("Neymar");
  });

  it("rejects excessively long queries", () => {
    expect(validateSearchQuery("a".repeat(101))).toBeNull();
  });
});
