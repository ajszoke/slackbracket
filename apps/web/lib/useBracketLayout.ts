import { useMemo } from "react";

import type { GameNode } from "./tournament";

const REGIONS = ["East", "West", "South", "Midwest"] as const;
type BracketRegion = (typeof REGIONS)[number];

export type BracketLayout = {
  regions: Record<BracketRegion, GameNode[][]>; // index = round-1, each inner array sorted by slot
  finalFour: {
    semi1: GameNode | null; // R5-FinalFour-1 (East vs South)
    semi2: GameNode | null; // R5-FinalFour-2 (West vs Midwest)
    championship: GameNode | null; // R6-FinalFour-1
  };
};

export function groupGamesIntoBracket(games: GameNode[]): BracketLayout {
  const regions: Record<BracketRegion, GameNode[][]> = {
    East: [[], [], [], []],
    West: [[], [], [], []],
    South: [[], [], [], []],
    Midwest: [[], [], [], []]
  };

  let semi1: GameNode | null = null;
  let semi2: GameNode | null = null;
  let championship: GameNode | null = null;

  for (const game of games) {
    if (game.region === "FinalFour") {
      if (game.round === 5 && game.slot === 1) semi1 = game;
      else if (game.round === 5 && game.slot === 2) semi2 = game;
      else if (game.round === 6) championship = game;
    } else {
      const region = game.region as BracketRegion;
      const roundIndex = game.round - 1;
      if (roundIndex >= 0 && roundIndex < 4) {
        regions[region][roundIndex].push(game);
      }
    }
  }

  // Sort each round by slot
  for (const region of REGIONS) {
    for (const round of regions[region]) {
      round.sort((a, b) => a.slot - b.slot);
    }
  }

  return { regions, finalFour: { semi1, semi2, championship } };
}

export function useBracketLayout(games: GameNode[]): BracketLayout {
  return useMemo(() => groupGamesIntoBracket(games), [games]);
}
