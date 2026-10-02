import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySessionToken } from "@/lib/session";

/**
 * Melindungi /admin dan /api/admin dengan sesi login (cookie HttpOnly bertanda tangan).
 * Jika kredensial admin belum diatur di environment, area admin DITUTUP (fail closed).
 */
const baseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

function withHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  const cron = process.env.CRON_SECRET;

  if (!user || !pass || pass.length < 12 || !cron || cron.length < 24) {
    return new NextResponse(
      "Area admin dinonaktifkan: atur ADMIN_USER, ADMIN_PASSWORD (min. 12 karakter), dan CRON_SECRET (min. 24 karakter).",
      { status: 503, headers: baseHeaders },
    );
  }

  if (pathname === "/admin/login") return withHeaders(NextResponse.next());

  const ok = await verifySessionToken(sessionSecret(pass, cron), request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return withHeaders(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return withHeaders(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }
  return withHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
