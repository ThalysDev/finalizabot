import { beforeEach, describe, expect, it, vi } from "vitest";

function makeJsonRequest(url: string, payload: unknown) {
  return new Request(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function makeInvalidJsonRequest(url: string) {
  return new Request(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
}

function mockCommonUserPreferencesModules() {
  vi.doMock("@/lib/api/responses", () => ({
    jsonError: (message: string, status: number) =>
      new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Cache-Control": "no-store" },
      }),
  }));

  vi.doMock("@/lib/preferences/sanitize", () => ({
    DEFAULT_DASHBOARD_PREFERENCES: {
      dayFilter: "all",
      compFilter: "all",
      searchQuery: "",
      view: "grid",
    },
    DEFAULT_ALERT_SETTINGS: {
      minRoi: 10,
      maxCv: 0.5,
      pushEnabled: true,
      emailEnabled: false,
      silentMode: false,
      leagues: ["Premier League"],
    },
    DEFAULT_PRO_PREFERENCES: {
      positionFilter: "Todos",
      sortKey: "ev",
      sortDir: "desc",
      minMatches: 0,
      minEv: 0,
      searchQuery: "",
    },
    sanitizeDashboardPreferencePayload: (input: unknown) =>
      input ?? {
        dayFilter: "all",
        compFilter: "all",
        searchQuery: "",
        view: "grid",
      },
    sanitizeAlertSettingsPayload: (input: unknown) =>
      input ?? {
        minRoi: 10,
        maxCv: 0.5,
        pushEnabled: true,
        emailEnabled: false,
        silentMode: false,
        leagues: ["Premier League"],
      },
    sanitizeProPreferencesPayload: (input: unknown) =>
      input ?? {
        positionFilter: "Todos",
        sortKey: "ev",
        sortDir: "desc",
        minMatches: 0,
        minEv: 0,
        searchQuery: "",
      },
  }));
}

describe("User preference routes hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("PUT /api/user/dashboard-preferences", () => {
    it("returns 400 for invalid JSON body", async () => {
      const queryRawUnsafe = vi.fn();
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } =
        await import("../src/app/api/user/dashboard-preferences/route");
      const response = await PUT(
        makeInvalidJsonRequest(
          "http://localhost/api/user/dashboard-preferences",
        ),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid JSON body");
      expect(queryRawUnsafe).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/dashboard-preferences] invalid json",
        expect.any(SyntaxError),
      );
    });

    it("returns 500 when persistence fails", async () => {
      const dbError = new Error("db write failed");
      const queryRawUnsafe = vi.fn().mockRejectedValue(dbError);
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } =
        await import("../src/app/api/user/dashboard-preferences/route");
      const response = await PUT(
        makeJsonRequest("http://localhost/api/user/dashboard-preferences", {
          dayFilter: "today",
          compFilter: "Premier League",
          searchQuery: "Haaland",
          view: "grid",
        }),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to save preferences");
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/dashboard-preferences] save failed",
        dbError,
      );
    });

    it("returns no-store on successful save", async () => {
      const queryRawUnsafe = vi.fn().mockResolvedValue([
        {
          dayFilter: "today",
          competitionFilter: "Premier League",
          searchQuery: "Haaland",
          viewMode: "list",
        },
      ]);

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

      const { PUT } =
        await import("../src/app/api/user/dashboard-preferences/route");
      const response = await PUT(
        makeJsonRequest("http://localhost/api/user/dashboard-preferences", {
          dayFilter: "today",
          compFilter: "Premier League",
          searchQuery: "Haaland",
          view: "list",
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
  });

  describe("PUT /api/user/alert-settings", () => {
    it("returns 400 for invalid JSON body", async () => {
      const upsert = vi.fn();
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { alertSettings: { upsert } },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } = await import("../src/app/api/user/alert-settings/route");
      const response = await PUT(
        makeInvalidJsonRequest("http://localhost/api/user/alert-settings"),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid JSON body");
      expect(upsert).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/alert-settings] invalid json",
        expect.any(SyntaxError),
      );
    });

    it("returns 500 when persistence fails", async () => {
      const dbError = new Error("db write failed");
      const upsert = vi.fn().mockRejectedValue(dbError);
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { alertSettings: { upsert } },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } = await import("../src/app/api/user/alert-settings/route");
      const response = await PUT(
        makeJsonRequest("http://localhost/api/user/alert-settings", {
          minRoi: 10,
          maxCv: 0.5,
          pushEnabled: true,
          emailEnabled: false,
          silentMode: false,
          leagues: ["Premier League"],
        }),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to save alert settings");
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/alert-settings] save failed",
        dbError,
      );
    });
  });

  describe("PUT /api/user/pro-preferences", () => {
    it("returns 400 for invalid JSON body", async () => {
      const queryRawUnsafe = vi.fn();
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } = await import("../src/app/api/user/pro-preferences/route");
      const response = await PUT(
        makeInvalidJsonRequest("http://localhost/api/user/pro-preferences"),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid JSON body");
      expect(queryRawUnsafe).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/pro-preferences] invalid json",
        expect.any(SyntaxError),
      );
    });

    it("returns 500 when persistence fails", async () => {
      const dbError = new Error("db write failed");
      const queryRawUnsafe = vi.fn().mockRejectedValue(dbError);
      const logError = vi.fn();

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: logError } }));

      const { PUT } = await import("../src/app/api/user/pro-preferences/route");
      const response = await PUT(
        makeJsonRequest("http://localhost/api/user/pro-preferences", {
          positionFilter: "Atacante",
          sortKey: "ev",
          sortDir: "desc",
          minMatches: 3,
          minEv: 5,
          searchQuery: "Kane",
        }),
      );
      const body = (await response.json()) as { error: string };

      expect(response.status).toBe(500);
      expect(body.error).toBe("Failed to save pro preferences");
      expect(logError).toHaveBeenCalledWith(
        "[/api/user/pro-preferences] save failed",
        dbError,
      );
    });

    it("returns no-store on successful save", async () => {
      const queryRawUnsafe = vi.fn().mockResolvedValue([
        {
          positionFilter: "Atacante",
          sortKey: "ev",
          sortDir: "desc",
          minMatches: 3,
          minEv: 5,
          searchQuery: "Kane",
        },
      ]);

      vi.doMock("@/lib/auth/resolveAppUserId", () => ({
        resolveOrCreateAppUserId: vi.fn().mockResolvedValue("user-1"),
      }));
      mockCommonUserPreferencesModules();
      vi.doMock("@/lib/db/prisma", () => ({
        default: { $queryRawUnsafe: queryRawUnsafe },
      }));
      vi.doMock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

      const { PUT } = await import("../src/app/api/user/pro-preferences/route");
      const response = await PUT(
        makeJsonRequest("http://localhost/api/user/pro-preferences", {
          positionFilter: "Atacante",
          sortKey: "ev",
          sortDir: "desc",
          minMatches: 3,
          minEv: 5,
          searchQuery: "Kane",
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
  });
});
