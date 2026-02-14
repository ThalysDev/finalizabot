import { describe, expect, it } from "vitest";
import { normalizeMatchShotsInput } from "../src/lib/fetchers/match-shots";

describe("normalizeMatchShotsInput()", () => {
  it("returns null matchId for empty or whitespace ids", () => {
    expect(normalizeMatchShotsInput(null).matchId).toBeNull();
    expect(normalizeMatchShotsInput("   ").matchId).toBeNull();
  });

  it("trims and preserves valid id", () => {
    const normalized = normalizeMatchShotsInput("  12345  ");
    expect(normalized.matchId).toBe("12345");
  });

  it("uses defaults for invalid params", () => {
    const normalized = normalizeMatchShotsInput("123", {
      limit: Number.NaN,
      offset: Number.POSITIVE_INFINITY,
    });

    expect(normalized.params.limit).toBe(100);
    expect(normalized.params.offset).toBe(0);
  });

  it("clamps out-of-range params", () => {
    const normalized = normalizeMatchShotsInput("123", {
      limit: 999,
      offset: -20,
    });

    expect(normalized.params.limit).toBe(200);
    expect(normalized.params.offset).toBe(0);
  });

  it("truncates decimal params", () => {
    const normalized = normalizeMatchShotsInput("123", {
      limit: 12.9,
      offset: 4.7,
    });

    expect(normalized.params.limit).toBe(12);
    expect(normalized.params.offset).toBe(4);
  });

  it("accepts numeric strings from URL query params", () => {
    const normalized = normalizeMatchShotsInput("123", {
      limit: "25",
      offset: "10",
    });

    expect(normalized.params.limit).toBe(25);
    expect(normalized.params.offset).toBe(10);
  });
});
