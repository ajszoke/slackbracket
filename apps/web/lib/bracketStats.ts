import type { Team } from "@slackbracket/domain";
import { winProbability } from "@slackbracket/domain";

import type { GameNode } from "./tournament";
import { resolveTeamForSource } from "./tournament";

// --- Standardized ELO Surprisal (drives the Bracket Pulse atmosphere) ---
//
// Per-round weighted surprisal: each round contributes equally regardless of game count.
// R1 has 32 games, R6 has 1 — but a championship upset matters as much as ALL of R1.
// Weight per game: w_g = 1 / (K * n_r), where K = rounds with picks, n_r = picks in that round.
//
// Two score types — never conflate:
//   surprisePercentile (centered at 0.5) → labels, hue, semantic meaning
//   orbHeat (one-sided, 0 = calm)        → pulse speed, opacity, glow intensity

export type PulseMetrics = {
  userChaos: number; // orbHeat — one-sided intensity (pulse speed, opacity)
  aiChaos: number;
  overallChaos: number;
  userPercentile: number; // centered at 0.5 — for labels + hue
  aiPercentile: number;
  overallPercentile: number;
  userZScore: number; // for confidence exception in labels
  aiZScore: number;
  userPickCount: number; // for confidence calculation
  aiPickCount: number;
  harmony: number; // 0–1 (1 = agree, 0 = max clash)
  pulseSpeed: number; // seconds (8 = calm, 2 = intense)
  pulseLo: number; // opacity lower bound (keyframe)
  pulseHi: number; // opacity upper bound (keyframe)
  userWeight: number; // 0–1 proportion of picks that are user
  aiWeight: number; // 0–1 proportion of picks that are AI
};

type PickedGamePair = { picked: Team; opponent: Team; round: number };

type SurpriseMetrics = {
  totalBits: number; // raw sum of -log2(p) — for future data viz
  expectedBits: number; // raw sum of Shannon entropy — for future data viz
  sdBits: number; // SD of round-weighted statistic
  zScore: number; // round-weighted z-score
  surprisePercentile: number; // normalCdf(zScore), centered at 0.5
  orbHeat: number; // max(0, 2*percentile - 1), one-sided intensity
  pickCount: number;
};

// Abramowitz & Stegun approximation, |error| < 1.5e-7
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function computeSurpriseMetrics(pairs: PickedGamePair[]): SurpriseMetrics {
  if (pairs.length === 0) {
    return { totalBits: 0, expectedBits: 0, sdBits: 0, zScore: 0, surprisePercentile: 0.5, orbHeat: 0, pickCount: 0 };
  }

  // Count picks per round for round-equal weights: w_g = 1 / (K * n_r)
  const roundCounts = new Map<number, number>();
  for (const pair of pairs) roundCounts.set(pair.round, (roundCounts.get(pair.round) ?? 0) + 1);
  const K = roundCounts.size;

  let T = 0;
  let ET = 0;
  let VarT = 0;
  let rawTotalBits = 0;
  let rawExpectedBits = 0;

  for (const { picked, opponent, round } of pairs) {
    const rawP = winProbability(picked, opponent, 0.5); // pure ELO baseline
    const p = Math.min(Math.max(rawP, 1e-12), 1 - 1e-12);

    const winnerBits = -Math.log2(p);
    const loserBits = -Math.log2(1 - p);
    const mu = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); // Shannon entropy
    const varG = p * (winnerBits - mu) ** 2 + (1 - p) * (loserBits - mu) ** 2;

    const n_r = roundCounts.get(round)!;
    const w = 1 / (K * n_r);

    T += w * winnerBits;
    ET += w * mu;
    VarT += w * w * varG;
    rawTotalBits += winnerBits;
    rawExpectedBits += mu;
  }

  const sdBits = Math.sqrt(Math.max(VarT, 1e-12));
  const zScore = (T - ET) / sdBits;
  const surprisePercentile = normalCdf(zScore);
  const orbHeat = Math.max(0, 2 * surprisePercentile - 1);

  return {
    totalBits: rawTotalBits,
    expectedBits: rawExpectedBits,
    sdBits,
    zScore,
    surprisePercentile,
    orbHeat,
    pickCount: pairs.length,
  };
}

