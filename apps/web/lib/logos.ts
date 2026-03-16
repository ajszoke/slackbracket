import type { Team } from "@slackbracket/domain";

export function teamInitials(teamName: string): string {
  return teamName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]!.toUpperCase())
    .join("");
}

/** Short abbreviation for tight spaces (First Four paired display, etc.) */
export function teamAbbrev(teamName: string): string {
  // Common abbreviations
  const abbrevs: Record<string, string> = {
    "Prairie View A&M": "PVAM",
    "NC State": "NCST",
    "Miami (OH)": "M-OH",
    "Miami University (OH)": "M-OH",
    "North Carolina": "UNC",
    "Michigan St.": "MSU",
    "Ohio St.": "OSU",
    "North Dakota St.": "NDSU",
    "Saint Mary's (CA)": "SMC",
    "U Miami (FL)": "MIA",
    "Texas A&M": "TAMU",
    "Iowa St.": "ISU",
    "Utah St.": "USU",
    "Wright St.": "WSU",
    "Kennesaw St.": "KSU",
    "Tennessee St.": "TSU",
    "California Baptist": "CBU",
    "South Florida": "USF",
    "Northern Iowa": "UNI",
    "Saint Louis": "SLU",
    "Texas Tech": "TTU",
    "Santa Clara": "SCU",
    "High Point": "HPU",
  };
  if (abbrevs[teamName]) return abbrevs[teamName];
  // Fallback: first word, max 4 chars
  const first = teamName.split(" ")[0] ?? teamName;
  return first.length <= 4 ? first.toUpperCase() : first.slice(0, 4).toUpperCase();
}

export function deterministicColor(seedInput: string): string {
  let hash = 0;
  for (let i = 0; i < seedInput.length; i++) {
    hash = (hash * 31 + seedInput.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 52%)`;
}

export async function fetchLogoForTeam(team: Team): Promise<string | null> {
  const response = await fetch(`/api/team-logo?team=${encodeURIComponent(team.team)}`, { cache: "force-cache" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { logoUrl: string | null };
  return payload.logoUrl;
}
