"use client";
import { useEffect, useState, useCallback } from "react";

interface Me {
  id: number;
  email: string;
  telegramChatId: string | null;
}

// Username del bot Telegram, se configurato: abilita il link diretto t.me.
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

export default function TelegramSettings() {
  const [me, setMe] = useState<Me | null>(null);
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = (await res.json()) as Me;
      setMe(data);
      setChatId(data.telegramChatId ?? "");
    } catch {
      /* errore di rete transitorio */
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const save = async (value: string) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? `Errore ${res.status}` });
      } else if (!value) {
        setMsg({ kind: "ok", text: "Notifiche Telegram disattivate." });
      } else if (data.telegramTest?.sent) {
        setMsg({ kind: "ok", text: "Collegato — controlla Telegram, ti ho mandato un messaggio di prova." });
      } else {
        setMsg({
          kind: "err",
          text: `Salvato, ma l'invio di prova è fallito: ${data.telegramTest?.error ?? "il bot non riesce a scriverti"}. Hai premuto Start sul bot?`,
        });
      }
      await loadMe();
    } catch {
      setMsg({ kind: "err", text: "Errore di rete: riprova." });
    } finally {
      setSaving(false);
    }
  };

  const connected = !!me?.telegramChatId;

  return (
    <div className="card">
      <div className="section-header" style={{ justifyContent: "space-between" }}>
        <span><span className={`dot ${connected ? "dot-green" : ""}`} />NOTIFICHE TELEGRAM</span>
        <span className={`badge ${connected ? "badge-green" : "badge-gray"}`}>
          {connected ? "● COLLEGATO" : "○ NON COLLEGATO"}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
          Quando un bot esegue un <strong style={{ color: "#1ed760" }}>ACQUISTO</strong> o una{" "}
          <strong style={{ color: "#ff4466" }}>VENDITA</strong>, ricevi il segnale su Telegram.
        </div>

        {!connected && (
          <ol style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px", paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              Su Telegram apri <strong style={{ color: "#00d4ff" }}>@userinfobot</strong> e copia il tuo{" "}
              <strong>Id</strong> numerico.
            </li>
            <li>
              Avvia il bot delle notifiche{" "}
              {BOT_USERNAME ? (
                <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#00d4ff" }}>
                  @{BOT_USERNAME}
                </a>
              ) : (
                <span>(chiedi il link all&apos;amministratore)</span>
              )}{" "}
              e premi <strong>Start</strong>: senza questo passaggio il bot non può scriverti.
            </li>
            <li>Incolla qui sotto il tuo Id e premi <strong>Collega</strong>.</li>
          </ol>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input-dark"
            style={{ width: 200 }}
            placeholder="es. 123456789"
            value={chatId}
            inputMode="numeric"
            onChange={(e) => setChatId(e.target.value)}
          />
          <button className="btn-green" disabled={saving || !chatId || chatId === me?.telegramChatId}
            onClick={() => save(chatId)}>
            {saving ? "..." : connected ? "AGGIORNA" : "COLLEGA E INVIA TEST"}
          </button>
          {connected && (
            <button className="btn-ghost" style={{ color: "#ff4466", borderColor: "#ff4466" }}
              disabled={saving}
              onClick={() => { setChatId(""); save(""); }}>
              SCOLLEGA
            </button>
          )}
        </div>

        {msg && (
          <div style={{
            marginTop: 10, fontSize: 12,
            color: msg.kind === "ok" ? "#1ed760" : "#ff4466",
          }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
