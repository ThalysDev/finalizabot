import { describe, expect, it } from "vitest";
import { isPublicPath } from "../src/lib/validation";

describe("isPublicPath()", () => {
  it("allows configured public pages", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-up")).toBe(true);
    expect(isPublicPath("/match/abc")).toBe(true);
  });

  it("allows configured public API routes", () => {
    expect(isPublicPath("/api/health")).toBe(true);
    expect(isPublicPath("/api/image-proxy")).toBe(true);
    expect(isPublicPath("/api/images/123")).toBe(true);
    expect(isPublicPath("/api/sync-status")).toBe(true);
  });

  it("treats all other paths as protected", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/pro")).toBe(false);
    expect(isPublicPath("/api/search")).toBe(false);
    expect(isPublicPath("/api/matches")).toBe(false);
    expect(isPublicPath("/api/user/dashboard-preferences")).toBe(false);
  });

  it("normalizes trailing slash and whitespace", () => {
    expect(isPublicPath(" /api/health/ ")).toBe(true);
    expect(isPublicPath(" /dashboard/ ")).toBe(false);
  });
});
