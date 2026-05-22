"use client";
import { useEffect, useState } from "react";

interface BacktestTrade {
  time: number;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  reason: string;
  pnl?: number;
}

interface BacktestResult {
  symbol: string;
  strategy: string;
  bars: number;
  startDate: string;
  endDate: string;
  startEquity: number;
  endEquity: number;
  totalReturnPct: number;
  buyHoldReturnPct: number;
  trades: BacktestTrade[];
  tradeCount: number;
  winRate: number | null;
  maxDrawdownPct: number;
  equityCurve: { time: number; value: number }[];
}

/** Configurazione da testare: simbolo, strategia e parametri. */
export interface BacktestConfig {
  label: string;
  symbol: string;
  strategy: string;
  params: Record<string, number>;
}

const STRATEGY_LABEL: Record<string, string> = {
  MA_CROSSOVER: "MA Crossover",
  RSI_REVERSION: "RSI Mean Reversion",
  MACD_SIGNAL: "MACD Signal",
};

const fmtMoney = (n: number) =>
  n.toLocaleString("it-IT", { maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtDate = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });

/** Curva dell'equity disegnata come sparkline SVG. */
function EquityChart({ curve }: { curve: { time: number; value: number }[] }) {
  if (curve.length < 2) return null;
  const W = 560;
  const H = 110;
  const vals = curve.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const x = (i: number) => (i / (curve.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / range) * H;

  const line = curve.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const positive = curve[curve.length - 1].value >= curve[0].value;
  const stroke = positive ? "#1ed760" : "#ff4466";
  const area = `0,${H} ${line} ${W},${H}`;
  const baseY = y(curve[0].value);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ width: "100%", height: 110, display: "block" }}>
      <defs>
        <linearGradient id="bt-eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#bt-eq-fill)" />
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="2"
        vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#0b1220", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px" }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? "#e2e8f0" }}>{value}</div>
    </div>
  );
}

export default function BacktestModal({
  config,
  onClose,
}: {
  config: BacktestConfig | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: config.symbol, strategy: config.strategy, params: config.params }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({ error: "Risposta non valida" }));
        if (cancelled) return;
        if (!res.ok) setError(data.error ?? `Errore ${res.status}`);
        else setResult(data as BacktestResult);
      })
      .catch(() => {
        if (!cancelled) setError("Errore di rete: riprova");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config) return null;

  const beatsBuyHold =
    result !== null && result.totalReturnPct > result.buyHoldReturnPct;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,6,16,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="section-header" style={{ justifyContent: "space-between" }}>
          <span><span className="dot" />BACKTEST · {config.label}</span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>
            ✕
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 14 }}>
            <strong style={{ color: "#00d4ff" }}>{config.symbol}</strong>
            {" · "}{STRATEGY_LABEL[config.strategy] ?? config.strategy}
            {" · "}{Object.entries(config.params).map(([k, v]) => `${k}:${v}`).join(" · ")}
          </div>

          {loading && (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              Simulazione su un anno di storico in corso…
            </div>
          )}

          {error && (
            <div style={{ padding: 16, background: "rgba(255,68,102,0.1)", border: "1px solid rgba(255,68,102,0.3)",
              borderRadius: 8, color: "#ff4466", fontSize: 12 }}>
              {error}
            </div>
          )}

          {result && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                <Stat label="RENDIMENTO STRATEGIA" value={fmtPct(result.totalReturnPct)}
                  color={result.totalReturnPct >= 0 ? "#1ed760" : "#ff4466"} />
                <Stat label="COMPRA & TIENI" value={fmtPct(result.buyHoldReturnPct)}
                  color={result.buyHoldReturnPct >= 0 ? "#1ed760" : "#ff4466"} />
                <Stat label="MAX DRAWDOWN" value={`-${result.maxDrawdownPct.toFixed(2)}%`} color="#ff4466" />
                <Stat label="OPERAZIONI" value={String(result.tradeCount)} />
                <Stat label="WIN RATE"
                  value={result.winRate === null ? "—" : `${result.winRate.toFixed(0)}%`} />
                <Stat label="EQUITY FINALE" value={`$${fmtMoney(result.endEquity)}`} />
              </div>

              <div style={{
                fontSize: 12, marginBottom: 14, padding: "8px 12px", borderRadius: 8,
                background: beatsBuyHold ? "rgba(30,215,96,0.1)" : "rgba(100,116,139,0.12)",
                border: `1px solid ${beatsBuyHold ? "rgba(30,215,96,0.3)" : "rgba(100,116,139,0.25)"}`,
                color: beatsBuyHold ? "#1ed760" : "#94a3b8",
              }}>
                {beatsBuyHold
                  ? `✓ La strategia ha battuto il "compra e tieni" di ${(result.totalReturnPct - result.buyHoldReturnPct).toFixed(2)} punti.`
                  : `La strategia ha reso ${(result.totalReturnPct - result.buyHoldReturnPct).toFixed(2)} punti rispetto al semplice "compra e tieni".`}
              </div>

              <div className="label" style={{ marginBottom: 6 }}>CURVA EQUITY</div>
              <div style={{ background: "#0b1220", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 8px", marginBottom: 14 }}>
                <EquityChart curve={result.equityCurve} />
              </div>

              <div className="label" style={{ marginBottom: 6 }}>
                OPERAZIONI SIMULATE ({result.trades.length})
              </div>
              {result.trades.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  La strategia non ha generato nessun ordine nel periodo.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto" }}>
                  {result.trades.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, alignItems: "baseline" }}>
                      <span style={{ color: "#475569", minWidth: 56 }}>{fmtDate(t.time)}</span>
                      <span style={{ color: t.type === "BUY" ? "#1ed760" : "#ff4466", fontWeight: 700, minWidth: 34 }}>
                        {t.type}
                      </span>
                      <span style={{ color: "#94a3b8", minWidth: 70 }}>
                        {t.quantity} @ {t.price.toFixed(2)}
                      </span>
                      {t.pnl !== undefined && (
                        <span style={{ color: t.pnl >= 0 ? "#1ed760" : "#ff4466", minWidth: 60 }}>
                          {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(0)}
                        </span>
                      )}
                      <span style={{ color: "#64748b" }}>{t.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14, color: "#475569", fontSize: 10, lineHeight: 1.5 }}>
                Periodo {result.startDate} → {result.endDate} · {result.bars} sedute · capitale iniziale ${fmtMoney(result.startEquity)}.
                Simulazione di paper trading su dati storici, commissione 0,1% per ordine.
                I risultati passati non sono una previsione dei rendimenti futuri.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
