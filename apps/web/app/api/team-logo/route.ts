import { NextResponse } from "next/server";

const cache = new Map<string, string | null>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = url.searchParams.get("team");
  if (!team) {
    return NextResponse.json({ logoUrl: null }, { status: 400 });
  }

  const key = team.toLowerCase();
  if (cache.has(key)) {
    return NextResponse.json({ logoUrl: cache.get(key) ?? null });
  }

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(team)}`,
      { cache: "force-cache" }
    );
    if (!response.ok) {
      cache.set(key, null);
      return NextResponse.json({ logoUrl: null });
    }
    const payload = (await response.json()) as {
      teams?: Array<{ strBadge?: string; strTeamBadge?: string }>;
    };
    const logoUrl = payload.teams?.[0]?.strBadge ?? payload.teams?.[0]?.strTeamBadge ?? null;
    cache.set(key, logoUrl);
    return NextResponse.json({ logoUrl });
  } catch {
    cache.set(key, null);
    return NextResponse.json({ logoUrl: null });
  }
}
