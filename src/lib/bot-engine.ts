import { prisma } from "./prisma";
import { getHistoricalData, getQuote } from "./market";
import { sma, rsi, macd } from "./indicators";

export type Strategy = "MA_CROSSOVER" | "RSI_REVERSION" | "MACD_SIGNAL";

interface Signal {
  action: "BUY" | "SELL" | "HOLD";
  reason: string;
}

/** Esito di una singola esecuzione di un bot. */
export interface RunResult {
  botId: number;
  botName: string;
  action: "BUY" | "SELL" | "HOLD" | "SKIP" | "ERROR";
  message: string;
}

async function getSignal(
  symbol: string,
  strategy: Strategy,
  params: Record<string, number>
): Promise<Signal> {
  // 1 anno di storico: per le crypto CoinGecko aggrega in candele da ~4
  // giorni, quindi servono range ampi per avere abbastanza punti (>= 30).
  const data = await getHistoricalData(symbol, "1d", "1y");
  const closes = data.map((d) => d.close);

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

  return { action: "HOLD", reason: "Strategia sconosciuta" };
}

/**
 * Esegue un bot: calcola il segnale, applica un guard anti-spam (non ripete
 * la stessa azione operativa finché il segnale non cambia), eventualmente
 * piazza il trade e registra sempre un BotRun nello storico.
 */
export async function runBot(botId: number): Promise<RunResult> {
  const bot = await prisma.botConfig.findUnique({ where: { id: botId } });
  if (!bot) return { botId, botName: "?", action: "ERROR", message: "Bot non trovato" };

  // Persiste un BotRun e aggiorna lo stato del bot, poi restituisce il RunResult.
  const record = async (
    action: RunResult["action"],
    reason: string,
    message: string,
    price?: number,
    quantity?: number
  ): Promise<RunResult> => {
    const tracksSignal = action === "BUY" || action === "SELL" || action === "HOLD";
    await prisma.$transaction([
      prisma.botRun.create({
        data: { botId, action, reason, message, price: price ?? null, quantity: quantity ?? null },
      }),
      prisma.botConfig.update({
        where: { id: botId },
        data: { lastRunAt: new Date(), lastSignal: tracksSignal ? action : bot.lastSignal },
      }),
    ]);
    return { botId, botName: bot.name, action, message };
  };

  // Nota: `active` governa solo l'esecuzione automatica (cron). Una RUN
  // manuale esegue il bot comunque — runAllActiveBots filtra già gli attivi.

  let params: Record<string, number>;
  try {
    params = JSON.parse(bot.params) as Record<string, number>;
  } catch {
    return record("ERROR", "Parametri non validi", "JSON dei parametri illeggibile");
  }

  let signal: Signal;
  try {
    signal = await getSignal(bot.symbol, bot.strategy as Strategy, params);
  } catch (e) {
    return record("ERROR", "Errore strategia", `Impossibile calcolare il segnale: ${(e as Error).message}`);
  }

  // Guard anti-spam: non ripetere lo stesso ordine finché il segnale non cambia.
  if ((signal.action === "BUY" || signal.action === "SELL") && signal.action === bot.lastSignal) {
    return record("SKIP", signal.reason, `Segnale ${signal.action} già agito: attendo un cambio di segnale`);
  }

  if (signal.action === "HOLD") {
    return record("HOLD", signal.reason, signal.reason);
  }

  let portfolio = await prisma.portfolio.findFirst();
  if (!portfolio) portfolio = await prisma.portfolio.create({ data: {} });

  let price: number;
  try {
    price = (await getQuote(bot.symbol)).price;
  } catch (e) {
    return record("ERROR", "Errore prezzo", `Impossibile leggere il prezzo: ${(e as Error).message}`);
  }

  const quantity = params.quantity ?? 1;
  const fee = price * quantity * 0.001;

  if (signal.action === "BUY") {
    const total = price * quantity + fee;
    if (portfolio.cash < total) {
      return record("SKIP", signal.reason, `Liquidità insufficiente per comprare ${quantity} ${bot.symbol}`, price, quantity);
    }

    await prisma.$transaction([
      prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash: { decrement: total } } }),
      prisma.trade.create({
        data: {
          symbol: bot.symbol, type: "BUY", quantity, price, fee, total,
          source: "bot", botName: bot.name, portfolioId: portfolio.id,
        },
      }),
    ]);

    const existing = await prisma.position.findFirst({
      where: { portfolioId: portfolio.id, symbol: bot.symbol },
    });
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / newQty;
      await prisma.position.update({ where: { id: existing.id }, data: { quantity: newQty, avgPrice: newAvg } });
    } else {
      await prisma.position.create({
        data: { symbol: bot.symbol, quantity, avgPrice: price, portfolioId: portfolio.id },
      });
    }
    return record("BUY", signal.reason, `BUY ${quantity} ${bot.symbol} @ ${price.toFixed(2)} — ${signal.reason}`, price, quantity);
  }

  // SELL
  const position = await prisma.position.findFirst({
    where: { portfolioId: portfolio.id, symbol: bot.symbol },
  });
  if (!position || position.quantity < quantity) {
    return record("SKIP", signal.reason, `Nessuna posizione sufficiente da vendere su ${bot.symbol}`, price, quantity);
  }

  const total = price * quantity - fee;
  await prisma.$transaction([
    prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash: { increment: total } } }),
    prisma.trade.create({
      data: {
        symbol: bot.symbol, type: "SELL", quantity, price, fee, total,
        source: "bot", botName: bot.name, portfolioId: portfolio.id,
      },
    }),
  ]);

  const newQty = position.quantity - quantity;
  if (newQty <= 0) {
    await prisma.position.delete({ where: { id: position.id } });
  } else {
    await prisma.position.update({ where: { id: position.id }, data: { quantity: newQty } });
  }
  return record("SELL", signal.reason, `SELL ${quantity} ${bot.symbol} @ ${price.toFixed(2)} — ${signal.reason}`, price, quantity);
}

/** Esegue in sequenza tutti i bot attivi. Usato dal cron. */
export async function runAllActiveBots(): Promise<RunResult[]> {
  const bots = await prisma.botConfig.findMany({ where: { active: true } });
  const results: RunResult[] = [];
  for (const b of bots) {
    try {
      results.push(await runBot(b.id));
    } catch (e) {
      results.push({ botId: b.id, botName: b.name, action: "ERROR", message: String(e) });
    }
  }
  return results;
}
