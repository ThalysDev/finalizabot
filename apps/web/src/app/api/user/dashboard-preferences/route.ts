import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";
import { jsonError } from "@/lib/api/responses";
import { logger } from "@/lib/logger";
import {
  type DashboardPreferencePayload,
  DEFAULT_DASHBOARD_PREFERENCES,
  sanitizeDashboardPreferencePayload,
} from "@/lib/preferences/sanitize";

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return jsonError("Unauthorized", 401);
  }

  try {
    type PreferenceRow = {
      dayFilter: string;
      competitionFilter: string;
      searchQuery: string;
      viewMode: string;
    };

    const rows = await prisma.$queryRawUnsafe<PreferenceRow[]>(
      `
        SELECT
          "dayFilter",
          "competitionFilter",
          "searchQuery",
          "viewMode"
        FROM "DashboardPreference"
        WHERE "userId" = $1
        LIMIT 1
      `,
      appUserId,
    );

    const preference = rows[0];

    if (!preference) {
      return NextResponse.json(DEFAULT_DASHBOARD_PREFERENCES, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const payload: DashboardPreferencePayload = {
      dayFilter:
        preference.dayFilter === "today" || preference.dayFilter === "tomorrow"
          ? preference.dayFilter
          : "all",
      compFilter: preference.competitionFilter || "all",
      searchQuery: preference.searchQuery || "",
      view: preference.viewMode === "list" ? "list" : "grid",
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("[/api/user/dashboard-preferences] load failed", error);
    return NextResponse.json(DEFAULT_DASHBOARD_PREFERENCES, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function PUT(request: Request) {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logger.error("[/api/user/dashboard-preferences] invalid json", error);
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const payload = sanitizeDashboardPreferencePayload(body);

    type PreferenceRow = {
      dayFilter: string;
      competitionFilter: string;
      searchQuery: string;
      viewMode: string;
    };

    const rows = await prisma.$queryRawUnsafe<PreferenceRow[]>(
      `
        INSERT INTO "DashboardPreference" (
          "userId",
          "dayFilter",
          "competitionFilter",
          "searchQuery",
          "viewMode"
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("userId")
        DO UPDATE SET
          "dayFilter" = EXCLUDED."dayFilter",
          "competitionFilter" = EXCLUDED."competitionFilter",
          "searchQuery" = EXCLUDED."searchQuery",
          "viewMode" = EXCLUDED."viewMode",
          "updatedAt" = NOW()
        RETURNING
          "dayFilter",
          "competitionFilter",
          "searchQuery",
          "viewMode"
      `,
      appUserId,
      payload.dayFilter,
      payload.compFilter,
      payload.searchQuery,
      payload.view,
    );

    const saved = rows[0];

    return NextResponse.json(
      {
        dayFilter: saved.dayFilter,
        compFilter: saved.competitionFilter,
        searchQuery: saved.searchQuery,
        view: saved.viewMode,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    logger.error("[/api/user/dashboard-preferences] save failed", error);
    return jsonError("Failed to save preferences", 500);
  }
}
