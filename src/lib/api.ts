import "server-only";
import { NextResponse } from "next/server";

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** Header cache untuk endpoint baca publik (data hanya berubah setelah sync). */
export const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };
