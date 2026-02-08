import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  // 1. Check env vars
  diagnostics.hasDbUrl = !!process.env.DATABASE_URL;
  diagnostics.dbUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + "...";
  diagnostics.hasDbUrlUnpooled = !!process.env.DATABASE_URL_UNPOOLED;
  diagnostics.nodeEnv = process.env.NODE_ENV;

  // 2. Try to import shared package
  try {
    const shared = await import("@finalizabot/shared");
    diagnostics.sharedImport = "ok";
    diagnostics.sharedKeys = Object.keys(shared);
    diagnostics.hasPrisma = !!shared.prisma;
    diagnostics.prismaType = typeof shared.prisma;
  } catch (e: unknown) {
    diagnostics.sharedImport = "failed";
    diagnostics.sharedError = e instanceof Error ? e.message : String(e);
    diagnostics.sharedStack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined;
  }

  // 3. Try to import @prisma/client directly
  try {
    const pc = await import("@prisma/client");
    diagnostics.prismaClientImport = "ok";
    diagnostics.prismaClientKeys = Object.keys(pc).slice(0, 10);
  } catch (e: unknown) {
    diagnostics.prismaClientImport = "failed";
    diagnostics.prismaClientError = e instanceof Error ? e.message : String(e);
  }

  // 4. Try a simple query
  try {
    const { prisma } = await import("@finalizabot/shared");
    const count = await prisma.match.count();
    diagnostics.queryTest = "ok";
    diagnostics.matchCount = count;
  } catch (e: unknown) {
    diagnostics.queryTest = "failed";
    diagnostics.queryError = e instanceof Error ? e.message : String(e);
    diagnostics.queryStack = e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
