import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";
import {
  DEFAULT_PRO_PREFERENCES,
  sanitizeProPreferencesPayload,
} from "@/lib/preferences/sanitize";
import { jsonError } from "@/lib/api/responses";
import { logger } from "@/lib/logger";

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return jsonError("Unauthorized", 401);
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
      return NextResponse.json(DEFAULT_PRO_PREFERENCES, {
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
  } catch (error) {
    logger.error("[/api/user/pro-preferences] load failed", error);
    return NextResponse.json(DEFAULT_PRO_PREFERENCES, {
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
    logger.error("[/api/user/pro-preferences] invalid json", error);
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const payload = sanitizeProPreferencesPayload(body);

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
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    logger.error("[/api/user/pro-preferences] save failed", error);
    return jsonError("Failed to save pro preferences", 500);
  }
}
