import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";

type ViewMode = "grid" | "list";
type DayFilter = "all" | "today" | "tomorrow";

interface DashboardPreferencePayload {
  dayFilter: DayFilter;
  compFilter: string;
  searchQuery: string;
  view: ViewMode;
}

const DEFAULT_PREFERENCES: DashboardPreferencePayload = {
  dayFilter: "all",
  compFilter: "all",
  searchQuery: "",
  view: "grid",
};

function sanitizePayload(input: unknown): DashboardPreferencePayload {
  const data = (input ?? {}) as Partial<DashboardPreferencePayload>;

  const dayFilter: DayFilter =
    data.dayFilter === "today" || data.dayFilter === "tomorrow"
      ? data.dayFilter
      : "all";

  const view: ViewMode = data.view === "list" ? "list" : "grid";

  return {
    dayFilter,
    compFilter:
      typeof data.compFilter === "string" && data.compFilter.trim()
        ? data.compFilter.trim().slice(0, 120)
        : "all",
    searchQuery:
      typeof data.searchQuery === "string"
        ? data.searchQuery.trim().slice(0, 120)
        : "",
    view,
  };
}

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(DEFAULT_PREFERENCES, {
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
  } catch {
    return NextResponse.json(DEFAULT_PREFERENCES, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function PUT(request: Request) {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const payload = sanitizePayload(body);

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
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save preferences",
      },
      { status: 400 },
    );
  }
}
