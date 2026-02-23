"use client";

import { CHAOS_PRESETS, pickWinner, type Team } from "@slackbracket/domain";
import { temporal } from "zundo";
import { create } from "zustand";

import type { GameNode } from "./tournament";
import { resolveTeamForSource } from "./tournament";

type RegionTab = "East" | "West" | "South" | "Midwest" | "FinalFour";
type Mode = "quick" | "guided";

function recordsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

type BracketStore = {
  bracketType: "men" | "women";
  chaos: number;
  mode: Mode;
  selectedRegion: RegionTab;
  picksByMatchup: Record<string, string>;
  lockedByMatchup: Record<string, string>;
  tutorialStep: number;
  tutorialDismissed: boolean;
  setBracketType: (value: "men" | "women") => void;
  setChaos: (value: number) => void;
  setChaosPreset: (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => void;
  setMode: (mode: Mode) => void;
  setRegion: (region: RegionTab) => void;
  pick: (matchupId: string, teamId: string) => void;
  hydratePicks: (picks: Record<string, string>) => void;
  setLocked: (locked: Record<string, string>) => void;
  dismissTutorial: () => void;
  nextTutorial: () => void;
  autoFillRemaining: (games: GameNode[], teamsById: Record<string, Team>) => void;
  resetAll: () => void;
};

const defaults = {
  bracketType: "men" as const,
  chaos: 0.4,
  mode: "guided" as const,
  selectedRegion: "East" as const,
  picksByMatchup: {},
  lockedByMatchup: {},
  tutorialStep: 0,
  tutorialDismissed: false
};

export const useBracketStore = create<BracketStore>()(
  temporal((set, get) => ({
    ...defaults,
    setBracketType: (bracketType) => set({ bracketType, picksByMatchup: {}, lockedByMatchup: {} }),
    setChaos: (chaos) => set({ chaos }),
    setChaosPreset: (presetId) => {
      const preset = CHAOS_PRESETS.find((entry) => entry.id === presetId);
      if (preset) set({ chaos: preset.value });
    },
    setMode: (mode) => set({ mode }),
    setRegion: (selectedRegion) => set({ selectedRegion }),
    pick: (matchupId, teamId) => {
      const lockedWinner = get().lockedByMatchup[matchupId];
      if (lockedWinner) return;
      set((state) => ({
        picksByMatchup: {
          ...state.picksByMatchup,
          [matchupId]: teamId
        }
      }));
    },
    hydratePicks: (picksByMatchup) => set({ picksByMatchup }),
    setLocked: (lockedByMatchup) =>
      set((state) => {
        if (recordsEqual(state.lockedByMatchup, lockedByMatchup)) {
          return state;
        }
        return { lockedByMatchup };
      }),
    dismissTutorial: () => set({ tutorialDismissed: true }),
    nextTutorial: () => set((state) => ({ tutorialStep: state.tutorialStep + 1 })),
    autoFillRemaining: (games, teamsById) => {
      const state = get();
      const next = { ...state.picksByMatchup };

      for (const game of games.sort((a, b) => a.round - b.round || a.slot - b.slot)) {
        if (state.lockedByMatchup[game.id]) continue;
        if (next[game.id]) continue;
        const teamA = resolveTeamForSource(game.sourceA, next, teamsById);
        const teamB = resolveTeamForSource(game.sourceB, next, teamsById);
        if (!teamA || !teamB) continue;
        const winner = pickWinner(teamA, teamB, state.chaos);
        next[game.id] = winner.id;
      }

      set({ picksByMatchup: next });
    },
    resetAll: () => set({ ...defaults })
  }))
);
