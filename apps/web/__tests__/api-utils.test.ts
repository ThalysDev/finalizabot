import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../src/lib/rate-limit";
import {
  validateId,
  validateImageCacheId,
  validateImageProxyUrl,
  validateSearchQuery,
} from "../src/lib/validation";

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

describe("validateImageCacheId()", () => {
  it("accepts CUID format", () => {
    expect(validateImageCacheId("clx1234567890abcdefghijklm")).toBe(
      "clx1234567890abcdefghijklm",
    );
  });

  it("rejects numeric ids and invalid values", () => {
    expect(validateImageCacheId("12345")).toBeNull();
    expect(validateImageCacheId("../../../etc/passwd")).toBeNull();
    expect(validateImageCacheId(null)).toBeNull();
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

describe("validateImageProxyUrl()", () => {
  it("accepts valid sofascore https url", () => {
    const result = validateImageProxyUrl(
      "https://api.sofascore.com/api/v1/team/5981/image",
    );

    expect(result.ok).toBe(true);
  });

  it("rejects missing and malformed urls", () => {
    const missing = validateImageProxyUrl(null);
    expect(missing).toEqual({
      ok: false,
      status: 400,
      error: "Missing url param",
    });

    const malformed = validateImageProxyUrl("not-a-url");
    expect(malformed).toEqual({
      ok: false,
      status: 400,
      error: "Invalid url",
    });
  });

  it("rejects non-https and non-allowed hosts", () => {
    const http = validateImageProxyUrl("http://api.sofascore.com/api/v1/x");
    expect(http).toEqual({
      ok: false,
      status: 403,
      error: "Protocol not allowed",
    });

    const host = validateImageProxyUrl("https://example.com/image.png");
    expect(host).toEqual({
      ok: false,
      status: 403,
      error: "Host not allowed",
    });
  });

  it("rejects credentials and custom port", () => {
    const withCredentials = validateImageProxyUrl(
      "https://user:pass@api.sofascore.com/api/v1/team/1/image",
    );
    expect(withCredentials).toEqual({
      ok: false,
      status: 403,
      error: "URL not allowed",
    });

    const withPort = validateImageProxyUrl(
      "https://api.sofascore.com:8443/api/v1/team/1/image",
    );
    expect(withPort).toEqual({
      ok: false,
      status: 403,
      error: "URL not allowed",
    });
  });
});
