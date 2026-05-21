import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let portfolio = await prisma.portfolio.findFirst({
    include: { positions: true, trades: { orderBy: { createdAt: "desc" }, take: 50 } },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {},
      include: { positions: true, trades: true },
    });
  }

  return NextResponse.json(portfolio);
}

export async function DELETE() {
  const portfolio = await prisma.portfolio.findFirst();
  if (portfolio) {
    await prisma.trade.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.position.deleteMany({ where: { portfolioId: portfolio.id } });
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { cash: 100000 },
    });
  }
  return NextResponse.json({ ok: true });
}
