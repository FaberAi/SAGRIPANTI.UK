import { sma, rsi, macd } from "./indicators";

export type Strategy = "MA_CROSSOVER" | "RSI_REVERSION" | "MACD_SIGNAL" | "CONFLUENCE";

export interface Signal {
  action: "BUY" | "SELL" | "HOLD";
  reason: string;
}

/**
 * Calcola il segnale di una strategia sull'ULTIMO punto di una serie di
 * chiusure. Funzione pura: nessuna chiamata di rete, nessun accesso al DB —
 * la stessa logica serve sia il motore dei bot (`bot-engine`) sia il
 * backtester (`backtest`), che la richiama su finestre storiche crescenti.
 */
export function computeSignal(
  closes: number[],
  strategy: Strategy,
  params: Record<string, number>
): Signal {
  if (closes.length < 30) return { action: "HOLD", reason: "Dati storici insufficienti" };

  if (strategy === "MA_CROSSOVER") {
    const fast = params.fast ?? 20;
    const slow = params.slow ?? 50;
    const fastSma = sma(closes, fast);
    const slowSma = sma(closes, slow);
    const n = closes.length - 1;
    if (isNaN(fastSma[n]) || isNaN(slowSma[n])) return { action: "HOLD", reason: "SMA non calcolabile" };

    const crossAbove = fastSma[n] > slowSma[n] && fastSma[n - 1] <= slowSma[n - 1];
    const crossBelow = fastSma[n] < slowSma[n] && fastSma[n - 1] >= slowSma[n - 1];
    if (crossAbove) return { action: "BUY", reason: `SMA${fast} ha superato SMA${slow}` };
    if (crossBelow) return { action: "SELL", reason: `SMA${fast} è sceso sotto SMA${slow}` };
    return { action: "HOLD", reason: "Nessun crossover" };
  }

  if (strategy === "RSI_REVERSION") {
    const period = params.period ?? 14;
    const oversold = params.oversold ?? 30;
    const overbought = params.overbought ?? 70;
    const rsiValues = rsi(closes, period);
    if (rsiValues.length === 0) return { action: "HOLD", reason: "RSI non calcolabile" };
    const lastRsi = rsiValues[rsiValues.length - 1].value;
    if (lastRsi < oversold) return { action: "BUY", reason: `RSI ${lastRsi.toFixed(1)} < ${oversold} (oversold)` };
    if (lastRsi > overbought) return { action: "SELL", reason: `RSI ${lastRsi.toFixed(1)} > ${overbought} (overbought)` };
    return { action: "HOLD", reason: `RSI neutro: ${lastRsi.toFixed(1)}` };
  }

  if (strategy === "MACD_SIGNAL") {
    const fast = params.fast ?? 12;
    const slow = params.slow ?? 26;
    const signal = params.signal ?? 9;
    const macdValues = macd(closes, fast, slow, signal);
    if (macdValues.length < 2) return { action: "HOLD", reason: "MACD non calcolabile" };
    const last = macdValues[macdValues.length - 1];
    const prev = macdValues[macdValues.length - 2];
    if (last.macd > last.signal && prev.macd <= prev.signal)
      return { action: "BUY", reason: "MACD ha superato la signal line" };
    if (last.macd < last.signal && prev.macd >= prev.signal)
      return { action: "SELL", reason: "MACD è sceso sotto la signal line" };
    return { action: "HOLD", reason: "Nessun incrocio MACD" };
  }

  if (strategy === "CONFLUENCE") {
    const rsiPeriod = params.rsiPeriod ?? 14;
    const fast = params.fast ?? 20;
    const slow = params.slow ?? 50;
    const mFast = params.mFast ?? 12;
    const mSlow = params.mSlow ?? 26;
    const mSignal = params.mSignal ?? 9;

    const rsiValues = rsi(closes, rsiPeriod);
    const fastSma = sma(closes, fast);
    const slowSma = sma(closes, slow);
    const macdValues = macd(closes, mFast, mSlow, mSignal);

    if (rsiValues.length === 0 || fastSma.length === 0 || slowSma.length === 0 || macdValues.length < 2) {
      return { action: "HOLD", reason: "Indicatori insufficienti per la confluenza" };
    }

    const n = closes.length - 1;
    const lastRsi = rsiValues[rsiValues.length - 1].value;
    const isBullishSma = fastSma[n] > slowSma[n];
    const lastMacd = macdValues[macdValues.length - 1];
    const prevMacd = macdValues[macdValues.length - 2];
    const macdCrossUp = lastMacd.macd > lastMacd.signal && prevMacd.macd <= prevMacd.signal;
    const macdCrossDown = lastMacd.macd < lastMacd.signal && prevMacd.macd >= prevMacd.signal;

    // BUY: RSI < 45 (ipervenduto o zona di accumulo) + SMA Bullish + MACD Cross Up
    if (lastRsi < 45 && isBullishSma && macdCrossUp) {
      return { action: "BUY", reason: `Confluenza rialzista: RSI(${lastRsi.toFixed(1)}), SMA Trend UP, MACD CrossUp` };
    }
    // SELL: RSI > 55 (ipercomprato o zona di distribuzione) + SMA Bearish + MACD Cross Down
    if (lastRsi > 55 && !isBullishSma && macdCrossDown) {
      return { action: "SELL", reason: `Confluenza ribassista: RSI(${lastRsi.toFixed(1)}), SMA Trend DOWN, MACD CrossDown` };
    }
    return { action: "HOLD", reason: `Nessuna confluenza valida (RSI: ${lastRsi.toFixed(1)}, Trend: ${isBullishSma ? "UP" : "DOWN"})` };
  }

  return { action: "HOLD", reason: "Strategia sconosciuta" };
}
