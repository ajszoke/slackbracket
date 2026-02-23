import type { Team } from "@slackbracket/domain";

export function teamInitials(teamName: string): string {
  return teamName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]!.toUpperCase())
    .join("");
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
