import MarketTable from "@/components/MarketTable";

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
      }}>
        <div>
          <div style={{ color: "#00d4ff", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>
            GRUPPO SAGRIPANTI — TRADING TERMINAL
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.05em" }}>
            DASHBOARD MERCATI
          </div>
        </div>
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(0,255,136,0.08)",
          border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: 2,
          padding: "6px 12px",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
          <span style={{ color: "#00ff88", fontSize: 11, letterSpacing: "0.08em" }}>LIVE DATA</span>
        </div>
      </div>

      <MarketTable />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <InfoCard label="MODALITÀ" value="PAPER TRADING" sub="Denaro virtuale €100.000" color="#00d4ff" />
        <InfoCard label="DATI" value="YAHOO FINANCE + COINGECKO" sub="Aggiornamento ogni 30s" color="#00ff88" />
        <InfoCard label="BOT" value="3 STRATEGIE" sub="MA Crossover · RSI · MACD" color="#a78bfa" />
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: "0.05em" }}>{value}</div>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
