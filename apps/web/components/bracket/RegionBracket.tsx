"use client";

import type { Team } from "@slackbracket/domain";

import type { GameNode } from "../../lib/tournament";
import { resolveTeamForSource } from "../../lib/tournament";

import { BracketMatchup } from "./BracketMatchup";

type Props = {
  /** Rounds for this region: index 0 = R1, index 3 = R4. Each sorted by slot. */
  rounds: GameNode[][];
  direction: "ltr" | "rtl";
  regionColor: string;
  regionLabel: string;
  picksByMatchup: Record<string, string>;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
};

export function RegionBracket({
  rounds,
  direction,
  regionColor,
  regionLabel,
  picksByMatchup,
  lockedByMatchup,
  teamsById,
  onPick
}: Props) {
  return (
    <div
      className={`bracket-region ${direction === "rtl" ? "bracket-region--rtl" : ""}`}
      style={{ "--region-color": regionColor } as React.CSSProperties}
    >
      {rounds.map((roundGames, roundIndex) => (
        <div key={roundIndex} className="bracket-round">
          {roundIndex === 0 && (
            <div className="bracket-region__label" style={{ position: "absolute", top: "-1.3rem", left: 0, right: 0 }}>
              {regionLabel}
            </div>
          )}
          {roundGames.map((game) => {
            const teamA = resolveTeamForSource(game.sourceA, picksByMatchup, teamsById);
            const teamB = resolveTeamForSource(game.sourceB, picksByMatchup, teamsById);
            return (
              <div key={game.id} className="bracket-item">
                <BracketMatchup
                  game={game}
                  teamA={teamA}
                  teamB={teamB}
                  pickedId={picksByMatchup[game.id]}
                  lockedId={lockedByMatchup[game.id]}
                  onPick={(teamId) => onPick(game.id, teamId)}
                  regionColor={regionColor}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