export function computePulseMetrics(
  picksByMatchup: Record<string, string>,
  pickSourceByMatchup: Record<string, "user" | "auto">,
  games: GameNode[],
  teamsById: Record<string, Team>
): PulseMetrics {
  const userPairs: PickedGamePair[] = [];
  const aiPairs: PickedGamePair[] = [];
  let userTotal = 0;
  let aiTotal = 0;

  for (const game of games) {
    const pick = picksByMatchup[game.id];
    if (!pick) continue;

    const source = pickSourceByMatchup[game.id] ?? "user";
    const teamA = resolveTeamForSource(game.sourceA, picksByMatchup, teamsById);
    const teamB = resolveTeamForSource(game.sourceB, picksByMatchup, teamsById);
    if (!teamA || !teamB) continue;

    const picked = pick === teamA.id ? teamA : teamB;
    const opponent = pick === teamA.id ? teamB : teamA;

    if (source === "user") {
      userTotal++;
      userPairs.push({ picked, opponent, round: game.round });
    } else {
      aiTotal++;
      aiPairs.push({ picked, opponent, round: game.round });
    }
  }

  const userSurprise = computeSurpriseMetrics(userPairs);
  const aiSurprise = computeSurpriseMetrics(aiPairs);
  const overallSurprise = computeSurpriseMetrics([...userPairs, ...aiPairs]);

  const userChaos = userSurprise.orbHeat;
  const aiChaos = aiSurprise.orbHeat;
  const overallChaos = overallSurprise.orbHeat;
  const totalPicked = userTotal + aiTotal;
  const harmony = 1 - Math.abs(userSurprise.surprisePercentile - aiSurprise.surprisePercentile);

  const pulseSpeed = 8 - overallChaos * 6; // 8s → 2s
  const pulseLo = totalPicked === 0 ? 0.1 : 0.1 + overallChaos * 0.25; // 0.10–0.35
  const pulseHi = totalPicked === 0 ? 0.14 : 0.18 + overallChaos * 0.47; // 0.18–0.65

  const userWeight = totalPicked > 0 ? userTotal / totalPicked : 0;
  const aiWeight = totalPicked > 0 ? aiTotal / totalPicked : 0;

  return {
    userChaos,
    aiChaos,
    overallChaos,
    userPercentile: userSurprise.surprisePercentile,
    aiPercentile: aiSurprise.surprisePercentile,
    overallPercentile: overallSurprise.surprisePercentile,
    userZScore: userSurprise.zScore,
    aiZScore: aiSurprise.zScore,
    userPickCount: userTotal,
    aiPickCount: aiTotal,
    harmony,
    pulseSpeed,
    pulseLo,
    pulseHi,
    userWeight,
    aiWeight,
  };
}

// --- Bracket Temperature Labels ---
//
// Confidence-gated: low sample size → tentative labels, high → full range.
// Driven by centered surprisePercentile (0.5 = neutral), NOT one-sided orbHeat.
// |zScore| > 3 bumps confidence tier up (extreme upsets are legit even with few picks).

const TOTAL_GAMES = 63;

export function chaosToTemperatureLabel(percentile: number, pickCount: number, zScore: number): string {
  const confidence = pickCount / TOTAL_GAMES;
  let tier: "low" | "mid" | "high" =
    confidence < 0.15 ? "low" : confidence < 0.6 ? "mid" : "high";

  // Extreme z-score exception: bump up one tier
  if (Math.abs(zScore) > 3) {
    if (tier === "low") tier = "mid";
    else if (tier === "mid") tier = "high";
  }

  if (tier === "low") {
    if (percentile < 0.2) return "Early Chalk...";
    if (percentile < 0.4) return "Leaning Safe...";
    if (percentile < 0.6) return "Feeling It Out...";
    if (percentile < 0.8) return "A Lil' Spicy?";
    return "Going Rogue?";
  }

  if (tier === "mid") {
    if (percentile < 0.1) return "Playing It Safe!";
    if (percentile < 0.22) return "Chalk-ish!";
    if (percentile < 0.38) return "By the Book!";
    if (percentile < 0.55) return "True Odds!";
    if (percentile < 0.68) return "A Lil' Spicy!";
    if (percentile < 0.8) return "Spicy!";
    if (percentile < 0.92) return "Hot!";
    return "Scorching!";
  }

  // High confidence: full range
  if (percentile < 0.05) return "Chalk City!";
  if (percentile < 0.15) return "Playing It Safe!";
  if (percentile < 0.25) return "Chalk-ish!";
  if (percentile < 0.38) return "By the Book!";
  if (percentile < 0.46) return "Mild!";
  if (percentile < 0.54) return "True Odds!";
  if (percentile < 0.65) return "A Lil' Spicy!";
  if (percentile < 0.76) return "Spicy!";
  if (percentile < 0.86) return "Hot!";
  if (percentile < 0.95) return "Scorching!";
  return "Unhinged!";
}

// --- Round-by-Round Probability ---

export type RoundProbability = {
  round: number;
  label: string;
  cumulative: number;
};

