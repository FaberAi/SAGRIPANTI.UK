import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// Rotte riservate: accessibili solo dopo il login.
const PROTECTED = ["/terminal", "/portfolio", "/bots", "/chart", "/admin", "/cockpit"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const authed = userId !== null;

  // Pagine protette → redirect al login.
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // API dati protette → 401 (escluse /api/auth e /api/cron).
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/cron")
  ) {
    if (!authed) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/terminal/:path*",
    "/portfolio/:path*",
    "/bots/:path*",
    "/chart/:path*",
    "/admin/:path*",
    "/cockpit/:path*",
    "/api/:path*",
  ],
};
