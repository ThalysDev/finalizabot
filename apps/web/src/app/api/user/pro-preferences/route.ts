import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";

type SortDir = "asc" | "desc";

interface ProPreferencesPayload {
  positionFilter: string;
  sortKey: string;
  sortDir: SortDir;
  minMatches: number;
  minEv: number;
  searchQuery: string;
}

const DEFAULT_PAYLOAD: ProPreferencesPayload = {
  positionFilter: "Todos",
  sortKey: "ev",
  sortDir: "desc",
  minMatches: 0,
  minEv: 0,
  searchQuery: "",
};

function sanitizePayload(input: unknown): ProPreferencesPayload {
  const data = (input ?? {}) as Partial<ProPreferencesPayload>;

  return {
    positionFilter:
      typeof data.positionFilter === "string" && data.positionFilter.trim()
        ? data.positionFilter.trim().slice(0, 40)
        : DEFAULT_PAYLOAD.positionFilter,
    sortKey:
      typeof data.sortKey === "string" && data.sortKey.trim()
        ? data.sortKey.trim().slice(0, 30)
        : DEFAULT_PAYLOAD.sortKey,
    sortDir: data.sortDir === "asc" ? "asc" : "desc",
    minMatches:
      typeof data.minMatches === "number"
        ? Math.max(0, Math.min(100, Math.trunc(data.minMatches)))
        : DEFAULT_PAYLOAD.minMatches,
    minEv:
      typeof data.minEv === "number"
        ? Math.max(-100, Math.min(100, Math.trunc(data.minEv)))
        : DEFAULT_PAYLOAD.minEv,
    searchQuery:
      typeof data.searchQuery === "string"
        ? data.searchQuery.trim().slice(0, 120)
        : DEFAULT_PAYLOAD.searchQuery,
  };
}

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    type PreferenceRow = {
      positionFilter: string;
      sortKey: string;
      sortDir: string;
      minMatches: number;
      minEv: number;
      searchQuery: string;
    };

    const rows = await prisma.$queryRawUnsafe<PreferenceRow[]>(
      `
        SELECT
          "positionFilter",
          "sortKey",
          "sortDir",
          "minMatches",
          "minEv",
          "searchQuery"
        FROM "ProTablePreference"
        WHERE "userId" = $1
        LIMIT 1
      `,
      appUserId,
    );

    const preference = rows[0];

    if (!preference) {
      return NextResponse.json(DEFAULT_PAYLOAD, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(
      {
        positionFilter: preference.positionFilter,
        sortKey: preference.sortKey,
        sortDir: preference.sortDir === "asc" ? "asc" : "desc",
        minMatches: preference.minMatches,
        minEv: preference.minEv,
        searchQuery: preference.searchQuery,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(DEFAULT_PAYLOAD, {
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
      positionFilter: string;
      sortKey: string;
      sortDir: string;
      minMatches: number;
      minEv: number;
      searchQuery: string;
    };

    const rows = await prisma.$queryRawUnsafe<PreferenceRow[]>(
      `
        INSERT INTO "ProTablePreference" (
          "userId",
          "positionFilter",
          "sortKey",
          "sortDir",
          "minMatches",
          "minEv",
          "searchQuery"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("userId")
        DO UPDATE SET
          "positionFilter" = EXCLUDED."positionFilter",
          "sortKey" = EXCLUDED."sortKey",
          "sortDir" = EXCLUDED."sortDir",
          "minMatches" = EXCLUDED."minMatches",
          "minEv" = EXCLUDED."minEv",
          "searchQuery" = EXCLUDED."searchQuery",
          "updatedAt" = NOW()
        RETURNING
          "positionFilter",
          "sortKey",
          "sortDir",
          "minMatches",
          "minEv",
          "searchQuery"
      `,
      appUserId,
      payload.positionFilter,
      payload.sortKey,
      payload.sortDir,
      payload.minMatches,
      payload.minEv,
      payload.searchQuery,
    );

    const saved = rows[0];

    return NextResponse.json(
      {
        positionFilter: saved.positionFilter,
        sortKey: saved.sortKey,
        sortDir: saved.sortDir === "asc" ? "asc" : "desc",
        minMatches: saved.minMatches,
        minEv: saved.minEv,
        searchQuery: saved.searchQuery,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save pro preferences",
      },
      { status: 400 },
    );
  }
}
