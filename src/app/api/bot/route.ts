import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBot } from "@/lib/bot-engine";
import { getUserId } from "@/lib/session";

const unauthorized = () =>
  NextResponse.json({ error: "unauthorized" }, { status: 401 });

// Bot dell'utente loggato, con le ultime esecuzioni.
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const bots = await prisma.botConfig.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 8 } },
  });
  return NextResponse.json(bots);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const body = (await req.json()) as {
    name: string;
    symbol: string;
    strategy: string;
    params: Record<string, number>;
  };

  const bot = await prisma.botConfig.create({
    data: {
      name: body.name,
      symbol: body.symbol.toUpperCase(),
      strategy: body.strategy,
      params: JSON.stringify(body.params),
      active: false,
      userId,
    },
  });
  return NextResponse.json(bot);
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const { id, active } = (await req.json()) as { id: number; active: boolean };
  // verifica che il bot appartenga all'utente prima di modificarlo
  const owned = await prisma.botConfig.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Bot non trovato" }, { status: 404 });

  const bot = await prisma.botConfig.update({ where: { id }, data: { active } });
  // All'attivazione esegue subito una volta; poi ci pensa il cron giornaliero.
  if (active) runBot(id).catch(console.error);

  return NextResponse.json(bot);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const owned = await prisma.botConfig.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Bot non trovato" }, { status: 404 });

  await prisma.botConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Esecuzione manuale immediata di un bot ("RUN" nella UI).
export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return unauthorized();

  const { id } = (await req.json()) as { id: number };
  const owned = await prisma.botConfig.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Bot non trovato" }, { status: 404 });

  const result = await runBot(id);
  return NextResponse.json(result);
}
