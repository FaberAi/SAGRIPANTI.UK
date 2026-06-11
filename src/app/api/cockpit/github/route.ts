import { NextResponse } from "next/server";

/**
 * Stato live GitHub: PR aperte che coinvolgono Fabrizio.
 * Token fine-grained read-only in env GITHUB_TOKEN (mai esposto al client).
 * Se manca il token, risponde { configured: false } senza errori.
 */
export const dynamic = "force-dynamic";

interface GitHubIssue {
  title: string;
  html_url: string;
  number: number;
  draft?: boolean;
  repository_url: string;
  updated_at: string;
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ configured: false });

  try {
    const res = await fetch(
      "https://api.github.com/search/issues?q=" +
        encodeURIComponent("is:open is:pr involves:@me archived:false") +
        "&per_page=15&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return NextResponse.json({ configured: true, error: `GitHub ${res.status}` });
    }
    const data = (await res.json()) as { items?: GitHubIssue[] };
    const prs = (data.items ?? []).map((i) => ({
      title: i.title,
      url: i.html_url,
      number: i.number,
      draft: !!i.draft,
      repo: i.repository_url.split("/repos/")[1] ?? "",
      updated: i.updated_at,
    }));
    return NextResponse.json({ configured: true, prs });
  } catch {
    return NextResponse.json({ configured: true, error: "fetch_failed" });
  }
}
