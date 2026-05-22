import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

// Portafoglio dell'utente loggato (uno per utente).
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let portfolio = await prisma.portfolio.findFirst({
    where: { userId },
    include: { positions: true, trades: { orderBy: { createdAt: "desc" }, take: 50 } },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: { userId },
      include: { positions: true, trades: true },
    });
  }

  return NextResponse.json(portfolio);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const portfolio = await prisma.portfolio.findFirst({ where: { userId } });
  if (portfolio) {
    await prisma.$transaction([
      prisma.trade.deleteMany({ where: { portfolioId: portfolio.id } }),
      prisma.position.deleteMany({ where: { portfolioId: portfolio.id } }),
      prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash: 100000 } }),
    ]);
  }
  return NextResponse.json({ ok: true });
}
