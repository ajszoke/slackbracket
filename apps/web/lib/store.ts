"use client";

import { CHAOS_PRESETS, pickWinner, type Team } from "@slackbracket/domain";
import { temporal } from "zundo";
import { create } from "zustand";

import type { GameNode } from "./tournament";
import { resolveTeamForSource } from "./tournament";

type RegionTab = "East" | "West" | "South" | "Midwest" | "FinalFour";
type PickSource = "user" | "auto";

function recordsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Walk the game tree forward from a cleared game and find all downstream
 * picks that depended on the cleared winner. Returns set of matchup IDs to clear.
 */
function findCascadedClears(
  clearedMatchupId: string,
  clearedTeamId: string,
  games: GameNode[],
  picks: Record<string, string>
): Set<string> {
  const toClear = new Set<string>();

  // Find games whose source references the cleared matchup
  for (const game of games) {
    const dependsOnCleared =
      (game.sourceA.type === "winner" && game.sourceA.matchupId === clearedMatchupId) ||
      (game.sourceB.type === "winner" && game.sourceB.matchupId === clearedMatchupId);

    if (!dependsOnCleared) continue;

    // If this game's pick was the team that just got cleared upstream, clear it too
    const pick = picks[game.id];
    if (pick === clearedTeamId) {
      toClear.add(game.id);
      // Recurse: this game's winner might also be picked downstream
      const nested = findCascadedClears(game.id, pick, games, picks);
      for (const id of nested) toClear.add(id);
    }
  }

  return toClear;
}

type Theme = "dark" | "light";
type QualityTier = "low" | "medium" | "high" | "ultra";

