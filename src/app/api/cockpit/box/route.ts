import { NextResponse } from "next/server";
import { BOX_URL } from "@/lib/cockpit";

/**
 * Stato live del Box (VPS Hetzner, code-server dietro Cloudflare Tunnel).
 * Nessun segreto: pinga l'URL pubblico e misura raggiungibilità + latenza.
 * Cloudflare risponde 521-523 solo quando il tunnel/origine è giù → "offline".
 * Qualsiasi altra risposta (anche la login di code-server / Access) = raggiungibile.
 */
export const dynamic = "force-dynamic";

/** Status Cloudflare che indicano origine/tunnel irraggiungibile. */
const TUNNEL_DOWN = new Set([521, 522, 523, 524, 502]);

export async function GET() {
  const url = BOX_URL;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 6000);
  const t0 = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual", // una 302 verso Access/login = comunque raggiungibile
      cache: "no-store",
      signal: ctrl.signal,
      headers: { "user-agent": "cockpit-box-probe" },
    });
    const latencyMs = Date.now() - t0;
    const online = !TUNNEL_DOWN.has(res.status);
    return NextResponse.json({
      url,
      online,
      status: res.status,
      latencyMs,
      checkedAt: Date.now(),
    });
  } catch (e) {
    const latencyMs = Date.now() - t0;
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json({
      url,
      online: false,
      status: null,
      latencyMs,
      error: aborted ? "timeout" : "unreachable",
      checkedAt: Date.now(),
    });
  } finally {
    clearTimeout(timeout);
  }
}
