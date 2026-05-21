import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBot } from "@/lib/bot-engine";

export async function GET() {
  const bots = await prisma.botConfig.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(bots);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
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
    },
  });
  return NextResponse.json(bot);
}

export async function PATCH(req: NextRequest) {
  const { id, active } = await req.json() as { id: number; active: boolean };
  const bot = await prisma.botConfig.update({ where: { id }, data: { active } });

  if (active) {
    // fire once immediately
    runBot(id).catch(console.error);
  }

  return NextResponse.json(bot);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.botConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Endpoint to manually trigger a bot run
export async function PUT(req: NextRequest) {
  const { id } = await req.json() as { id: number };
  const result = await runBot(id);
  return NextResponse.json({ result });
}
