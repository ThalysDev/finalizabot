import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";

interface AlertSettingsPayload {
  minRoi: number;
  maxCv: number;
  pushEnabled: boolean;
  emailEnabled: boolean;
  silentMode: boolean;
  leagues: string[];
}

const DEFAULT_PAYLOAD: AlertSettingsPayload = {
  minRoi: 10,
  maxCv: 0.5,
  pushEnabled: true,
  emailEnabled: false,
  silentMode: false,
  leagues: ["Premier League", "La Liga", "Champions League"],
};

function sanitizePayload(input: unknown): AlertSettingsPayload {
  const data = (input ?? {}) as Partial<AlertSettingsPayload>;

  const minRoi =
    typeof data.minRoi === "number"
      ? Math.max(0, Math.min(100, data.minRoi))
      : DEFAULT_PAYLOAD.minRoi;

  const maxCv =
    typeof data.maxCv === "number"
      ? Math.max(0, Math.min(2, data.maxCv))
      : DEFAULT_PAYLOAD.maxCv;

  const leagues = Array.isArray(data.leagues)
    ? data.leagues
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : DEFAULT_PAYLOAD.leagues;

  return {
    minRoi,
    maxCv,
    pushEnabled:
      typeof data.pushEnabled === "boolean"
        ? data.pushEnabled
        : DEFAULT_PAYLOAD.pushEnabled,
    emailEnabled:
      typeof data.emailEnabled === "boolean"
        ? data.emailEnabled
        : DEFAULT_PAYLOAD.emailEnabled,
    silentMode:
      typeof data.silentMode === "boolean"
        ? data.silentMode
        : DEFAULT_PAYLOAD.silentMode,
    leagues: leagues.length > 0 ? leagues : DEFAULT_PAYLOAD.leagues,
  };
}

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.alertSettings.findUnique({
      where: { userId: appUserId },
      select: {
        minRoi: true,
        maxCv: true,
        pushEnabled: true,
        emailEnabled: true,
        silentMode: true,
        leagues: true,
      },
    });

    if (!settings) {
      return NextResponse.json(DEFAULT_PAYLOAD, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(
      {
        minRoi: settings.minRoi,
        maxCv: settings.maxCv,
        pushEnabled: settings.pushEnabled,
        emailEnabled: settings.emailEnabled,
        silentMode: settings.silentMode,
        leagues: settings.leagues,
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

    const saved = await prisma.alertSettings.upsert({
      where: { userId: appUserId },
      create: {
        userId: appUserId,
        minRoi: payload.minRoi,
        maxCv: payload.maxCv,
        pushEnabled: payload.pushEnabled,
        emailEnabled: payload.emailEnabled,
        silentMode: payload.silentMode,
        leagues: payload.leagues,
      },
      update: {
        minRoi: payload.minRoi,
        maxCv: payload.maxCv,
        pushEnabled: payload.pushEnabled,
        emailEnabled: payload.emailEnabled,
        silentMode: payload.silentMode,
        leagues: payload.leagues,
      },
      select: {
        minRoi: true,
        maxCv: true,
        pushEnabled: true,
        emailEnabled: true,
        silentMode: true,
        leagues: true,
      },
    });

    return NextResponse.json(
      {
        minRoi: saved.minRoi,
        maxCv: saved.maxCv,
        pushEnabled: saved.pushEnabled,
        emailEnabled: saved.emailEnabled,
        silentMode: saved.silentMode,
        leagues: saved.leagues,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save alert settings",
      },
      { status: 400 },
    );
  }
}
