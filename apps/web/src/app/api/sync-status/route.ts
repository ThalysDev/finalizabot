import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

// Force dynamic to avoid DB queries during build
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
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

    return new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error("[/api/sync-status] query failed", error);

    return new Response(JSON.stringify({ lastSync: null }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
}
