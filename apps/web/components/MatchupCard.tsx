"use client";

import type { Team } from "@slackbracket/domain";
import { motion } from "framer-motion";

import type { GameNode } from "../lib/tournament";

import { TeamBadge } from "./TeamBadge";

type Props = {
  game: GameNode;
  teamA: Team | null;
  teamB: Team | null;
  pickedId?: string;
  lockedId?: string;
  onPick: (teamId: string) => void;
};

function TeamRow({
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
  if (!team) return <div style={{ padding: "0.5rem", opacity: 0.6 }}>TBD</div>;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      style={{
        width: "100%",
        border: "1px solid #2f3f65",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0.45rem 0.5rem",
        marginBottom: 4,
        textAlign: "left",
        color: "inherit",
        background: selected ? "color-mix(in srgb, var(--accent) 65%, #131e37 35%)" : "#131e37",
        opacity: locked && !selected ? 0.45 : 1,
        cursor: locked ? "not-allowed" : "pointer"
      }}
    >
      <TeamBadge team={team} />
      <span style={{ width: 24, fontWeight: 700 }}>{team.seed}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{team.team}</span>
      {selected ? <span style={{ fontWeight: 700 }}>✓</span> : null}
    </button>
  );
}

export function MatchupCard({ game, teamA, teamB, pickedId, lockedId, onPick }: Props) {
  const locked = Boolean(lockedId);
  return (
    <motion.article layout className="card" style={{ opacity: locked ? 0.85 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "var(--muted)" }}>
        <small>
          Round {game.round} - {game.region}
        </small>
        <small>{locked ? "Final/Locked" : "Editable"}</small>
      </div>
      <TeamRow team={teamA} selected={pickedId === teamA?.id} locked={locked} onPick={() => teamA && onPick(teamA.id)} />
      <TeamRow team={teamB} selected={pickedId === teamB?.id} locked={locked} onPick={() => teamB && onPick(teamB.id)} />
    </motion.article>
  );
}
