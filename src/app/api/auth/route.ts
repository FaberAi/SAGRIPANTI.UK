import { NextRequest, NextResponse } from "next/server";

// Gate ad accesso unico: ID operatore (TRADING_USER) + password
// (TRADING_PASSWORD). In caso di esito positivo si imposta un cookie httpOnly
// che vale AUTH_TOKEN; il middleware lo confronta per proteggere le rotte del
// terminale.
const COOKIE = "saguk_auth";

export async function POST(req: NextRequest) {
  let id = "";
  let password = "";
  try {
    const body = await req.json();
    id = body?.id ?? "";
    password = body?.password ?? "";
  } catch {
    id = "";
    password = "";
  }

  const expectedPassword = process.env.TRADING_PASSWORD;
  const expectedUser = process.env.TRADING_USER;
  // L'ID è verificato solo se TRADING_USER è configurato: evita il lock-out
  // se la variabile non è ancora stata impostata su Vercel.
  const idOk = !expectedUser || id === expectedUser;
  if (!expectedPassword || password !== expectedPassword || !idOk) {
    return NextResponse.json(
      { error: "Credenziali non valide" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, process.env.AUTH_TOKEN ?? "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
