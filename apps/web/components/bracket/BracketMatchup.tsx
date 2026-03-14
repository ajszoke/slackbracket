"use client";

import type { Team } from "@slackbracket/domain";
import { motion } from "framer-motion";

import type { GameNode } from "../../lib/tournament";
import { TeamBadge } from "../TeamBadge";

type Props = {
  game: GameNode;
  teamA: Team | null;
  teamB: Team | null;
  pickedId?: string;
  lockedId?: string;
  onPick: (teamId: string) => void;
  regionColor?: string;
};

function CompactTeamRow({
  team,
  selected,
  locked,
  onPick
}: {
  team: Team | null;
  selected: boolean;
  locked: boolean;
  onPick: () => void;
}) {
  if (!team) {
    return <div className="bracket-matchup__tbd">TBD</div>;
  }

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      className={`bracket-matchup__team ${selected ? "bracket-matchup__team--selected" : ""} ${locked && !selected ? "bracket-matchup__team--locked" : ""}`}
    >
      <TeamBadge team={team} />
      <span className="bracket-matchup__seed">{team.seed}</span>
      <span className="bracket-matchup__name">{team.team}</span>
      {selected && (
        <motion.span
          className="bracket-matchup__check"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          ✓
        </motion.span>
      )}
    </button>
  );
}

export function BracketMatchup({ game, teamA, teamB, pickedId, lockedId, onPick, regionColor }: Props) {
  const locked = Boolean(lockedId);
  const isUpset =
    pickedId &&
    teamA &&
    teamB &&
    ((pickedId === teamA.id && teamA.seed > teamB.seed) || (pickedId === teamB.id && teamB.seed > teamA.seed));

  return (
    <motion.div
      className={`bracket-matchup ${locked ? "bracket-matchup--locked" : ""}`}
      style={{ "--region-color": regionColor ?? "var(--accent)" } as React.CSSProperties}
      whileHover={locked ? undefined : { y: -2, transition: { duration: 0.15 } }}
      layout
    >
      <CompactTeamRow
        team={teamA}
        selected={pickedId === teamA?.id}
        locked={locked}
        onPick={() => teamA && onPick(teamA.id)}
      />
      <CompactTeamRow
        team={teamB}
        selected={pickedId === teamB?.id}
        locked={locked}
        onPick={() => teamB && onPick(teamB.id)}
      />
      {isUpset && <span className="bracket-matchup__upset" title="Upset pick!">🔥</span>}
    </motion.div>
  );
}
