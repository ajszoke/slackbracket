import type { Matchup, Team } from "./types";
import { winProbability } from "./simulation";

export type BracketOddsSummary = {
  exactProbability: number;
  oneIn: string;
  exponentApprox: string;
};

// --- Human-Readable Odds ---

const MAGNITUDES: Array<[number, string]> = [
  [1e48, "quindecillion"],
  [1e45, "quattuordecillion"],
  [1e42, "tredecillion"],
  [1e39, "duodecillion"],
  [1e36, "undecillion"],
  [1e33, "decillion"],
  [1e30, "nonillion"],
  [1e27, "octillion"],
  [1e24, "septillion"],
  [1e21, "sextillion"],
  [1e18, "quintillion"],
  [1e15, "quadrillion"],
  [1e12, "trillion"],
  [1e9, "billion"],
  [1e6, "million"],
  [1e3, "thousand"]
];

const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function toSuperscript(n: number): string {
  return Math.abs(n)
    .toString()
    .split("")
    .map((ch) => SUPERSCRIPT_DIGITS[Number(ch)] ?? ch)
    .join("");
}

export type HumanReadableOdds = {
  display: string; // "1 in 5.82 quadrillion"
  scientific: string; // "5.82 × 10¹⁵" (Unicode superscript)
  scientificHtml: string; // "5.82 × 10<sup>15</sup>" (HTML for rendering)
};

export function humanReadableOneIn(probability: number): HumanReadableOdds {
  if (probability <= 0) return { display: "1 in ∞", scientific: "∞", scientificHtml: "∞" };
  if (probability >= 1) return { display: "1 in 1", scientific: "1", scientificHtml: "1" };

  const inv = 1 / probability;

  // Find the right magnitude name
  let display: string;
  for (const [threshold, name] of MAGNITUDES) {
    if (inv >= threshold) {
      const scaled = inv / threshold;
      display = `1 in ${scaled.toFixed(2)} ${name}`;
      break;
    }
  }
  display ??= `1 in ${inv < 10 ? inv.toFixed(2) : Math.round(inv).toLocaleString()}`;

  // Scientific notation
  const exponent = Math.floor(Math.log10(inv));
  const mantissa = inv / Math.pow(10, exponent);
  const scientific = exponent >= 3 ? `${mantissa.toFixed(2)} × 10${toSuperscript(exponent)}` : display;
  const scientificHtml = exponent >= 3 ? `${mantissa.toFixed(2)} × 10<sup>${exponent}</sup>` : display;

  return { display, scientific, scientificHtml };
}

// --- Legacy formatters (kept for compatibility) ---

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

// --- Bracket Probability ---

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
    const p = picked === teamA.id ? pA : picked === teamB.id ? 1 - pA : 0;
    result *= Math.max(p, 1e-12);
  }

  return result;
}

export function summarizeOdds(params: {
  picksByMatchup: Record<string, string>;
  matchups: Matchup[];
  teamsById: Record<string, Team>;
  chaos: number;
}): BracketOddsSummary {
  const exactProbability = computeBracketProbability(params);
  return {
    exactProbability,
    oneIn: oneIn(exactProbability),
    exponentApprox: scientificApprox(exactProbability)
  };
}
