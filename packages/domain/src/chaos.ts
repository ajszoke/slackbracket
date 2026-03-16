export type ChaosPreset = {
  id: "chalk" | "playItSafe" | "trueOdds" | "madness" | "sicko";
  label: string;
  emoji: string;
  value: number;
  description: string;
};

export const CHAOS_PRESETS: ChaosPreset[] = [
  { id: "chalk", label: "Chalk City", emoji: "😴", value: 0, description: "ELO favorites win" },
  { id: "playItSafe", label: "Play It Safe", emoji: "🧊", value: 0.25, description: "Mostly favorites" },
  { id: "trueOdds", label: "True Odds", emoji: "⚖️", value: 0.5, description: "Pure ELO probability" },
  { id: "madness", label: "Madness", emoji: "🔥", value: 0.75, description: "Upsets are common" },
  { id: "sicko", label: "Sicko Mode", emoji: "👹", value: 1.0, description: "Total coinflip" }
];

export function chaosCurve(raw: number): number {
  const clamped = Math.min(1, Math.max(0, raw));
  // Non-linear curve feels more dramatic near high-chaos settings.
  return Math.pow(clamped, 1.35);
}

export function chaosLabel(value: number): string {
  if (value >= 1.0) return "True Random";
  if (value > 0.85) return "Absolute Mayhem";
  if (value > 0.65) return "Feeling Dangerous";
  if (value > 0.4) return "Realistic Balance";
  if (value > 0.15) return "Smart Money";
  return "Snooze Fest";
}
