import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { resolveOrCreateAppUserId } from "@/lib/auth/resolveAppUserId";
import {
  DEFAULT_ALERT_SETTINGS,
  sanitizeAlertSettingsPayload,
} from "@/lib/preferences/sanitize";
import { jsonError } from "@/lib/api/responses";
import { logger } from "@/lib/logger";

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
  } catch (error) {
    logger.error("[/api/user/alert-settings] load failed", error);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logger.error("[/api/user/alert-settings] invalid json", error);
    return jsonError("Invalid JSON body", 400);
  }

  try {
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
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    logger.error("[/api/user/alert-settings] save failed", error);
    return jsonError("Failed to save alert settings", 500);
  }
}
