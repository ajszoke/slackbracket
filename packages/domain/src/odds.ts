import type { Matchup, Team } from "./types";
import { winProbability } from "./simulation";

export type BracketOddsSummary = {
  exactProbability: number;
  oneIn: string;
  exponentApprox: string;
  relativeToMostLikely: number;
  relativeToLeastLikely: number;
};

export function scientificApprox(probability: number): string {
  if (probability <= 0) return "0";
  const exponent = Math.floor(Math.log10(probability));
  const mantissa = probability / Math.pow(10, exponent);
  return `${mantissa.toFixed(2)}e${exponent}`;
}

export function oneIn(probability: number): string {
  if (probability <= 0) return "1 in ∞";
  const inv = Math.round(1 / probability);
  return `1 in ${inv.toLocaleString()}`;
}

export function computeBracketProbability(params: {
  picksByMatchup: Record<string, string>;
  matchups: Matchup[];
  teamsById: Record<string, Team>;
  chaos: number;
}): number {
  const { picksByMatchup, matchups, teamsById, chaos } = params;
  let result = 1;

  for (const matchup of matchups) {
    const picked = picksByMatchup[matchup.id];
    if (!picked || !matchup.teamAId || !matchup.teamBId) {
      continue;
    }
    const teamA = teamsById[matchup.teamAId];
    const teamB = teamsById[matchup.teamBId];
    if (!teamA || !teamB) continue;
    const pA = winProbability(teamA, teamB, chaos);
    const p = picked === teamA.id ? pA : (picked === teamB.id ? 1 - pA : 0);
    result *= Math.max(p, 1e-12);
  }

  return result;
}

export function summarizeOdds(params: {
  picksByMatchup: Record<string, string>;
  matchups: Matchup[];
  teamsById: Record<string, Team>;
  chaos: number;
  mostLikelyProbability: number;
  leastLikelyProbability: number;
}): BracketOddsSummary {
  const exactProbability = computeBracketProbability(params);
  return {
    exactProbability,
    oneIn: oneIn(exactProbability),
    exponentApprox: scientificApprox(exactProbability),
    relativeToMostLikely: params.mostLikelyProbability > 0 ? exactProbability / params.mostLikelyProbability : 0,
    relativeToLeastLikely: params.leastLikelyProbability > 0 ? exactProbability / params.leastLikelyProbability : 0
  };
}
