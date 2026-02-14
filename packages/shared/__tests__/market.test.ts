import { describe, it, expect } from "vitest";
import { calcHits, mean, stdev, calcCV } from "../src/calc/market";

/* ============================================================================
   mean()
   ============================================================================ */

describe("mean()", () => {
  it("returns 0 for empty array", () => {
    expect(mean([])).toBe(0);
  });

  it("calculates mean of [1, 2, 3]", () => {
    expect(mean([1, 2, 3])).toBe(2);
  });

  it("calculates mean of single element", () => {
    expect(mean([5])).toBe(5);
  });

  it("handles decimals correctly", () => {
    expect(mean([1.5, 2.5])).toBe(2);
  });

  it("ignores non-finite values", () => {
    expect(mean([1, Number.NaN, 3, Number.POSITIVE_INFINITY])).toBe(2);
  });
});

/* ============================================================================
   stdev()
   ============================================================================ */

describe("stdev()", () => {
  it("returns null for empty array", () => {
    expect(stdev([])).toBeNull();
  });

  it("returns 0 for single element", () => {
    expect(stdev([5])).toBe(0);
  });

  it("returns 0 for identical elements", () => {
    expect(stdev([3, 3, 3])).toBe(0);
  });

  it("calculates population stdev of [2, 4, 4, 4, 5, 5, 7, 9]", () => {
    // Mean = 5, variance = 4, stdev = 2
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  it("calculates population stdev of [1, 2, 3]", () => {
    const result = stdev([1, 2, 3])!;
    expect(result).toBeCloseTo(0.8165, 3);
  });

  it("returns null when all values are non-finite", () => {
    expect(stdev([Number.NaN, Number.POSITIVE_INFINITY])).toBeNull();
  });
});

/* ============================================================================
   calcCV()
   ============================================================================ */

describe("calcCV()", () => {
  it("returns null for fewer than 2 elements", () => {
    expect(calcCV([])).toBeNull();
    expect(calcCV([1])).toBeNull();
  });

  it("returns null when mean is 0", () => {
    expect(calcCV([0, 0])).toBeNull();
  });

  it("returns 0 for identical values", () => {
    expect(calcCV([5, 5, 5])).toBe(0);
  });

  it("calculates CV correctly", () => {
    // [2, 4] => mean=3, stdev≈1.0, CV≈0.333
    const result = calcCV([2, 4])!;
    expect(result).toBeCloseTo(0.3333, 3);
  });

  it("calculates CV for real shot data", () => {
    // Simulate shot counts from 5 matches
    const shots = [1, 3, 2, 4, 0];
    const result = calcCV(shots)!;
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(2);
  });

  it("ignores non-finite values when computing CV", () => {
    const result = calcCV([2, Number.NaN, 4, Number.POSITIVE_INFINITY])!;
    expect(result).toBeCloseTo(0.3333, 3);
  });
});

/* ============================================================================
   calcHits()
   ============================================================================ */

describe("calcHits()", () => {
  it("returns 0 for empty array", () => {
    expect(calcHits([], 1.5, 5)).toBe(0);
  });

  it("counts hits above line in last N games", () => {
    const shots = [1, 2, 3, 0, 4];
    // Last 3 games: [3, 0, 4], line 1.5 => 3 >= 1.5 ✓, 0 >= 1.5 ✗, 4 >= 1.5 ✓
    expect(calcHits(shots, 1.5, 3)).toBe(2);
  });

  it("counts hits for line 0.5", () => {
    const shots = [0, 1, 0, 2, 0];
    // Last 5: all, line 0.5 => 1 ✓, 2 ✓ => total 2
    expect(calcHits(shots, 0.5, 5)).toBe(2);
  });

  it("counts hits for line 2.5", () => {
    const shots = [3, 1, 4, 2, 5];
    // Last 5: all, line 2.5 => 3 ✓, 1 ✗, 4 ✓, 2 ✗, 5 ✓ => total 3
    expect(calcHits(shots, 2.5, 5)).toBe(3);
  });

  it("uses only last N elements", () => {
    const shots = [10, 10, 10, 0, 0, 0, 0, 0];
    // Last 5: [0, 0, 0, 0, 0], line 0.5 => 0
    expect(calcHits(shots, 0.5, 5)).toBe(0);
  });

  it("handles lastN larger than array", () => {
    const shots = [2, 3];
    // slice(-10) returns full array when shorter
    expect(calcHits(shots, 1.5, 10)).toBe(2);
  });

  it("includes exact line value as a hit", () => {
    // >= line, so exact match counts
    expect(calcHits([1.5], 1.5, 5)).toBe(1);
  });

  it("returns 0 when lastN is zero or invalid", () => {
    expect(calcHits([1, 2, 3], 1.5, 0)).toBe(0);
    expect(calcHits([1, 2, 3], 1.5, -3)).toBe(0);
    expect(calcHits([1, 2, 3], 1.5, Number.NaN)).toBe(0);
  });

  it("ignores non-finite shot values", () => {
    expect(
      calcHits([1, Number.NaN, 2, Number.POSITIVE_INFINITY], 1.5, 10),
    ).toBe(1);
  });
});
