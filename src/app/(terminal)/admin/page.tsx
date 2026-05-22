"use client";
import { useEffect, useState, useCallback } from "react";

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  isAdmin: boolean;
  active: boolean;
  createdAt: string;
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  for (let i = 0; i < 12; i++) p += chars[(Math.random() * chars.length) | 0];
  return p;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = async () => {
    if (!form.email || !form.password || creating) return;
    setCreating(true);
    setMsg(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({
        text: `Account creato: ${data.email} — password: ${form.password}`,
        ok: true,
      });
      setForm({ email: "", name: "", password: "" });
      await load();
    } else {
      setMsg({ text: data.error ?? "Errore nella creazione", ok: false });
    }
    setCreating(false);
  };

  const toggle = async (id: number, active: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  };

  if (forbidden) {
    return (
      <div style={{ padding: 40, color: "#64748b", textAlign: "center" }}>
        Area riservata agli amministratori.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ color: "#00d4ff", fontSize: 11, letterSpacing: "0.1em", marginBottom: 4 }}>
          ACCESSO SU INVITO
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>GESTIONE ACCOUNT</div>
      </div>

      {/* Crea account */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-header" style={{ margin: "-20px -20px 16px", padding: "10px 20px" }}>
          <span className="dot" />NUOVO CLIENTE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>EMAIL</div>
            <input
              className="input-dark"
              style={{ width: "100%" }}
              placeholder="cliente@esempio.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>NOME</div>
            <input
              className="input-dark"
              style={{ width: "100%" }}
              placeholder="Nome cliente"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>PASSWORD</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="input-dark"
                style={{ width: "100%" }}
                placeholder="min. 8 caratteri"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                className="btn-ghost"
                type="button"
                onClick={() => setForm({ ...form, password: randomPassword() })}
              >
                GENERA
              </button>
            </div>
          </div>
        </div>
        {msg && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: msg.ok ? "#00ff88" : "#ff4466",
            }}
          >
            {msg.text}
          </div>
        )}
        <button className="btn-green" style={{ marginTop: 16 }} onClick={createUser} disabled={creating}>
          {creating ? "CREAZIONE..." : "CREA ACCOUNT"}
        </button>
      </div>

      {/* Elenco account */}
      <div className="card">
        <div className="section-header">
          <span className="dot" />ACCOUNT ({users.length})
        </div>
        {loading ? (
          <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>Caricamento...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>EMAIL</th>
                <th>NOME</th>
                <th>RUOLO</th>
                <th>STATO</th>
                <th>CREATO</th>
                <th>AZIONI</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: "#00d4ff" }}>{u.email}</td>
                  <td style={{ color: "#94a3b8" }}>{u.name ?? "—"}</td>
                  <td>
                    <span className={`badge ${u.isAdmin ? "badge-blue" : "badge-gray"}`}>
                      {u.isAdmin ? "ADMIN" : "CLIENTE"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? "badge-green" : "badge-red"}`}>
                      {u.active ? "ATTIVO" : "SOSPESO"}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: 11 }}>
                    {new Date(u.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td>
                    {u.isAdmin ? (
                      <span style={{ color: "#475569", fontSize: 11 }}>—</span>
                    ) : (
                      <button
                        className="btn-ghost"
                        style={{ padding: "3px 8px" }}
                        onClick={() => toggle(u.id, !u.active)}
                      >
                        {u.active ? "SOSPENDI" : "RIATTIVA"}
                      </button>
                    )}
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
