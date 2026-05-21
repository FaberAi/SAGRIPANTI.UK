import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuote } from "@/lib/market";

export async function POST(req: NextRequest) {
  const { symbol, type, quantity } = await req.json() as {
    symbol: string;
    type: "BUY" | "SELL";
    quantity: number;
  };

  if (!symbol || !type || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
  }

  let portfolio = await prisma.portfolio.findFirst({ include: { positions: true } });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({ data: {}, include: { positions: true } });
  }

  const quote = await getQuote(symbol);
  const price = quote.price;
  const fee = price * quantity * 0.001;

  if (type === "BUY") {
    const total = price * quantity + fee;
    if (portfolio.cash < total) {
      return NextResponse.json({ error: "Liquidità insufficiente" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { cash: { decrement: total } },
      }),
      prisma.trade.create({
        data: { symbol, type, quantity, price, fee, total, portfolioId: portfolio.id },
      }),
    ]);

    const existing = portfolio.positions.find((p) => p.symbol === symbol);
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / newQty;
      await prisma.position.update({
        where: { id: existing.id },
        data: { quantity: newQty, avgPrice: newAvg },
      });
    } else {
      await prisma.position.create({
        data: { symbol, quantity, avgPrice: price, portfolioId: portfolio.id },
      });
    }

    return NextResponse.json({ ok: true, price, total });
  }

  if (type === "SELL") {
    const position = portfolio.positions.find((p) => p.symbol === symbol);
    if (!position || position.quantity < quantity) {
      return NextResponse.json({ error: "Quantità insufficiente in portafoglio" }, { status: 400 });
    }

    const total = price * quantity - fee;
    await prisma.$transaction([
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { cash: { increment: total } },
      }),
      prisma.trade.create({
        data: { symbol, type, quantity, price, fee, total, portfolioId: portfolio.id },
      }),
    ]);

    const newQty = position.quantity - quantity;
    if (newQty <= 0.0001) {
      await prisma.position.delete({ where: { id: position.id } });
    } else {
      await prisma.position.update({ where: { id: position.id }, data: { quantity: newQty } });
    }

    return NextResponse.json({ ok: true, price, total });
  }

  return NextResponse.json({ error: "Tipo non valido" }, { status: 400 });
}
