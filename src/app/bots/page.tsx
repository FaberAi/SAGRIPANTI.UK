"use client";
import { useEffect, useState, useCallback } from "react";

interface Bot {
  id: number;
  name: string;
  symbol: string;
  strategy: string;
  params: string;
  active: boolean;
  createdAt: string;
}

const STRATEGIES = [
  { value: "MA_CROSSOVER", label: "MA Crossover", desc: "Compra quando SMA veloce supera SMA lenta" },
  { value: "RSI_REVERSION", label: "RSI Mean Reversion", desc: "Compra su RSI < 30, vende su RSI > 70" },
  { value: "MACD_SIGNAL", label: "MACD Signal", desc: "Segue gli incroci della MACD Signal Line" },
];

const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
  MA_CROSSOVER: { fast: 20, slow: 50, quantity: 1 },
  RSI_REVERSION: { period: 14, oversold: 30, overbought: 70, quantity: 1 },
  MACD_SIGNAL: { fast: 12, slow: 26, signal: 9, quantity: 1 },
};

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    strategy: "MA_CROSSOVER",
    params: DEFAULT_PARAMS["MA_CROSSOVER"],
  });
  const [running, setRunning] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, string>>({});

  const fetchBots = useCallback(async () => {
    const res = await fetch("/api/bot");
    setBots(await res.json());
  }, []);

  useEffect(() => { fetchBots(); }, [fetchBots]);

  const createBot = async () => {
    if (!form.name || !form.symbol) return;
    await fetch("/api/bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: "", symbol: "", strategy: "MA_CROSSOVER", params: DEFAULT_PARAMS["MA_CROSSOVER"] });
    await fetchBots();
  };

  const toggleBot = async (id: number, active: boolean) => {
    await fetch("/api/bot", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await fetchBots();
  };

  const deleteBot = async (id: number) => {
    if (!confirm("Eliminare questo bot?")) return;
    await fetch(`/api/bot?id=${id}`, { method: "DELETE" });
    await fetchBots();
  };

  const runNow = async (id: number) => {
    setRunning(id);
    const res = await fetch("/api/bot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setResults((prev) => ({ ...prev, [id]: data.result }));
    setRunning(null);
    await fetchBots();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#00d4ff", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>AUTOMAZIONE</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>BOT DI TRADING</div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ ANNULLA" : "+ NUOVO BOT"}
        </button>
      </div>

      {/* New bot form */}
      {showForm && (
        <div className="card" style={{ padding: 20 }}>
          <div className="section-header" style={{ margin: "-20px -20px 16px", padding: "10px 20px" }}>
            <span className="dot" />CONFIGURA BOT
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>NOME BOT</div>
              <input className="input-dark" style={{ width: "100%" }} placeholder="es. BTC RSI Bot"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>SIMBOLO</div>
              <input className="input-dark" style={{ width: "100%" }} placeholder="es. AAPL, BTC, ETH"
                value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="label" style={{ marginBottom: 6 }}>STRATEGIA</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STRATEGIES.map((s) => (
                <button key={s.value}
                  onClick={() => setForm({ ...form, strategy: s.value, params: DEFAULT_PARAMS[s.value] })}
                  className={form.strategy === s.value ? "btn-primary" : "btn-ghost"}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 6 }}>
              {STRATEGIES.find((s) => s.value === form.strategy)?.desc}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="label" style={{ marginBottom: 6 }}>PARAMETRI</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(form.params).map(([key, val]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div className="label">{key.toUpperCase()}</div>
                  <input className="input-dark" type="number" style={{ width: 80 }}
                    value={val}
                    onChange={(e) => setForm({
                      ...form,
                      params: { ...form.params, [key]: parseFloat(e.target.value) || 0 },
                    })} />
                </div>
              ))}
            </div>
          </div>

          <button className="btn-green" style={{ marginTop: 16 }} onClick={createBot}>
            CREA BOT
          </button>
        </div>
      )}

      {/* Strategies info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {STRATEGIES.map((s) => (
          <div key={s.value} className="card" style={{ padding: 14 }}>
            <div style={{ color: "#00d4ff", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Bots list */}
      <div className="card">
        <div className="section-header"><span className="dot" />BOT CONFIGURATI ({bots.length})</div>
        {bots.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
            Nessun bot configurato. Crea il tuo primo bot!
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>NOME</th>
                <th>SIMBOLO</th>
                <th>STRATEGIA</th>
                <th>PARAMETRI</th>
                <th>STATO</th>
                <th>ULTIMO RISULTATO</th>
                <th>AZIONI</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => {
                const params = JSON.parse(bot.params) as Record<string, number>;
                return (
                  <tr key={bot.id}>
                    <td style={{ fontWeight: 600 }}>{bot.name}</td>
                    <td style={{ color: "#00d4ff", fontWeight: 700 }}>{bot.symbol}</td>
                    <td>
                      <span className="badge badge-blue">
                        {STRATEGIES.find((s) => s.value === bot.strategy)?.label ?? bot.strategy}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 11 }}>
                      {Object.entries(params).map(([k, v]) => `${k}:${v}`).join(" · ")}
                    </td>
                    <td>
                      <span className={`badge ${bot.active ? "badge-green" : "badge-gray"}`}>
                        {bot.active ? "● ATTIVO" : "○ INATTIVO"}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: 11, maxWidth: 200 }}>
                      {results[bot.id] ?? "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-ghost" style={{ padding: "3px 8px" }}
                          onClick={() => toggleBot(bot.id, !bot.active)}>
                          {bot.active ? "STOP" : "START"}
                        </button>
                        <button className="btn-ghost" style={{ padding: "3px 8px", color: "#00d4ff", borderColor: "#00d4ff" }}
                          onClick={() => runNow(bot.id)} disabled={running === bot.id}>
                          {running === bot.id ? "..." : "RUN"}
                        </button>
                        <button className="btn-ghost" style={{ padding: "3px 8px", color: "#ff4466", borderColor: "#ff4466" }}
                          onClick={() => deleteBot(bot.id)}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
