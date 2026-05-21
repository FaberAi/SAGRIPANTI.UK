"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/terminal", label: "DASHBOARD" },
  { href: "/chart/AAPL", label: "GRAFICO" },
  { href: "/portfolio", label: "PORTAFOGLIO" },
  { href: "/bots", label: "BOT" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{
      background: "#0d1524",
      borderBottom: "1px solid #1e2d40",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      gap: 0,
      height: 44,
    }}>
      <Link href="/" style={{
        color: "#00d4ff",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.1em",
        marginRight: 32,
        whiteSpace: "nowrap",
        textDecoration: "none",
      }}>
        ▶ SAGRIPANTI.UK
      </Link>
      {links.map((l) => {
        const segment = l.href.split("/")[1];
        const active = pathname === l.href || pathname.startsWith(`/${segment}`);
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              padding: "0 16px",
              height: 44,
              display: "flex",
              alignItems: "center",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontWeight: 600,
              color: active ? "#00d4ff" : "#64748b",
              borderBottom: active ? "2px solid #00d4ff" : "2px solid transparent",
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        );
      })}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "#374151", fontSize: 11 }}><LiveClock /></span>
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
    </nav>
  );
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("it-IT", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}
