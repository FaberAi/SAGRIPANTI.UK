"use client";
import { useEffect, useState, useCallback } from "react";

interface Position { id: number; symbol: string; quantity: number; avgPrice: number; }
interface Trade { id: number; symbol: string; type: string; quantity: number; price: number; fee: number; total: number; source: string; botName?: string; createdAt: string; }
interface Portfolio { id: number; cash: number; positions: Position[]; trades: Trade[]; }

interface LivePrice { [symbol: string]: number; }

function fmt(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [prices, setPrices] = useState<LivePrice>({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setPortfolio(data);
    setLoading(false);
    // fetch live prices for positions
    if (data.positions?.length) {
      const symbols: string[] = data.positions.map((p: Position) => p.symbol);
      const lp: LivePrice = {};
      await Promise.all(
        symbols.map(async (sym: string) => {
          try {
            const r = await fetch(`/api/market?symbol=${sym}`);
            const q = await r.json();
            lp[sym] = q.price;
          } catch { /* skip */ }
        })
      );
      setPrices(lp);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    const id = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(id);
  }, [fetchPortfolio]);

  const reset = async () => {
    if (!confirm("Resettare il portafoglio a €100.000?")) return;
    setResetting(true);
    await fetch("/api/portfolio", { method: "DELETE" });
    await fetchPortfolio();
    setResetting(false);
  };

  if (loading) return <div style={{ padding: 40, color: "#64748b" }}>Caricamento portafoglio...</div>;
  if (!portfolio) return null;

  const totalPositionValue = portfolio.positions.reduce((sum, p) => {
    const price = prices[p.symbol] ?? p.avgPrice;
    return sum + price * p.quantity;
  }, 0);
  const totalValue = portfolio.cash + totalPositionValue;
  const totalPnL = totalValue - 100000;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#00d4ff", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>PAPER TRADING</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>PORTAFOGLIO</div>
        </div>
        <button className="btn-ghost" onClick={reset} disabled={resetting}>
          {resetting ? "RESET..." : "↺ RESET"}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <SummaryCard label="VALORE TOTALE" value={`€${fmt(totalValue)}`} />
        <SummaryCard label="LIQUIDITÀ" value={`€${fmt(portfolio.cash)}`} sub="disponibile" />
        <SummaryCard label="POSIZIONI" value={`€${fmt(totalPositionValue)}`} sub={`${portfolio.positions.length} asset`} />
        <SummaryCard
          label="P&L TOTALE"
          value={`${totalPnL >= 0 ? "+" : ""}€${fmt(totalPnL)}`}
          valueColor={totalPnL >= 0 ? "#00ff88" : "#ff4466"}
          sub={`${((totalPnL / 100000) * 100).toFixed(2)}%`}
        />
      </div>

      {/* Positions */}
      <div className="card">
        <div className="section-header"><span className="dot" />POSIZIONI APERTE</div>
        {portfolio.positions.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>Nessuna posizione aperta</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SIMBOLO</th>
                <th style={{ textAlign: "right" }}>QUANTITÀ</th>
                <th style={{ textAlign: "right" }}>PREZZO MEDIO</th>
                <th style={{ textAlign: "right" }}>PREZZO LIVE</th>
                <th style={{ textAlign: "right" }}>VALORE</th>
                <th style={{ textAlign: "right" }}>P&L</th>
                <th style={{ textAlign: "right" }}>P&L %</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => {
                const live = prices[p.symbol] ?? p.avgPrice;
                const val = live * p.quantity;
                const pnl = (live - p.avgPrice) * p.quantity;
                const pnlPct = ((live - p.avgPrice) / p.avgPrice) * 100;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: "#00d4ff" }}>{p.symbol}</td>
                    <td style={{ textAlign: "right" }}>{p.quantity.toFixed(4)}</td>
                    <td style={{ textAlign: "right", color: "#64748b" }}>${fmt(p.avgPrice)}</td>
                    <td style={{ textAlign: "right" }}>${fmt(live)}</td>
                    <td style={{ textAlign: "right" }}>${fmt(val)}</td>
                    <td style={{ textAlign: "right" }} className={pnl >= 0 ? "ticker-up" : "ticker-down"}>
                      {pnl >= 0 ? "+" : ""}${fmt(pnl)}
                    </td>
                    <td style={{ textAlign: "right" }} className={pnl >= 0 ? "ticker-up" : "ticker-down"}>
                      {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Trade history */}
      <div className="card">
        <div className="section-header"><span className="dot" />STORICO OPERAZIONI</div>
        {portfolio.trades.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>Nessuna operazione</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>DATA</th>
                <th>SIMBOLO</th>
                <th>TIPO</th>
                <th style={{ textAlign: "right" }}>QUANTITÀ</th>
                <th style={{ textAlign: "right" }}>PREZZO</th>
                <th style={{ textAlign: "right" }}>COMMISSIONE</th>
                <th style={{ textAlign: "right" }}>TOTALE</th>
                <th>FONTE</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.trades.map((t) => (
                <tr key={t.id}>
                  <td style={{ color: "#64748b" }}>{new Date(t.createdAt).toLocaleString("it-IT")}</td>
                  <td style={{ fontWeight: 600, color: "#00d4ff" }}>{t.symbol}</td>
                  <td>
                    <span className={`badge ${t.type === "BUY" ? "badge-green" : "badge-red"}`}>{t.type}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>{t.quantity.toFixed(4)}</td>
                  <td style={{ textAlign: "right" }}>${fmt(t.price)}</td>
                  <td style={{ textAlign: "right", color: "#64748b" }}>${fmt(t.fee)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>${fmt(t.total)}</td>
                  <td>
                    <span className={`badge ${t.source === "bot" ? "badge-blue" : "badge-gray"}`}>
                      {t.source === "bot" ? t.botName ?? "BOT" : "MANUALE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: valueColor ?? "#e2e8f0" }}>{value}</div>
      {sub && <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
