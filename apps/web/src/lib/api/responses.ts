import { NextResponse } from "next/server";

type HeaderMap = Record<string, string>;

function buildHeaders(extra?: HeaderMap): HeaderMap {
  return {
    "Cache-Control": "no-store",
    ...(extra ?? {}),
  };
}

export function jsonError(
  message: string,
  status: number,
  headers?: HeaderMap,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: buildHeaders(headers) },
  );
}

export function jsonRateLimited(retryAfter: number): NextResponse {
  return jsonError("Too many requests", 429, {
    "Retry-After": String(retryAfter),
  });
}
