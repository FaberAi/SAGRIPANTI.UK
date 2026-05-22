/**
 * Notifiche via Telegram Bot API.
 *
 * Serve il token di un bot creato con @BotFather, nell'env `TELEGRAM_BOT_TOKEN`.
 * Telegram può scrivere a un utente solo se quell'utente ha già premuto Start
 * sul bot: per questo l'utente collega il proprio `chat ID` dalle impostazioni.
 */

const API = "https://api.telegram.org";

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Invia un messaggio HTML a una chat. Non lancia mai: una notifica fallita
 * non deve interrompere l'esecuzione di un bot o del cron.
 */
export async function sendTelegram(
  chatId: string,
  text: string
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN non configurato" };
  if (!chatId) return { ok: false, error: "Chat ID mancante" };

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Messaggio di notifica per un ordine eseguito da un bot. */
export function formatBotSignal(params: {
  botName: string;
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  reason: string;
}): string {
  const { botName, symbol, action, quantity, price, reason } = params;
  const icon = action === "BUY" ? "🟢" : "🔴";
  const verb = action === "BUY" ? "ACQUISTO" : "VENDITA";
  const fmtPrice = price.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return [
    `${icon} <b>${verb}</b> — ${symbol}`,
    `Bot: <b>${botName}</b>`,
    `${quantity} @ ${fmtPrice}`,
    `<i>${reason}</i>`,
    "",
    "SAGRIPANTI.UK · paper trading",
  ].join("\n");
}
