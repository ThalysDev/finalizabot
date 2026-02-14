import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";
import {
  DEFAULT_ALERT_SETTINGS,
  sanitizeAlertSettingsPayload,
} from "@/lib/preferences/sanitize";
import { jsonError } from "@/lib/api/responses";

export async function GET() {
  const appUserId = await resolveOrCreateAppUserId();
  if (!appUserId) {
    return jsonError("Unauthorized", 401);
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
      return NextResponse.json(DEFAULT_ALERT_SETTINGS, {
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
    return NextResponse.json(DEFAULT_ALERT_SETTINGS, {
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

  try {
    const body = (await request.json()) as unknown;
    const payload = sanitizeAlertSettingsPayload(body);

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
  } catch {
    return jsonError("Failed to save alert settings", 400);
  }
}
