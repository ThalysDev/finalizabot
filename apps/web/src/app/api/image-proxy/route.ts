/**
 * Image Proxy — serves SofaScore images through our own domain.
 *
 * SofaScore blocks direct browser requests (CORS) and Vercel's image
 * optimization proxy (IP-level blocking → 502). This route fetches images
 * server-side with the correct headers and returns them to the client
 * with aggressive caching.
 *
 * Usage: /api/image-proxy?url=https://api.sofascore.com/api/v1/team/5981/image
 */

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["api.sofascore.com"];
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate hostname
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/png,image/jpeg,image/svg+xml,image/*,*/*",
        Referer: "https://www.sofascore.com/",
        Origin: "https://www.sofascore.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      },
      next: { revalidate: CACHE_TTL },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        "CDN-Cache-Control": `public, max-age=${CACHE_TTL}`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
