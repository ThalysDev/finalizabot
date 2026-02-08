import { NextResponse } from "next/server";
import { etlHealth } from "@/lib/etl/client";

/**
 * GET /api/health
 *
 * Verifica saúde do FinalizaBOT e da conexão com a ETL API.
 */
export async function GET() {
  const etl = await etlHealth();

  return NextResponse.json({
    bot: "ok",
    etl: etl.data ? "ok" : "unavailable",
    etlError: etl.error,
    timestamp: new Date().toISOString(),
  });
}
