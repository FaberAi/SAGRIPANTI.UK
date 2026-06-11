import type { Metadata, Viewport } from "next";
import CockpitHeader from "@/components/cockpit/CockpitHeader";
import ServiceCard from "@/components/cockpit/ServiceCard";
import { VercelWidget, GitHubWidget, BoxWidget } from "@/components/cockpit/LiveWidgets";
import { SERVICES } from "@/lib/cockpit";

export const metadata: Metadata = { title: "Cockpit · SAGRIPANTI.UK" };
export const viewport: Viewport = { themeColor: "#0a0e17" };

const sectionLabel: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  letterSpacing: "0.14em",
  fontWeight: 700,
  margin: "0 0 12px",
};

export default function CockpitPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0a0e17" }}>
      <CockpitHeader />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 64px" }}>
        {/* Box / terminale web — stato LIVE */}
        <BoxWidget />

        {/* Widget live */}
        <p style={sectionLabel}>STATO LIVE</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <VercelWidget />
          <GitHubWidget />
        </div>

        {/* Launcher servizi */}
        <p style={sectionLabel}>SERVIZI</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </main>
    </div>
  );
}
