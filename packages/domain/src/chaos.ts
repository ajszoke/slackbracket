export type ChaosPreset = {
  id: "chalk" | "balanced" | "chaos" | "sicko";
  label: string;
  value: number;
  description: string;
};

export const CHAOS_PRESETS: ChaosPreset[] = [
  { id: "chalk", label: "Chalk City", value: 0.15, description: "Favor top seeds heavily" },
  { id: "balanced", label: "Balanced", value: 0.4, description: "Mostly likely outcomes" },
  { id: "chaos", label: "Chaos", value: 0.72, description: "Upsets are common" },
  { id: "sicko", label: "Sicko Mode", value: 0.92, description: "All vibes, no rules" }
];

export function chaosCurve(raw: number): number {
  const clamped = Math.min(1, Math.max(0, raw));
  // Non-linear curve feels more dramatic near high-chaos settings.
  return Math.pow(clamped, 1.35);
}

export function chaosLabel(value: number): string {
  const curved = chaosCurve(value);
  if (curved < 0.25) return "Safe Picks";
  if (curved < 0.55) return "Balanced Madness";
  if (curved < 0.8) return "Upset Hunting";
  return "Absolute Mayhem";
}
