import { prisma } from "./prisma";
import { getHistoricalData, getQuote } from "./market";
import { computeSignal, type Strategy, type Signal } from "./strategy";

export type { Strategy } from "./strategy";

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
  return computeSignal(closes, strategy, params);
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

  // il bot opera sul portafoglio del suo proprietario
  let portfolio = await prisma.portfolio.findFirst({ where: { userId: bot.userId } });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({ data: { userId: bot.userId } });
  }

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

    // Cassa, trade e posizione aggiornati in un'unica transazione atomica.
    const existing = await prisma.position.findFirst({
      where: { portfolioId: portfolio.id, symbol: bot.symbol },
    });
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
          data: { symbol: bot.symbol, quantity, avgPrice: price, portfolioId: portfolio.id },
        });
    await prisma.$transaction([
      prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash: { decrement: total } } }),
      prisma.trade.create({
        data: {
          symbol: bot.symbol, type: "BUY", quantity, price, fee, total,
          source: "bot", botName: bot.name, portfolioId: portfolio.id,
        },
      }),
      positionOp,
    ]);
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
  const newQty = position.quantity - quantity;
  const positionOp =
    newQty <= 0.0001
      ? prisma.position.delete({ where: { id: position.id } })
      : prisma.position.update({ where: { id: position.id }, data: { quantity: newQty } });
  await prisma.$transaction([
    prisma.portfolio.update({ where: { id: portfolio.id }, data: { cash: { increment: total } } }),
    prisma.trade.create({
      data: {
        symbol: bot.symbol, type: "SELL", quantity, price, fee, total,
        source: "bot", botName: bot.name, portfolioId: portfolio.id,
      },
    }),
    positionOp,
  ]);
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
