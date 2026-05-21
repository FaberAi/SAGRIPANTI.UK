"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password || loading) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, password }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") ? next : "/terminal";
    } else {
      setError("Credenziali non valide.");
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070b12",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          color: "#5b6b7a",
          textDecoration: "none",
          marginBottom: 38,
        }}
      >
        ← GRUPPO SAGRIPANTI
      </Link>

      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "linear-gradient(160deg,#111a2a,#0b121d)",
          border: "1px solid #1e2d40",
          borderRadius: 8,
          padding: "38px 34px",
        }}
      >
        <div
          className="metal-text"
          style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.06em" }}
        >
          SAGRIPANTI.UK
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "#5b6b7a",
            marginTop: 8,
            marginBottom: 30,
          }}
        >
          TRADING TERMINAL · AREA RISERVATA
        </div>

        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          ID operatore
        </label>
        <input
          type="text"
          autoFocus
          autoComplete="username"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID"
          style={{
            width: "100%",
            background: "#0a0e17",
            border: `1px solid ${error ? "#ff4466" : "#243349"}`,
            borderRadius: 4,
            color: "#e2e8f0",
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            marginBottom: 18,
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Password d&apos;accesso
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          style={{
            width: "100%",
            background: "#0a0e17",
            border: `1px solid ${error ? "#ff4466" : "#243349"}`,
            borderRadius: 4,
            color: "#e2e8f0",
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />

        {error && (
          <div style={{ color: "#ff4466", fontSize: 12, marginTop: 10 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 22,
            background: loading
              ? "#3a4450"
              : "linear-gradient(180deg,#e9edf0,#9aa2a8)",
            color: "#0a0e17",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.12em",
            padding: "13px",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "VERIFICA…" : "ENTRA →"}
        </button>
      </form>

      <div style={{ color: "#33485f", fontSize: 11, marginTop: 26 }}>
        Accesso riservato — Gruppo Sagripanti
      </div>
    </div>
  );
}
