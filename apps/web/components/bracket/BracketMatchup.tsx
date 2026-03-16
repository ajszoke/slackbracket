"use client";

import type { Team } from "@slackbracket/domain";
import { motion } from "framer-motion";

import type { GameNode } from "../../lib/tournament";
import { TeamBadge } from "../TeamBadge";

type PickSource = "user" | "auto";

type Props = {
  game: GameNode;
  teamA: Team | null;
  teamB: Team | null;
  pickedId?: string;
  lockedId?: string;
  pickSource?: PickSource;
  onPick: (teamId: string) => void;
  regionColor?: string;
};

/**
 * Compute upset degree: 0 = no upset or favorite pick, 1..15 = seed differential.
 * Higher = wilder upset. Used for warm glow intensity.
 */
function upsetDegree(teamA: Team | null, teamB: Team | null, pickedId?: string): number {
  if (!teamA || !teamB || !pickedId) return 0;
  const picked = pickedId === teamA.id ? teamA : pickedId === teamB.id ? teamB : null;
  const opponent = pickedId === teamA.id ? teamB : teamA;
  if (!picked || !opponent) return 0;
  const diff = picked.seed - opponent.seed;
  return diff > 0 ? diff : 0; // positive = picked team has worse seed
}

/**
 * Map upset degree (0-15) to a warm hue: 0 = no glow, small = pastel amber, large = fiery red-orange.
 */
function upsetGlowColor(degree: number): string | undefined {
  if (degree <= 0) return undefined;
  const t = Math.min(degree / 15, 1);
  // Hue: 50 (warm yellow) for mild → 10 (red-orange) for extreme
  const hue = 50 - t * 40;
  const saturation = 95;
  const lightness = 55;
  const alpha = 0.35 + t * 0.45; // 0.35 → 0.80
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Map upset degree (0-15) to a warm background fill for the winner row.
 * Mild upset: faint amber. Extreme upset: deeper fiery orange.
 * Alpha kept low so text stays readable (white on warm tint).
 */
function upsetFillColor(degree: number): string | undefined {
  if (degree <= 0) return undefined;
  const t = Math.min(degree / 15, 1);
  // hue: 50 (warm yellow) → 10 (fiery red-orange)
  const hue = 50 - t * 40;
  const sat = 95;
  const alpha = 0.18 + t * 0.22; // 18% → 40% — always clearly visible
  return `hsla(${hue}, ${sat}%, 50%, ${alpha})`;
}

function CompactTeamRow({
  team,
  selected,
  locked,
  isUpset,
  upsetDeg,
  pickSource,
  onPick
}: {
  team: Team | null;
  selected: boolean;
  locked: boolean;
  isUpset: boolean;
  upsetDeg: number;
  pickSource?: PickSource;
  onPick: () => void;
}) {
  if (!team) {
    return <div className="bracket-matchup__tbd">TBD</div>;
  }

  const fillBg = selected && isUpset ? upsetFillColor(upsetDeg) : undefined;

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      className={`bracket-matchup__team ${selected ? "bracket-matchup__team--selected" : ""} ${selected && isUpset ? "bracket-matchup__team--upset-winner" : ""} ${locked && !selected ? "bracket-matchup__team--locked" : ""}`}
      style={{
        ...(fillBg ? { background: fillBg } : {}),
        ...(selected && isUpset ? { "--upset-degree": `${Math.min(upsetDeg / 15, 1)}` } as Record<string, string> : {})
      } as React.CSSProperties}
    >
      <TeamBadge team={team} />
      <span className="bracket-matchup__seed">{team.seed}</span>
      <span className="bracket-matchup__name">
        {team.team}
      </span>
      {selected && (
        <>
          <motion.span
            className="bracket-matchup__check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            ✓
          </motion.span>
          {pickSource && (
            <span className="bracket-matchup__source" title={pickSource === "user" ? "Your pick" : "AI pick"}>
              {pickSource === "user" ? "●" : "✦"}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export function BracketMatchup({ game, teamA, teamB, pickedId, lockedId, pickSource, onPick, regionColor }: Props) {
  const locked = Boolean(lockedId);
  const degree = upsetDegree(teamA, teamB, pickedId);
  const glowColor = upsetGlowColor(degree);

  const normalizedDegree = Math.min(degree / 15, 1);

  return (
    <motion.div
      className={`bracket-matchup ${locked ? "bracket-matchup--locked" : ""} ${degree > 0 ? "bracket-matchup--upset" : ""}`}
      style={{
        "--region-color": regionColor ?? "var(--accent)",
        ...(glowColor ? { "--upset-glow": glowColor } as Record<string, string> : {}),
        ...(degree > 0 ? { "--upset-degree": `${normalizedDegree}` } as Record<string, string> : {})
      } as React.CSSProperties}
      whileHover={locked ? undefined : { y: -2, transition: { duration: 0.15 } }}
      layout
    >
      <CompactTeamRow
        team={teamA}
        selected={pickedId === teamA?.id}
        locked={locked}
        isUpset={degree > 0 && pickedId === teamA?.id}
        upsetDeg={degree}
        pickSource={pickedId === teamA?.id ? pickSource : undefined}
        onPick={() => teamA && onPick(teamA.id)}
      />
      <CompactTeamRow
        team={teamB}
        selected={pickedId === teamB?.id}
        locked={locked}
        isUpset={degree > 0 && pickedId === teamB?.id}
        upsetDeg={degree}
        pickSource={pickedId === teamB?.id ? pickSource : undefined}
        onPick={() => teamB && onPick(teamB.id)}
      />
    </motion.div>
  );
}
