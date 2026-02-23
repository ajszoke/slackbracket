import type { Matchup } from "./types";

export function lockCompletedGames(
  matchups: Matchup[],
  liveResults: Array<{ matchupId: string; winnerId: string; status: "live" | "final" }>
): Matchup[] {
  const byId = new Map(liveResults.map((r) => [r.matchupId, r]));
  return matchups.map((m) => {
    const result = byId.get(m.id);
    if (!result) return m;
    return {
      ...m,
      status: result.status,
      lockedWinnerId: result.status === "final" ? result.winnerId : m.lockedWinnerId
    };
  });
}

export function isLocked(matchup: Matchup): boolean {
  return matchup.status === "final" && Boolean(matchup.lockedWinnerId);
}
