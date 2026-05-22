import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

// Solo gli admin possono gestire gli account (prodotto ad accesso su invito).
async function requireAdmin(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.isAdmin ? user : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, isAdmin: true, active: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
  };
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || null;
  const password = String(body.password ?? "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La password deve avere almeno 8 caratteri" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: hashPassword(password), isAdmin: false, active: true },
  });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}

// Attiva/disattiva un account cliente.
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id, active } = (await req.json()) as { id: number; active: boolean };
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  if (target.isAdmin) {
    return NextResponse.json({ error: "Non si può disattivare un admin" }, { status: 400 });
  }
  await prisma.user.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}
