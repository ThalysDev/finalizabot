import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  DEFAULT_ALERT_SETTINGS,
  DEFAULT_PRO_PREFERENCES,
  sanitizeAlertSettingsPayload,
  sanitizeDashboardPreferencePayload,
  sanitizeProPreferencesPayload,
} from "../src/lib/preferences/sanitize";

describe("sanitizeDashboardPreferencePayload()", () => {
  it("falls back to defaults for invalid values", () => {
    const payload = sanitizeDashboardPreferencePayload({
      dayFilter: "invalid",
      compFilter: "",
      searchQuery: 123,
      view: "cards",
    });

    expect(payload).toEqual(DEFAULT_DASHBOARD_PREFERENCES);
  });

  it("accepts valid values and trims strings", () => {
    const payload = sanitizeDashboardPreferencePayload({
      dayFilter: "today",
      compFilter: "  Serie A  ",
      searchQuery: "  Neymar  ",
      view: "list",
    });

    expect(payload).toEqual({
      dayFilter: "today",
      compFilter: "Serie A",
      searchQuery: "Neymar",
      view: "list",
    });
  });
});

describe("sanitizeAlertSettingsPayload()", () => {
  it("clamps numeric bounds", () => {
    const payload = sanitizeAlertSettingsPayload({
      minRoi: 999,
      maxCv: -10,
      pushEnabled: true,
      emailEnabled: false,
      silentMode: true,
      leagues: ["Premier League"],
    });

    expect(payload.minRoi).toBe(100);
    expect(payload.maxCv).toBe(0);
  });

  it("falls back to defaults when leagues are invalid", () => {
    const payload = sanitizeAlertSettingsPayload({
      leagues: ["", "   ", 123],
    });

    expect(payload.leagues).toEqual(DEFAULT_ALERT_SETTINGS.leagues);
  });
});

describe("sanitizeProPreferencesPayload()", () => {
  it("accepts only allowed sort keys and filters", () => {
    const payload = sanitizeProPreferencesPayload({
      positionFilter: "invalid",
      sortKey: "unknown",
      sortDir: "asc",
      minMatches: 7,
      minEv: 5,
      searchQuery: "  Messi ",
    });

    expect(payload.positionFilter).toBe(DEFAULT_PRO_PREFERENCES.positionFilter);
    expect(payload.sortKey).toBe(DEFAULT_PRO_PREFERENCES.sortKey);
    expect(payload.sortDir).toBe("asc");
    expect(payload.minMatches).toBe(7);
    expect(payload.minEv).toBe(5);
    expect(payload.searchQuery).toBe("Messi");
  });

  it("clamps numeric values and defaults sortDir", () => {
    const payload = sanitizeProPreferencesPayload({
      positionFilter: "Atacante",
      sortKey: "ev",
      sortDir: "invalid",
      minMatches: 999,
      minEv: -999,
    });

    expect(payload.positionFilter).toBe("Atacante");
    expect(payload.sortKey).toBe("ev");
    expect(payload.sortDir).toBe("desc");
    expect(payload.minMatches).toBe(100);
    expect(payload.minEv).toBe(-100);
  });
});
