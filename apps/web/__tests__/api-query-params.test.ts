import { describe, expect, it } from "vitest";
import {
  normalizeDebugTableQueryParams,
  normalizeMatchesQueryParams,
  normalizePlayerShotsDateRangeQueryParams,
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

describe("normalizePlayerShotsDateRangeQueryParams()", () => {
  it("returns undefined values when params are absent", () => {
    const result = normalizePlayerShotsDateRangeQueryParams(
      new URLSearchParams(),
    );

    expect(result).toEqual({ from: undefined, to: undefined });
  });

  it("drops invalid date values", () => {
    const result = normalizePlayerShotsDateRangeQueryParams(
      new URLSearchParams({ from: "invalid-date", to: "2026-02-10" }),
    );

    expect(result.from).toBeUndefined();
    expect(result.to).toBe("2026-02-10T00:00:00.000Z");
  });

  it("swaps range when from is greater than to", () => {
    const result = normalizePlayerShotsDateRangeQueryParams(
      new URLSearchParams({ from: "2026-02-15", to: "2026-02-10" }),
    );

    expect(result.from).toBe("2026-02-10T00:00:00.000Z");
    expect(result.to).toBe("2026-02-15T00:00:00.000Z");
  });
});

describe("normalizeDebugTableQueryParams()", () => {
  it("uses defaults when params are absent", () => {
    const result = normalizeDebugTableQueryParams(new URLSearchParams());

    expect(result).toEqual({
      line: 1.5,
      minMatches: 5,
      limit: 50,
    });
  });

  it("clamps out-of-range values", () => {
    const result = normalizeDebugTableQueryParams(
      new URLSearchParams({
        line: "99",
        minMatches: "0",
        limit: "999",
      }),
    );

    expect(result.line).toBe(10);
    expect(result.minMatches).toBe(1);
    expect(result.limit).toBe(200);
  });

  it("falls back on invalid values", () => {
    const result = normalizeDebugTableQueryParams(
      new URLSearchParams({
        line: "abc",
        minMatches: "NaN",
        limit: "Infinity",
      }),
    );

    expect(result).toEqual({
      line: 1.5,
      minMatches: 5,
      limit: 50,
    });
  });
});
