import { ExternalLink } from "lucide-react";
import type { Service } from "@/lib/cockpit";

/**
 * Card launcher per un servizio: nome, deep-link ai progetti, link al pannello.
 * Pura presentazione (server component) — nessun dato sensibile.
 */
export default function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      style={{
        background: "#0d1524",
        border: "1px solid #1e2d40",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <a
        href={service.dashboard}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: service.color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, flex: 1 }}>
          {service.name}
        </span>
        <ExternalLink size={14} color="#64748b" />
      </a>

      <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{service.blurb}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
        {service.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#94a3b8",
              fontSize: 12,
              textDecoration: "none",
              padding: "5px 8px",
              borderRadius: 4,
              borderLeft: "2px solid #1e2d40",
              transition: "background 0.15s",
            }}
          >
            › {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
