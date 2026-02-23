import type { Team } from "./types";
import { chaosCurve } from "./chaos";

export function winProbability(teamA: Team, teamB: Team, chaosValue: number): number {
  const eloDiff = teamA.elo - teamB.elo;
  const base = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const curvedChaos = chaosCurve(chaosValue);
  return base * (1 - curvedChaos) + 0.5 * curvedChaos;
}

export function pickWinner(teamA: Team, teamB: Team, chaosValue: number, rng = Math.random): Team {
  const pA = winProbability(teamA, teamB, chaosValue);
  return rng() <= pA ? teamA : teamB;
}
