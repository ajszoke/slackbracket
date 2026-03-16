import type { Team } from "./types";

/**
 * Win probability for teamA, centered at chaos=0.5 (pure ELO).
 *
 * Chaos slider semantics:
 *   0.0  = chalk (favorites ALWAYS win — ELO deviation amplified to certainty)
 *   0.5  = true odds (pure ELO probability, no modification)
 *   1.0  = true random (50/50 coinflip)
 *
 * Chalk zone (0→0.5): power curve amplifies base's deviation from 0.5.
 *   At t=0 (max chalk): |deviation|^0 = 1 → prob = 0 or 1 (deterministic).
 *   At t=1 (true odds): |deviation|^1 = |deviation| → prob = base (unmodified).
 *
 * Chaos zone (0.5→1.0): linear blend from base toward 0.5.
 */
export function winProbability(teamA: Team, teamB: Team, chaosValue: number): number {
  const eloDiff = teamA.elo - teamB.elo;
  const base = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const deviation = base - 0.5; // -0.5 to 0.5

  if (chaosValue >= 0.5) {
    // Chaos zone: compress deviation toward 0 (blend to coinflip)
    const t = (chaosValue - 0.5) / 0.5; // 0 at true odds → 1 at coinflip
    return 0.5 + deviation * (1 - t);
  } else {
    // Chalk zone: amplify deviation toward ±0.5 (boost favorites)
    const t = chaosValue / 0.5; // 0 at max chalk → 1 at true odds
    if (t === 0) return base >= 0.5 ? 1.0 : 0.0;
    const absD = Math.abs(deviation);
    // Power curve: absD/0.5 raised to t. At t=1: unchanged. At t→0: approaches 1.0.
    const scaled = absD === 0 ? 0 : Math.sign(deviation) * 0.5 * Math.pow(absD / 0.5, t);
    return 0.5 + scaled;
  }
}

export function pickWinner(teamA: Team, teamB: Team, chaosValue: number, rng = Math.random): Team {
  const pA = winProbability(teamA, teamB, chaosValue);
  return rng() <= pA ? teamA : teamB;
}
