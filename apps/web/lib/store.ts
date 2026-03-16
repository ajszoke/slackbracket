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

type BracketStore = {
  bracketType: "men" | "women";
  chaos: number;
  selectedRegion: RegionTab;
  picksByMatchup: Record<string, string>;
  pickSourceByMatchup: Record<string, PickSource>;
  lockedByMatchup: Record<string, string>;
  showTour: boolean;
  setBracketType: (value: "men" | "women") => void;
  setChaos: (value: number) => void;
  setChaosPreset: (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => void;
  setRegion: (region: RegionTab) => void;
  pick: (matchupId: string, teamId: string) => void;
  clearPick: (matchupId: string, games: GameNode[]) => void;
  hydratePicks: (picks: Record<string, string>) => void;
  setLocked: (locked: Record<string, string>) => void;
  setShowTour: (show: boolean) => void;
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
  showTour: false
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
    pick: (matchupId, teamId) => {
      const lockedWinner = get().lockedByMatchup[matchupId];
      if (lockedWinner) return;
      set((state) => ({
        picksByMatchup: { ...state.picksByMatchup, [matchupId]: teamId },
        pickSourceByMatchup: { ...state.pickSourceByMatchup, [matchupId]: "user" as PickSource }
      }));
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

      for (const game of games.sort((a, b) => a.round - b.round || a.slot - b.slot)) {
        if (state.lockedByMatchup[game.id]) continue;
        if (nextPicks[game.id]) continue;
        const teamA = resolveTeamForSource(game.sourceA, nextPicks, teamsById);
        const teamB = resolveTeamForSource(game.sourceB, nextPicks, teamsById);
        if (!teamA || !teamB) continue;
        const winner = pickWinner(teamA, teamB, state.chaos);
        nextPicks[game.id] = winner.id;
        nextSources[game.id] = "auto";
      }

      set({ picksByMatchup: nextPicks, pickSourceByMatchup: nextSources });
    },
    resetAll: () => set({ ...defaults })
  }))
);
