import { NextResponse } from "next/server";
import { etlHealth } from "@/lib/etl/client";
import prisma from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/health
 *
 * Verifica saúde do FinalizaBOT: banco de dados e ETL API.
 */
export async function GET() {
  const exposeErrors = process.env.NODE_ENV !== "production";

  // Check database connectivity
  let dbStatus: "ok" | "unavailable" = "unavailable";
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : "DB connection failed";
    logger.error("[/api/health] db check failed", err);
  }

  let etlStatus: "ok" | "unavailable" = "unavailable";
  let etlError: string | null = null;
  try {
    const etl = await etlHealth();
    if (etl.data) {
      etlStatus = "ok";
    } else {
      etlError = etl.error ?? "ETL unavailable";
    }
  } catch (err) {
    etlError = err instanceof Error ? err.message : "ETL health check failed";
    logger.error("[/api/health] etl check failed", err);
  }

  const isDbOk = dbStatus === "ok";
  const isEtlOk = etlStatus === "ok";

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  let statusCode = 200;

  if (!isDbOk) {
    overallStatus = "unhealthy";
    statusCode = 503;
  } else if (!isEtlOk) {
    overallStatus = "degraded";
  }

  return NextResponse.json(
    {
      status: overallStatus,
      db: dbStatus,
      etl: etlStatus,
      ...(exposeErrors ? { dbError, etlError } : {}),
      timestamp: new Date().toISOString(),
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
