import { NextRequest, NextResponse } from "next/server";
import { backtest } from "@/lib/backtest";
import { getUserId } from "@/lib/session";
import type { Strategy } from "@/lib/strategy";

export const dynamic = "force-dynamic";
// Il backtest fa una chiamata esterna (Yahoo / CoinGecko): margine di tempo.
export const maxDuration = 30;

const VALID_STRATEGIES: Strategy[] = ["MA_CROSSOVER", "RSI_REVERSION", "MACD_SIGNAL", "CONFLUENCE"];

/** Esegue un backtest su un anno di storico e restituisce le metriche. */
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { symbol?: string; strategy?: string; params?: Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const symbol = (body.symbol ?? "").trim().toUpperCase();
  const strategy = body.strategy as Strategy;
  const params = body.params ?? {};

  if (!symbol) return NextResponse.json({ error: "Simbolo mancante" }, { status: 400 });
  if (!VALID_STRATEGIES.includes(strategy)) {
    return NextResponse.json({ error: "Strategia non valida" }, { status: 400 });
  }

  try {
    const result = await backtest(symbol, strategy, params);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Backtest fallito" },
      { status: 502 }
    );
  }
}
