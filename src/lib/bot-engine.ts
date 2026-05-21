import { prisma } from "./prisma";
import { getHistoricalData } from "./market";
import { sma, ema, rsi, macd } from "./indicators";

export type Strategy = "MA_CROSSOVER" | "RSI_REVERSION" | "MACD_SIGNAL";

interface Signal {
  action: "BUY" | "SELL" | "HOLD";
  reason: string;
}

async function getSignal(
  symbol: string,
  strategy: Strategy,
  params: Record<string, number>
): Promise<Signal> {
  const data = await getHistoricalData(symbol, "1d", "3mo");
  const closes = data.map((d) => d.close);

  if (closes.length < 30) return { action: "HOLD", reason: "Dati insufficienti" };

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

export async function runBot(botId: number): Promise<string> {
  const bot = await prisma.botConfig.findUnique({ where: { id: botId } });
  if (!bot || !bot.active) return "Bot non attivo";

  const portfolio = await prisma.portfolio.findFirst();
  if (!portfolio) return "Portafoglio non trovato";

  const params = JSON.parse(bot.params) as Record<string, number>;
  const signal = await getSignal(bot.symbol, bot.strategy as Strategy, params);

  if (signal.action === "HOLD") return `HOLD: ${signal.reason}`;

  // get current price
  const { getQuote } = await import("./market");
  const quote = await getQuote(bot.symbol);
  const price = quote.price;
  const quantity = params.quantity ?? 1;
  const fee = price * quantity * 0.001;

  if (signal.action === "BUY") {
    const total = price * quantity + fee;
    if (portfolio.cash < total) return "Liquidità insufficiente";
    await prisma.$transaction([
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { cash: { decrement: total } },
      }),
      prisma.trade.create({
        data: {
          symbol: bot.symbol,
          type: "BUY",
          quantity,
          price,
          fee,
          total,
          source: "bot",
          botName: bot.name,
          portfolioId: portfolio.id,
        },
      }),
    ]);
    const existing = await prisma.position.findFirst({
      where: { portfolioId: portfolio.id, symbol: bot.symbol },
    });
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = (existing.avgPrice * existing.quantity + price * quantity) / newQty;
      await prisma.position.update({
        where: { id: existing.id },
        data: { quantity: newQty, avgPrice: newAvg },
      });
    } else {
      await prisma.position.create({
        data: { symbol: bot.symbol, quantity, avgPrice: price, portfolioId: portfolio.id },
      });
    }
    return `BUY ${quantity} ${bot.symbol} @ ${price}: ${signal.reason}`;
  }

  if (signal.action === "SELL") {
    const position = await prisma.position.findFirst({
      where: { portfolioId: portfolio.id, symbol: bot.symbol },
    });
    if (!position || position.quantity < quantity) return "Posizione insufficiente da vendere";
    const total = price * quantity - fee;
    await prisma.$transaction([
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { cash: { increment: total } },
      }),
      prisma.trade.create({
        data: {
          symbol: bot.symbol,
          type: "SELL",
          quantity,
          price,
          fee,
          total,
          source: "bot",
          botName: bot.name,
          portfolioId: portfolio.id,
        },
      }),
    ]);
    const newQty = position.quantity - quantity;
    if (newQty <= 0) {
      await prisma.position.delete({ where: { id: position.id } });
    } else {
      await prisma.position.update({ where: { id: position.id }, data: { quantity: newQty } });
    }
    return `SELL ${quantity} ${bot.symbol} @ ${price}: ${signal.reason}`;
  }

  return "HOLD";
}
