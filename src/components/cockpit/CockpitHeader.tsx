"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

/** Header del cockpit: brand, orologio live, ritorno al terminale, logout. */
export default function CockpitHeader() {
  const router = useRouter();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("it-IT", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 16px",
        height: 44,
        background: "#0d1524",
        borderBottom: "1px solid #1e2d40",
      }}
    >
      <span
        style={{
          color: "#00d4ff",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Terminal size={15} /> COCKPIT
      </span>
      <Link
        href="/terminal"
        style={{
          color: "#64748b",
          fontSize: 11,
          letterSpacing: "0.08em",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← TERMINALE
      </Link>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "#374151", fontSize: 11 }}>{time}</span>
        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: "1px solid #1e2d40",
            color: "#64748b",
            fontSize: 10,
            letterSpacing: "0.08em",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 2,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ESCI
        </button>
      </div>
    </header>
  );
}
