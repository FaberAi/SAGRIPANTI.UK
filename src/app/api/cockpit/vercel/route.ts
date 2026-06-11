import { NextResponse } from "next/server";

/**
 * Stato live Vercel: ultimi deploy con esito.
 * Token read-only in env VERCEL_TOKEN (mai esposto al client).
 * Se manca il token, risponde { configured: false } senza errori.
 */
export const dynamic = "force-dynamic";

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state?: string; // READY | ERROR | BUILDING | QUEUED | CANCELED
  readyState?: string;
  created: number;
}

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return NextResponse.json({ configured: false });

  const teamId = process.env.VERCEL_TEAM_ID;
  const qs = new URLSearchParams({ limit: "12" });
  if (teamId) qs.set("teamId", teamId);

  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: `Vercel ${res.status}` },
        { status: 200 }
      );
    }
    const data = (await res.json()) as { deployments?: VercelDeployment[] };
    const deployments = (data.deployments ?? []).map((d) => ({
      name: d.name,
      url: `https://${d.url}`,
      state: (d.state ?? d.readyState ?? "UNKNOWN").toUpperCase(),
      created: d.created,
    }));
    return NextResponse.json({ configured: true, deployments });
  } catch {
    return NextResponse.json({ configured: true, error: "fetch_failed" });
  }
}
