import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// Force dynamic to avoid DB queries during build
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const lastRun = await prisma.etlIngestRun.findFirst({
      where: {
        status: "success",
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    });

    const payload = {
      lastSync: lastRun?.finishedAt ? lastRun.finishedAt.toISOString() : null,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error("[/api/sync-status] query failed", error);

    return NextResponse.json(
      { lastSync: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
