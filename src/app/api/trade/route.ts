import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuote } from "@/lib/market";
import { getUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { symbol, type, quantity } = (await req.json()) as {
      symbol: string;
      type: "BUY" | "SELL";
      quantity: number;
    };

    if (!symbol || (type !== "BUY" && type !== "SELL") || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
    }

    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      include: { positions: true },
    });
    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: { userId },
        include: { positions: true },
      });
    }

    const price = (await getQuote(symbol)).price;
    if (!(price > 0)) {
      return NextResponse.json(
        { error: `Prezzo non disponibile per ${symbol}` },
        { status: 502 }
      );
    }
    const fee = price * quantity * 0.001;
    const existing = portfolio.positions.find((p) => p.symbol === symbol);

    if (type === "BUY") {
      const total = price * quantity + fee;
      if (portfolio.cash < total) {
        return NextResponse.json({ error: "Liquidità insufficiente" }, { status: 400 });
      }
      // Posizione, cassa e trade aggiornati in un'unica transazione atomica.
      const positionOp = existing
        ? prisma.position.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + quantity,
              avgPrice:
                (existing.avgPrice * existing.quantity + price * quantity) /
                (existing.quantity + quantity),
            },
          })
        : prisma.position.create({
            data: { symbol, quantity, avgPrice: price, portfolioId: portfolio.id },
          });
      await prisma.$transaction([
        prisma.portfolio.update({
          where: { id: portfolio.id },
          data: { cash: { decrement: total } },
        }),
        prisma.trade.create({
          data: { symbol, type, quantity, price, fee, total, portfolioId: portfolio.id },
        }),
        positionOp,
      ]);
      return NextResponse.json({ ok: true, price, total });
    }

    // SELL
    if (!existing || existing.quantity < quantity) {
      return NextResponse.json(
        { error: "Quantità insufficiente in portafoglio" },
        { status: 400 }
      );
    }
    const total = price * quantity - fee;
    const newQty = existing.quantity - quantity;
    const positionOp =
      newQty <= 0.0001
        ? prisma.position.delete({ where: { id: existing.id } })
        : prisma.position.update({ where: { id: existing.id }, data: { quantity: newQty } });
    await prisma.$transaction([
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { cash: { increment: total } },
      }),
      prisma.trade.create({
        data: { symbol, type, quantity, price, fee, total, portfolioId: portfolio.id },
      }),
      positionOp,
    ]);
    return NextResponse.json({ ok: true, price, total });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore durante l'operazione" },
      { status: 500 }
    );
  }
}
