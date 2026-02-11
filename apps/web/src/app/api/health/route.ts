import { NextResponse } from "next/server";
import { etlHealth } from "@/lib/etl/client";
import prisma from "@/lib/db/prisma";

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
    await prisma.$queryRawUnsafe("SELECT 1");
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : "DB connection failed";
  }

  const etl = await etlHealth();

  const allOk = dbStatus === "ok" && !!etl.data;

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      db: dbStatus,
      dbError: exposeErrors ? dbError : null,
      etl: etl.data ? "ok" : "unavailable",
      etlError: exposeErrors ? etl.error : null,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
