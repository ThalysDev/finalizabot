import { describe, expect, it } from "vitest";
import {
  normalizeMatchesQueryParams,
  normalizeSearchQueryParams,
} from "../src/lib/api/query-params";

describe("normalizeSearchQueryParams()", () => {
  it("uses defaults when params are absent", () => {
    const params = new URLSearchParams();
    const result = normalizeSearchQueryParams(params);

    expect(result.q).toBeNull();
    expect(result.limit).toBe(8);
  });

  it("trims query and clamps limit", () => {
    const params = new URLSearchParams({
      q: "  Messi  ",
      limit: "999",
    });
    const result = normalizeSearchQueryParams(params);

    expect(result.q).toBe("Messi");
    expect(result.limit).toBe(20);
  });

  it("falls back limit on invalid numeric values", () => {
    const params = new URLSearchParams({ limit: "NaN" });
    const result = normalizeSearchQueryParams(params);

    expect(result.limit).toBe(8);
  });
});

describe("normalizeMatchesQueryParams()", () => {
  it("uses defaults when params are absent", () => {
    const params = new URLSearchParams();
    const result = normalizeMatchesQueryParams(params);

    expect(result.days).toBe(7);
    expect(result.limit).toBe(50);
  });

  it("clamps out-of-range values", () => {
    const params = new URLSearchParams({ days: "0", limit: "9999" });
    const result = normalizeMatchesQueryParams(params);

    expect(result.days).toBe(1);
    expect(result.limit).toBe(200);
  });

  it("falls back on invalid numeric values", () => {
    const params = new URLSearchParams({ days: "Infinity", limit: "abc" });
    const result = normalizeMatchesQueryParams(params);

    expect(result.days).toBe(7);
    expect(result.limit).toBe(50);
  });
});
