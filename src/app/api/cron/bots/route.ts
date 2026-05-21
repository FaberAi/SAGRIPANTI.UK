import { NextRequest, NextResponse } from "next/server";
import { runAllActiveBots } from "@/lib/bot-engine";

export const dynamic = "force-dynamic";
// I bot fanno chiamate esterne (Yahoo / CoinGecko): serve margine di tempo.
export const maxDuration = 60;

/**
 * Endpoint chiamato dal Vercel Cron (vedi vercel.json) per eseguire tutti i
 * bot attivi. Vercel inietta `Authorization: Bearer ${CRON_SECRET}` nelle
 * richieste schedulate: se il secret è configurato, qui lo verifichiamo.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runAllActiveBots();
  return NextResponse.json({
    ranAt: new Date().toISOString(),
    count: results.length,
    results,
  });
}
