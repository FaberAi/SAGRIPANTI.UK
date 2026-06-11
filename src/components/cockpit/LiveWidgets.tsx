"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Terminal } from "lucide-react";

/* ----------------------------- stili condivisi ---------------------------- */
const card: React.CSSProperties = {
  background: "#0d1524",
  border: "1px solid #1e2d40",
  borderRadius: 8,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 180,
};
const head: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 12,
  letterSpacing: "0.1em",
  fontWeight: 700,
  color: "#e2e8f0",
};
const muted: React.CSSProperties = { color: "#64748b", fontSize: 12 };
const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: "#cbd5e1",
  textDecoration: "none",
  padding: "5px 0",
  borderBottom: "1px solid #131c2e",
};

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}

function Shell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <div style={head}>
        <span>{title}</span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#64748b", display: "flex" }}
          aria-label={`Apri ${title}`}
        >
          <ExternalLink size={14} />
        </a>
      </div>
      {children}
    </div>
  );
}

function NotConfigured({ env }: { env: string }) {
  return (
    <p style={muted}>
      Widget live spento. Aggiungi <code style={{ color: "#00d4ff" }}>{env}</code> alle
      env var del progetto su Vercel per accenderlo.
    </p>
  );
}

const timeAgo = (iso: string | number) => {
  const t = typeof iso === "number" ? iso : Date.parse(iso);
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s fa`;
  if (s < 3600) return `${Math.floor(s / 60)}m fa`;
  if (s < 86400) return `${Math.floor(s / 3600)}h fa`;
  return `${Math.floor(s / 86400)}g fa`;
};

/* -------------------------------- Vercel ---------------------------------- */
const VERCEL_COLORS: Record<string, string> = {
  READY: "#22c55e",
  ERROR: "#ef4444",
  BUILDING: "#eab308",
  QUEUED: "#eab308",
  CANCELED: "#64748b",
  UNKNOWN: "#64748b",
};

interface VercelDeploy {
  name: string;
  url: string;
  state: string;
  created: number;
}

export function VercelWidget() {
  const [data, setData] = useState<{
    configured?: boolean;
    deployments?: VercelDeploy[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      fetch("/api/cockpit/vercel")
        .then((r) => r.json())
        .then((d) => on && setData(d))
        .catch(() => on && setData({ configured: true, error: "fetch_failed" }));
    load();
    const id = setInterval(load, 60_000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Shell title="VERCEL · DEPLOY" href="https://vercel.com/dashboard">
      {!data && <p style={muted}>Carico…</p>}
      {data?.configured === false && <NotConfigured env="VERCEL_TOKEN" />}
      {data?.error && <p style={{ ...muted, color: "#ef4444" }}>Errore: {data.error}</p>}
      {data?.deployments?.slice(0, 7).map((d, i) => (
        <a key={i} href={d.url} target="_blank" rel="noreferrer" style={row}>
          <Dot color={VERCEL_COLORS[d.state] ?? "#64748b"} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.name}
          </span>
          <span style={{ ...muted, fontSize: 11 }}>{timeAgo(d.created)}</span>
        </a>
      ))}
      {data?.deployments?.length === 0 && <p style={muted}>Nessun deploy recente.</p>}
    </Shell>
  );
}

/* -------------------------------- GitHub ---------------------------------- */
interface GitHubPR {
  title: string;
  url: string;
  number: number;
  draft: boolean;
  repo: string;
  updated: string;
}

export function GitHubWidget() {
  const [data, setData] = useState<{
    configured?: boolean;
    prs?: GitHubPR[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      fetch("/api/cockpit/github")
        .then((r) => r.json())
        .then((d) => on && setData(d))
        .catch(() => on && setData({ configured: true, error: "fetch_failed" }));
    load();
    const id = setInterval(load, 120_000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Shell title="GITHUB · PR APERTE" href="https://github.com/pulls">
      {!data && <p style={muted}>Carico…</p>}
      {data?.configured === false && <NotConfigured env="GITHUB_TOKEN" />}
      {data?.error && <p style={{ ...muted, color: "#ef4444" }}>Errore: {data.error}</p>}
      {data?.prs?.slice(0, 7).map((pr) => (
        <a key={pr.url} href={pr.url} target="_blank" rel="noreferrer" style={row}>
          <Dot color={pr.draft ? "#64748b" : "#22c55e"} />
          <span style={{ flex: 1, overflow: "hidden" }}>
            <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pr.title}
            </span>
            <span style={{ ...muted, fontSize: 11 }}>
              {pr.repo} · #{pr.number}
            </span>
          </span>
          <span style={{ ...muted, fontSize: 11 }}>{timeAgo(pr.updated)}</span>
        </a>
      ))}
      {data?.prs?.length === 0 && <p style={muted}>Nessuna PR aperta. 🎉</p>}
    </Shell>
  );
}

/* ---------------------------------- Box ----------------------------------- */
interface BoxStatus {
  online?: boolean;
  status?: number | null;
  latencyMs?: number;
  url?: string;
  error?: string;
}

export function BoxWidget() {
  const [data, setData] = useState<BoxStatus | null>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      fetch("/api/cockpit/box")
        .then((r) => r.json())
        .then((d) => on && setData(d))
        .catch(() => on && setData({ online: false, error: "fetch_failed" }));
    load();
    const id = setInterval(load, 30_000);
    return () => {
      on = false;
      clearInterval(id);
    };
  }, []);

  const url = data?.url || "https://box.sagripanti.uk";
  const loading = !data;
  const online = data?.online;
  const dotColor = loading ? "#64748b" : online ? "#22c55e" : "#ef4444";
  const pill = loading
    ? "verifico…"
    : online
      ? `ONLINE${data?.latencyMs ? ` · ${data.latencyMs}ms` : ""}`
      : data?.error === "timeout"
        ? "TIMEOUT"
        : "OFFLINE";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "linear-gradient(90deg, #0d1c2e, #0d1524)",
        border: `1px solid ${online === false ? "#ef444455" : "#00d4ff44"}`,
        borderRadius: 10,
        padding: "18px 20px",
        textDecoration: "none",
        marginBottom: 32,
        transition: "border-color .3s",
      }}
    >
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: "#00d4ff18",
          border: "1px solid #00d4ff55",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Terminal size={20} color="#00d4ff" />
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>
          Apri il terminale
        </span>
        <span
          style={{
            color: "#64748b",
            fontSize: 12,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          code-server con Claude Code + Gemini — {url.replace("https://", "")}
        </span>
      </span>

      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: dotColor,
          background: `${dotColor}14`,
          border: `1px solid ${dotColor}44`,
          borderRadius: 999,
          padding: "5px 10px",
          flexShrink: 0,
        }}
      >
        <Dot color={dotColor} />
        {pill}
      </span>

      <span style={{ color: "#00d4ff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>↗</span>
    </a>
  );
}
