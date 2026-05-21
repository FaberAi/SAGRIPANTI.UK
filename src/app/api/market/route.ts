import { NextRequest, NextResponse } from "next/server";
import { getQuote, getHistoricalData, DEFAULT_WATCHLIST } from "@/lib/market";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const action = searchParams.get("action") ?? "quote";
  const interval = (searchParams.get("interval") ?? "1d") as "1d" | "1wk" | "1mo";
  const range = (searchParams.get("range") ?? "3mo") as "1mo" | "3mo" | "6mo" | "1y" | "5y";

  try {
    if (action === "watchlist") {
      const quotes = await Promise.allSettled(
        DEFAULT_WATCHLIST.map((s) => getQuote(s))
      );
      const data = quotes
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof getQuote>>>).value);
      return NextResponse.json(data);
    }

    if (!symbol) {
      return NextResponse.json({ error: "symbol required" }, { status: 400 });
    }

    if (action === "history") {
      const data = await getHistoricalData(symbol, interval, range);
      return NextResponse.json(data);
    }

    const quote = await getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore sconosciuto" },
      { status: 500 }
    );
  }
}
