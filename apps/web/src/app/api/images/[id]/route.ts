import { logger } from "@/lib/logger";

/**
 * Image serving endpoint — reads cached images from the database.
 *
 * Images are downloaded during ETL sync and stored as bytea in the
 * public.ImageCache table.  This route serves them with aggressive
 * caching headers so Vercel's CDN can cache them at the edge.
 *
 * Usage: /api/images/<cuid-image-id>
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { validateImageCacheId } from "@/lib/validation";

const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = validateImageCacheId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
  }

  try {
    const image = await prisma.imageCache.findUnique({
      where: { id },
      select: { data: true, contentType: true },
    });

    if (!image) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(image.data, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}, immutable`,
        "CDN-Cache-Control": `public, max-age=${CACHE_TTL}`,
      },
    });
  } catch (err) {
    logger.error("[/api/images] fetch failed", err);
    return new NextResponse(null, { status: 500 });
  }
}
