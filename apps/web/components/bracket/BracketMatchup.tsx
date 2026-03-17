"use client";

import type { Team } from "@slackbracket/domain";
import { motion } from "framer-motion";

import { teamAbbrev } from "../../lib/logos";
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
  isChampionship?: boolean;
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
function upsetFillColor(degree: number, isAi = false): string | undefined {
  if (degree <= 0) return undefined;
  const t = Math.min(degree / 15, 1);
  // hue: 50 (warm yellow) → 10 (fiery red-orange)
  const hue = 50 - t * 40;
  const sat = 95;
  const baseAlpha = 0.18 + t * 0.22; // 18% → 40%
  // AI upsets: same warm colors, lower opacity (more transient feel)
  const alpha = isAi ? baseAlpha * 0.55 : baseAlpha;
  return `hsla(${hue}, ${sat}%, 50%, ${alpha})`;
}

function CompactTeamRow({
  team,
  selected,
  locked,
  isUpset,
  upsetDeg,
  pickSource,
  isChampionship,
  onPick
}: {
  team: Team | null;
  selected: boolean;
  locked: boolean;
  isUpset: boolean;
  upsetDeg: number;
  pickSource?: PickSource;
  isChampionship?: boolean;
  onPick: () => void;
}) {
  if (!team) {
    return <div className="bracket-matchup__tbd">TBD</div>;
  }

  const isAi = pickSource === "auto";
  const upsetFill = selected && isUpset ? upsetFillColor(upsetDeg, isAi) : undefined;
  // Championship winner: fully opaque background via CSS var (purple in light, white in dark)
  // Upset: layer warm upset tint on top of opaque base. Non-upset: solid opaque base.
  const fillBg = isChampionship && selected
    ? upsetFill
      ? `linear-gradient(${upsetFill}, ${upsetFill}), linear-gradient(var(--champ-winner-bg), var(--champ-winner-bg))`
      : "var(--champ-winner-bg)"
    : upsetFill;

  const classes = [
    "bracket-matchup__team",
    selected ? "bracket-matchup__team--selected" : "",
    selected && isAi ? "bracket-matchup__team--ai-selected" : "",
    selected && isUpset ? "bracket-matchup__team--upset-winner" : "",
    locked && !selected ? "bracket-matchup__team--locked" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      className={classes}
      style={{
        ...(fillBg ? { background: fillBg } : {}),
        ...(isChampionship && selected ? { color: "var(--champ-winner-text)" } : {}),
        ...(selected && isUpset ? { "--upset-degree": `${Math.min(upsetDeg / 15, 1)}` } as Record<string, string> : {})
      } as React.CSSProperties}
    >
      <TeamBadge team={team} />
      <span className="bracket-matchup__seed">{team.seed}</span>
      <span className="bracket-matchup__name">
        {team.firstFourOpponent
          ? `${teamAbbrev(team.team)}/${teamAbbrev(team.firstFourOpponent.team)}`
          : team.team}
      </span>
      {selected && (
        <motion.span
          className={`bracket-matchup__check ${isUpset ? "bracket-matchup__check--upset" : ""} ${isAi ? "bracket-matchup__check--ai" : ""}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          style={isUpset ? { "--pick-hue": `${50 - Math.min(upsetDeg / 15, 1) * 40}` } as React.CSSProperties : undefined}
        >
          {isAi ? "✧" : "✓"}
        </motion.span>
      )}
    </button>
  );
}

export function BracketMatchup({ game: _game, teamA, teamB, pickedId, lockedId, pickSource, onPick, regionColor, isChampionship }: Props) {
  const locked = Boolean(lockedId);
  const degree = upsetDegree(teamA, teamB, pickedId);
  const glowColor = upsetGlowColor(degree);

  const normalizedDegree = Math.min(degree / 15, 1);

  return (
    <motion.div
      className={`bracket-matchup ${locked ? "bracket-matchup--locked" : ""} ${degree > 0 ? "bracket-matchup--upset" : ""} ${isChampionship ? "bracket-matchup--championship" : ""}`}
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
        isChampionship={isChampionship}
        onPick={() => teamA && onPick(teamA.id)}
      />
      <CompactTeamRow
        team={teamB}
        selected={pickedId === teamB?.id}
        locked={locked}
        isUpset={degree > 0 && pickedId === teamB?.id}
        upsetDeg={degree}
        pickSource={pickedId === teamB?.id ? pickSource : undefined}
        isChampionship={isChampionship}
        onPick={() => teamB && onPick(teamB.id)}
      />
    </motion.div>
  );
}