const ROUND_LABELS: Record<number, string> = {
  1: "R64",
  2: "R32",
  3: "Sweet 16",
  4: "Elite 8",
  5: "Final 4",
  6: "Champ"
};

export function roundByRoundProbability(
  games: GameNode[],
  picksByMatchup: Record<string, string>,
  teamsById: Record<string, Team>,
  chaos: number
): RoundProbability[] {
  // Compute per-game probability for picked games
  const probsByRound = new Map<number, number[]>();

  for (const game of games) {
    const pick = picksByMatchup[game.id];
    if (!pick) continue;

    const teamA = resolveTeamForSource(game.sourceA, picksByMatchup, teamsById);
    const teamB = resolveTeamForSource(game.sourceB, picksByMatchup, teamsById);
    if (!teamA || !teamB) continue;

    const pA = winProbability(teamA, teamB, chaos);
    const p = pick === teamA.id ? pA : pick === teamB.id ? 1 - pA : 1e-12;

    if (!probsByRound.has(game.round)) probsByRound.set(game.round, []);
    probsByRound.get(game.round)!.push(p);
  }

  // Build cumulative probability through each round
  let cumulative = 1;
  const results: RoundProbability[] = [];

  for (let round = 1; round <= 6; round++) {
    const roundProbs = probsByRound.get(round) ?? [];
    for (const p of roundProbs) {
      cumulative *= p;
    }
    results.push({
      round,
      label: ROUND_LABELS[round] ?? `R${round}`,
      cumulative: roundProbs.length > 0 ? cumulative : round === 1 ? 1 : results[results.length - 1]?.cumulative ?? 1
    });
  }

  return results;
}

// --- Seed Advancement ---

export type SeedAdvancement = Map<number, Map<number, { count: number; userCount: number; aiCount: number }>>;

export function seedAdvancement(
  picksByMatchup: Record<string, string>,
  pickSourceByMatchup: Record<string, "user" | "auto">,
  games: GameNode[],
  teamsById: Record<string, Team>
): SeedAdvancement {
  const result: SeedAdvancement = new Map();

  for (const game of games) {
    const pick = picksByMatchup[game.id];
    if (!pick) continue;

    const team = teamsById[pick];
    if (!team) continue;

    const seed = team.seed;
    const source = pickSourceByMatchup[game.id] ?? "user";

    if (!result.has(seed)) result.set(seed, new Map());
    const seedMap = result.get(seed)!;

    if (!seedMap.has(game.round)) {
      seedMap.set(game.round, { count: 0, userCount: 0, aiCount: 0 });
    }
    const entry = seedMap.get(game.round)!;
    entry.count++;
    if (source === "user") entry.userCount++;
    else entry.aiCount++;
  }

  return result;
}

// --- Regional Chalk Score ---

export type RegionalChalk = Record<string, { overall: number; user: number; ai: number }>;

export function regionalChalkScore(
  picksByMatchup: Record<string, string>,
  pickSourceByMatchup: Record<string, "user" | "auto">,
  games: GameNode[],
  teamsById: Record<string, Team>
): RegionalChalk {
  const regions: Record<string, { chalkUser: number; totalUser: number; chalkAi: number; totalAi: number }> = {};

  for (const game of games) {
    const region = game.region;
    if (region === "FinalFour") continue;
    if (!regions[region]) regions[region] = { chalkUser: 0, totalUser: 0, chalkAi: 0, totalAi: 0 };

    const pick = picksByMatchup[game.id];
    if (!pick) continue;

    const teamA = resolveTeamForSource(game.sourceA, picksByMatchup, teamsById);
    const teamB = resolveTeamForSource(game.sourceB, picksByMatchup, teamsById);
    if (!teamA || !teamB) continue;

    const isChalk =
      (pick === teamA.id && teamA.seed <= teamB.seed) || (pick === teamB.id && teamB.seed <= teamA.seed);

    const source = pickSourceByMatchup[game.id] ?? "user";
    const r = regions[region];

    if (source === "user") {
      r.totalUser++;
      if (isChalk) r.chalkUser++;
    } else {
      r.totalAi++;
      if (isChalk) r.chalkAi++;
    }
  }

  const result: RegionalChalk = {};
  for (const [region, data] of Object.entries(regions)) {
    const totalAll = data.totalUser + data.totalAi;
    const chalkAll = data.chalkUser + data.chalkAi;
    result[region] = {
      overall: totalAll > 0 ? chalkAll / totalAll : 1,
      user: data.totalUser > 0 ? data.chalkUser / data.totalUser : 1,
      ai: data.totalAi > 0 ? data.chalkAi / data.totalAi : 1
    };
  }

  return result;
}
