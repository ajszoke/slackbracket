import { NextResponse } from "next/server";

const cache = new Map<string, string | null>();

/** Normalize bracket team names to TheSportsDB search terms */
/** Map bracket names → TheSportsDB search terms that return basketball results with badges */
const NAME_MAP: Record<string, string> = {
  "U Miami (FL)": "Miami",
  "Miami (OH)": "Miami OH",
  "Miami University (OH)": "Miami OH",
  "Ohio St.": "Ohio State Buckeyes",
  "Michigan St.": "Michigan State",
  "North Dakota St.": "North Dakota State",
  "Wright St.": "Wright State",
  "Kennesaw St.": "Kennesaw State",
  "Tennessee St.": "Tennessee State",
  "Utah St.": "Utah State",
  "Iowa St.": "Iowa State",
  "Texas A&M": "Texas A and M",
  "St. John's": "St. Johns",
  "Saint Mary's (CA)": "Saint Marys",
  "South Florida": "South Florida",
  "Northern Iowa": "Northern Iowa",
  "Prairie View A&M": "Prairie View A and M",
  "NC State": "NC State",
  "LIU": "LIU Sharks",
};

function normalizeForSearch(name: string): string {
  if (NAME_MAP[name]) return NAME_MAP[name];
  // Strip trailing periods, parenthetical disambiguators
  return name.replace(/\.$/, "").replace(/\s*\(.*\)/, "");
}

type SportsDBTeam = {
  strTeam?: string;
  strSport?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLeague?: string;
};

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

  const searchName = normalizeForSearch(team);

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(searchName)}`,
      { cache: "force-cache" }
    );
    if (!response.ok) {
      cache.set(key, null);
      return NextResponse.json({ logoUrl: null });
    }
    const payload = (await response.json()) as { teams?: SportsDBTeam[] };
    // Prefer basketball teams; fall back to first result
    const teams = payload.teams ?? [];
    const basketballTeam = teams.find(
      (t) => t.strSport === "Basketball" || t.strLeague?.toLowerCase().includes("ncaa")
    );
    const best = basketballTeam ?? teams[0];
    const logoUrl = best?.strBadge ?? best?.strTeamBadge ?? null;
    cache.set(key, logoUrl);
    return NextResponse.json({ logoUrl });
  } catch {
    cache.set(key, null);
    return NextResponse.json({ logoUrl: null });
  }
}
