"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  type: string;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export default function MarketTable() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/market?action=watchlist");
      const data = await res.json();
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    const id = setInterval(fetchQuotes, 30000);
    return () => clearInterval(id);
  }, [fetchQuotes]);

  const filtered = quotes.filter(
    (q) =>
      q.symbol.toLowerCase().includes(search.toLowerCase()) ||
      q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="dot" />
          MERCATI — LIVE
        </div>
        <input
          className="input-dark"
          placeholder="Cerca simbolo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 160, fontSize: 11 }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>SIMBOLO</th>
              <th>NOME</th>
              <th style={{ textAlign: "right" }}>PREZZO</th>
              <th style={{ textAlign: "right" }}>VARIAZ.</th>
              <th style={{ textAlign: "right" }}>VARIAZ. %</th>
              <th style={{ textAlign: "right" }}>VOLUME</th>
              <th>TIPO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
                Caricamento dati...
              </td></tr>
            ) : filtered.map((q) => {
              const up = q.change >= 0;
              return (
                <tr
                  key={q.symbol}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/chart/${q.symbol}`)}
                >
                  <td style={{ fontWeight: 700, color: "#00d4ff" }}>{q.symbol}</td>
                  <td style={{ color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>${fmt(q.price)}</td>
                  <td style={{ textAlign: "right" }} className={up ? "ticker-up" : "ticker-down"}>
                    {up ? "+" : ""}{fmt(q.change)}
                  </td>
                  <td style={{ textAlign: "right" }} className={up ? "ticker-up" : "ticker-down"}>
                    {up ? "+" : ""}{fmt(q.changePercent)}%
                  </td>
                  <td style={{ textAlign: "right", color: "#64748b" }}>{fmtVol(q.volume)}</td>
                  <td>
                    <span className={`badge ${q.type === "crypto" ? "badge-blue" : "badge-gray"}`}>
                      {q.type}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