type BracketStore = {
  bracketType: "men" | "women";
  chaos: number;
  selectedRegion: RegionTab;
  picksByMatchup: Record<string, string>;
  pickSourceByMatchup: Record<string, PickSource>;
  lockedByMatchup: Record<string, string>;
  showTour: boolean;
  theme: Theme;
  quality: QualityTier;
  setBracketType: (value: "men" | "women") => void;
  setChaos: (value: number) => void;
  setChaosPreset: (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => void;
  setRegion: (region: RegionTab) => void;
  pick: (matchupId: string, teamId: string, games?: GameNode[]) => void;
  clearPick: (matchupId: string, games: GameNode[]) => void;
  hydratePicks: (picks: Record<string, string>) => void;
  setLocked: (locked: Record<string, string>) => void;
  setShowTour: (show: boolean) => void;
  setTheme: (theme: Theme) => void;
  setQuality: (quality: QualityTier) => void;
  autoFillRemaining: (games: GameNode[], teamsById: Record<string, Team>) => void;
  resetAll: () => void;
};

const defaults = {
  bracketType: "men" as const,
  chaos: 0.5,
  selectedRegion: "East" as const,
  picksByMatchup: {} as Record<string, string>,
  pickSourceByMatchup: {} as Record<string, PickSource>,
  lockedByMatchup: {} as Record<string, string>,
  showTour: false,
  theme: "light" as Theme,
  quality: "medium" as QualityTier
};

export const useBracketStore = create<BracketStore>()(
  temporal((set, get) => ({
    ...defaults,
    setBracketType: (bracketType) =>
      set({ bracketType, picksByMatchup: {}, pickSourceByMatchup: {}, lockedByMatchup: {} }),
    setChaos: (chaos) => set({ chaos }),
    setChaosPreset: (presetId) => {
      const preset = CHAOS_PRESETS.find((entry) => entry.id === presetId);
      if (preset) set({ chaos: preset.value });
    },
    setRegion: (selectedRegion) => set({ selectedRegion }),
    pick: (matchupId, teamId, games?) => {
      const state = get();
      const lockedWinner = state.lockedByMatchup[matchupId];
      if (lockedWinner) return;

      const oldPick = state.picksByMatchup[matchupId];
      const nextPicks = { ...state.picksByMatchup, [matchupId]: teamId };
      const nextSources: Record<string, PickSource> = {
        ...state.pickSourceByMatchup,
        [matchupId]: "user"
      };

      // Forward cascade: wherever the old team had advanced, slot in the new team.
      // Mark as "user" since the user initiated this override.
      if (oldPick && oldPick !== teamId && games) {
        const cascaded = findCascadedClears(matchupId, oldPick, games, state.picksByMatchup);
        for (const gameId of cascaded) {
          nextPicks[gameId] = teamId;
          nextSources[gameId] = "user";
        }
      }

      // Back-propagate: trace the picked team backward through the bracket.
      // If user picks Duke in R3, Duke's R2 and R1 wins become user picks too.
      if (games) {
        let traceId = matchupId;
        while (true) {
          const game = games.find((g) => g.id === traceId);
          if (!game) break;
          const upstream =
            game.sourceA.type === "winner" && nextPicks[game.sourceA.matchupId] === teamId
              ? game.sourceA.matchupId
              : game.sourceB.type === "winner" && nextPicks[game.sourceB.matchupId] === teamId
                ? game.sourceB.matchupId
                : null;
          if (!upstream) break;
          nextSources[upstream] = "user";
          traceId = upstream;
        }
      }

      set({ picksByMatchup: nextPicks, pickSourceByMatchup: nextSources });
    },
    clearPick: (matchupId, games) => {
      const state = get();
      const clearedTeam = state.picksByMatchup[matchupId];
      if (!clearedTeam) return;

      const cascaded = findCascadedClears(matchupId, clearedTeam, games, state.picksByMatchup);
      const allToClear = new Set([matchupId, ...cascaded]);

      const nextPicks = { ...state.picksByMatchup };
      const nextSources = { ...state.pickSourceByMatchup };
      for (const id of allToClear) {
        delete nextPicks[id];
        delete nextSources[id];
      }

      set({ picksByMatchup: nextPicks, pickSourceByMatchup: nextSources });
    },
    hydratePicks: (picksByMatchup) => {
      const pickSourceByMatchup: Record<string, PickSource> = {};
      for (const id of Object.keys(picksByMatchup)) {
        pickSourceByMatchup[id] = "user";
      }
      set({ picksByMatchup, pickSourceByMatchup });
    },
    setLocked: (lockedByMatchup) =>
      set((state) => {
        if (recordsEqual(state.lockedByMatchup, lockedByMatchup)) {
          return state;
        }
        return { lockedByMatchup };
      }),
    setShowTour: (showTour) => set({ showTour }),
    setTheme: (theme) => set({ theme }),
    setQuality: (quality) => set({ quality }),
    autoFillRemaining: (games, teamsById) => {
      const state = get();
      const nextPicks = { ...state.picksByMatchup };
      const nextSources = { ...state.pickSourceByMatchup };

      // Clear all existing auto-filled picks so re-generate produces fresh results
      for (const [matchupId, source] of Object.entries(nextSources)) {
        if (source === "auto") {
          delete nextPicks[matchupId];
          delete nextSources[matchupId];
        }
      }

      // Resolve First Four play-in games before main bracket.
      // "ELO squared": use winProbability to pick which team advances,
      // then replace the placeholder team data with the winner's ELO.
      const resolvedTeams = { ...teamsById };
      for (const team of Object.values(resolvedTeams)) {
        if (!team.firstFourOpponent) continue;
        const opp = team.firstFourOpponent;
        const oppAsTeam = { ...team, team: opp.team, elo: opp.elo, conference: opp.conference };
        const winner = pickWinner(team, oppAsTeam, state.chaos);
        if (winner.elo === opp.elo) {
          // Opponent won — update the placeholder team's ELO and name
          resolvedTeams[team.id] = {
            ...team,
            team: opp.team,
            elo: opp.elo,
            conference: opp.conference
          };
        }
        // If placeholder won, no change needed — it already has the right data
      }

      for (const game of games.sort((a, b) => a.round - b.round || a.slot - b.slot)) {
        if (state.lockedByMatchup[game.id]) continue;
        if (nextPicks[game.id]) continue;
        const teamA = resolveTeamForSource(game.sourceA, nextPicks, resolvedTeams);
        const teamB = resolveTeamForSource(game.sourceB, nextPicks, resolvedTeams);
        if (!teamA || !teamB) continue;
        const winner = pickWinner(teamA, teamB, state.chaos);
        nextPicks[game.id] = winner.id;
        nextSources[game.id] = "auto";
      }

      set({ picksByMatchup: nextPicks, pickSourceByMatchup: nextSources });
    },
    resetAll: () => set((state) => ({ ...defaults, theme: state.theme, quality: state.quality, bracketType: state.bracketType }))
  }), {
    partialize: (state) => {
      // Exclude UI-only state from undo/redo history
      const { theme: _theme, showTour: _showTour, quality: _quality, ...tracked } = state;
      return tracked;
    }
  })
);
