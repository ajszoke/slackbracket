"use client";

import type { Team } from "@slackbracket/domain";

import type { GameNode } from "../../lib/tournament";
import { resolveTeamForSource } from "../../lib/tournament";

import { BracketMatchup } from "./BracketMatchup";

type Props = {
  semi1: GameNode | null;
  semi2: GameNode | null;
  championship: GameNode | null;
  picksByMatchup: Record<string, string>;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
};

function FinalFourGame({
  game,
  picksByMatchup,
  lockedByMatchup,
  teamsById,
  onPick,
  regionColor
}: {
  game: GameNode | null;
  picksByMatchup: Record<string, string>;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
  regionColor: string;
}) {
  if (!game) return null;
  const teamA = resolveTeamForSource(game.sourceA, picksByMatchup, teamsById);
  const teamB = resolveTeamForSource(game.sourceB, picksByMatchup, teamsById);
  return (
    <BracketMatchup
      game={game}
      teamA={teamA}
      teamB={teamB}
      pickedId={picksByMatchup[game.id]}
      lockedId={lockedByMatchup[game.id]}
      onPick={(teamId) => onPick(game.id, teamId)}
      regionColor={regionColor}
    />
  );
}

export function FinalFourBracket({ semi1, semi2, championship, picksByMatchup, lockedByMatchup, teamsById, onPick }: Props) {
  return (
    <div className="bracket-center">
      <FinalFourGame
        game={semi1}
        picksByMatchup={picksByMatchup}
        lockedByMatchup={lockedByMatchup}
        teamsById={teamsById}
        onPick={onPick}
        regionColor="var(--region-finalfour)"
      />
      <div className="bracket-championship">
        <span className="bracket-championship__label">Championship</span>
        <FinalFourGame
          game={championship}
          picksByMatchup={picksByMatchup}
          lockedByMatchup={lockedByMatchup}
          teamsById={teamsById}
          onPick={onPick}
          regionColor="var(--region-finalfour)"
        />
      </div>
      <FinalFourGame
        game={semi2}
        picksByMatchup={picksByMatchup}
        lockedByMatchup={lockedByMatchup}
        teamsById={teamsById}
        onPick={onPick}
        regionColor="var(--region-finalfour)"
      />
    </div>
  );
}
