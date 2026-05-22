"use client";
import { useState } from "react";

interface Props {
  symbol: string;
  currentPrice?: number;
}

export default function TradePanel({ symbol, currentPrice }: Props) {
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const qty = parseFloat(quantity) || 0;
  const fee = currentPrice ? currentPrice * qty * 0.001 : 0;
  const total = currentPrice ? currentPrice * qty + (type === "BUY" ? fee : -fee) : 0;

  const handleTrade = async () => {
    if (!qty) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, type, quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `✓ ${type} ${qty} ${symbol} @ $${data.price?.toFixed(2)} eseguito`, ok: true });
      } else {
        setMessage({ text: `✗ ${data.error ?? "Operazione non riuscita"}`, ok: false });
      }
    } catch {
      setMessage({ text: "Errore di connessione", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="section-header" style={{ margin: "-16px -16px 16px", padding: "10px 16px" }}>
        <span className="dot" />
        ORDINE — {symbol}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={type === "BUY" ? "btn-green" : "btn-ghost"}
          style={{ flex: 1 }}
          onClick={() => setType("BUY")}
        >
          COMPRA
        </button>
        <button
          className={type === "SELL" ? "btn-red" : "btn-ghost"}
          style={{ flex: 1 }}
          onClick={() => setType("SELL")}
        >
          VENDI
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>QUANTITÀ</div>
          <input
            className="input-dark"
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 4 }}>PREZZO ATTUALE</div>
          <div style={{ padding: "6px 10px", background: "#0a0e17", border: "1px solid #1e2d40", borderRadius: 2, fontSize: 13 }}>
            ${currentPrice?.toFixed(2) ?? "—"}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "10px 14px", marginBottom: 12, background: "#0a0e17" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b", fontSize: 12 }}>
          <span>Controvalore</span>
          <span>${(currentPrice ? currentPrice * qty : 0).toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b", fontSize: 12 }}>
          <span>Commissione (0.1%)</span>
          <span>${fee.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1e2d40", paddingTop: 6, marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>TOTALE</span>
          <span style={{ fontWeight: 700, color: type === "BUY" ? "#ff4466" : "#00ff88" }}>${total.toFixed(2)}</span>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "8px 12px",
          marginBottom: 12,
          borderRadius: 2,
          background: message.ok ? "rgba(0,255,136,0.08)" : "rgba(255,68,102,0.08)",
          border: `1px solid ${message.ok ? "rgba(0,255,136,0.2)" : "rgba(255,68,102,0.2)"}`,
          color: message.ok ? "#00ff88" : "#ff4466",
          fontSize: 12,
        }}>
          {message.text}
        </div>
      )}

      <button
        className={type === "BUY" ? "btn-green" : "btn-red"}
        style={{ width: "100%", padding: "10px", fontSize: 13 }}
        onClick={handleTrade}
        disabled={loading || !qty}
      >
        {loading ? "ESECUZIONE..." : `CONFERMA ${type === "BUY" ? "ACQUISTO" : "VENDITA"}`}
      </button>
    </div>
  );
}
