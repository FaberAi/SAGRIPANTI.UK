import { getHistoricalData } from "./market";
import { computeSignal, type Strategy } from "./strategy";

/** Capitale iniziale simulato e commissione, identici al motore dei bot. */
const INITIAL_CASH = 100_000;
const FEE_RATE = 0.001;
/** Servono almeno 30 chiusure perché gli indicatori siano calcolabili. */
const MIN_BARS = 30;

export interface BacktestTrade {
  time: number; // unix seconds
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  reason: string;
  /** Solo per i SELL: utile/perdita realizzato rispetto al prezzo medio di carico. */
  pnl?: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: Strategy;
  bars: number;
  startDate: string;
  endDate: string;
  startEquity: number;
  endEquity: number;
  totalReturnPct: number;
  /** Rendimento di un semplice "compra e tieni" sullo stesso periodo. */
  buyHoldReturnPct: number;
  trades: BacktestTrade[];
  tradeCount: number;
  /** Quota di operazioni chiuse (SELL) in utile, o null se nessuna chiusa. */
  winRate: number | null;
  /** Massima escursione negativa dell'equity dal suo picco, in %. */
  maxDrawdownPct: number;
  /** Curva dell'equity giorno per giorno, per il grafico. */
  equityCurve: { time: number; value: number }[];
}

/**
 * Ripercorre un anno di storico applicando una strategia barra per barra,
 * con le stesse regole del motore live: commissione 0.1%, esecuzione alla
 * chiusura del giorno, guardia anti-spam (non ripete lo stesso ordine finché
 * il segnale non cambia). Restituisce le metriche di performance.
 *
 * È una simulazione su paper trading: serve a confrontare strategie, non è
 * una promessa di rendimento.
 */
export async function backtest(
  symbol: string,
  strategy: Strategy,
  params: Record<string, number>
): Promise<BacktestResult> {
  const data = await getHistoricalData(symbol, "1d", "1y");
  if (data.length < MIN_BARS) {
    throw new Error(
      `Storico insufficiente per ${symbol}: servono almeno ${MIN_BARS} giorni di dati`
    );
  }

  const closes = data.map((d) => d.close);
  const qty = params.quantity && params.quantity > 0 ? params.quantity : 1;

  let cash = INITIAL_CASH;
  let position = 0; // quantità detenuta
  let avgPrice = 0; // prezzo medio di carico della posizione aperta
  let lastSignal: "BUY" | "SELL" | "HOLD" | null = null;

  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; value: number }[] = [];
  let wins = 0;
  let closedTrades = 0;

  for (let i = 0; i < data.length; i++) {
    const price = closes[i];

    if (i + 1 >= MIN_BARS) {
      const sig = computeSignal(closes.slice(0, i + 1), strategy, params);

      // Anti-spam: lo stesso ordine non si ripete finché il segnale non cambia.
      const repeat =
        (sig.action === "BUY" || sig.action === "SELL") && sig.action === lastSignal;

      if (sig.action === "BUY" && !repeat) {
        const fee = price * qty * FEE_RATE;
        const total = price * qty + fee;
        if (cash >= total) {
          cash -= total;
          avgPrice = (avgPrice * position + price * qty) / (position + qty);
          position += qty;
          trades.push({ time: data[i].time, type: "BUY", price, quantity: qty, reason: sig.reason });
          lastSignal = "BUY";
        }
        // Liquidità insufficiente: nessun ordine, lastSignal invariato (come il motore live).
      } else if (sig.action === "SELL" && !repeat) {
        if (position >= qty) {
          const fee = price * qty * FEE_RATE;
          const pnl = (price - avgPrice) * qty - fee;
          cash += price * qty - fee;
          position -= qty;
          if (position <= 0.0001) {
            position = 0;
            avgPrice = 0;
          }
          if (pnl > 0) wins++;
          closedTrades++;
          trades.push({ time: data[i].time, type: "SELL", price, quantity: qty, reason: sig.reason, pnl });
          lastSignal = "SELL";
        }
        // Nessuna posizione da vendere: nessun ordine, lastSignal invariato.
      } else if (sig.action === "HOLD") {
        lastSignal = "HOLD";
      }
    }

    equityCurve.push({ time: data[i].time, value: cash + position * price });
  }

  // Massimo drawdown sull'equity.
  let peak = equityCurve[0]?.value ?? INITIAL_CASH;
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = peak > 0 ? ((peak - point.value) / peak) * 100 : 0;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
  }

  const endEquity = equityCurve[equityCurve.length - 1]?.value ?? INITIAL_CASH;
  const buyHoldReturnPct =
    closes[0] > 0 ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : 0;
  const toISODate = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

  return {
    symbol: symbol.toUpperCase(),
    strategy,
    bars: data.length,
    startDate: toISODate(data[0].time),
    endDate: toISODate(data[data.length - 1].time),
    startEquity: INITIAL_CASH,
    endEquity,
    totalReturnPct: ((endEquity - INITIAL_CASH) / INITIAL_CASH) * 100,
    buyHoldReturnPct,
    trades,
    tradeCount: trades.length,
    winRate: closedTrades > 0 ? (wins / closedTrades) * 100 : null,
    maxDrawdownPct,
    equityCurve,
  };
}
