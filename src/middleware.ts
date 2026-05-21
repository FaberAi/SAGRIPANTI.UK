import { NextRequest, NextResponse } from "next/server";

// Rotte del terminale di trading: accessibili solo dopo il login.
const PROTECTED = ["/terminal", "/portfolio", "/bots", "/chart"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = process.env.AUTH_TOKEN;
  // fail-closed: senza AUTH_TOKEN configurato nessuno è autenticato.
  const authed = !!token && req.cookies.get("saguk_auth")?.value === token;

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
    "/api/:path*",
  ],
};
