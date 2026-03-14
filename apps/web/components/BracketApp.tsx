"use client";

import {
  decodeSharePayload,
  encodeSharePayload,
  lockCompletedGames,
  oneIn,
  summarizeOdds,
  type Matchup,
  type Team,
  winProbability
} from "@slackbracket/domain";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import { useBracketStore } from "../lib/store";
import {
  buildGameTree,
  normalizeTeams,
  resolveTeamForSource,
  type GameNode
} from "../lib/tournament";
import { useBracketLayout } from "../lib/useBracketLayout";

import { BracketShell } from "./bracket/BracketShell";
import { ChaosMeter } from "./ChaosMeter";
import { OddsPanel } from "./OddsPanel";
import { SocialSharePanel } from "./SocialSharePanel";
import { TutorialOverlay } from "./TutorialOverlay";

type LivePayload = {
  updatedAt: number;
  results: Array<{ matchupId: string; winnerId: string; status: "live" | "final" }>;
};

function asMatchups(nodes: GameNode[], lockedByMatchup: Record<string, string>): Matchup[] {
  return nodes.map((node) => ({
    id: node.id,
    round: node.round,
    region: node.region,
    teamAId: node.sourceA.type === "team" ? node.sourceA.teamId : null,
    teamBId: node.sourceB.type === "team" ? node.sourceB.teamId : null,
    status: lockedByMatchup[node.id] ? "final" : "upcoming",
    lockedWinnerId: lockedByMatchup[node.id] ?? null
  }));
}

export function BracketApp() {
  const store = useBracketStore();
  const setLocked = useBracketStore((state) => state.setLocked);
  const hydratePicks = useBracketStore((state) => state.hydratePicks);
  const temporal = useBracketStore.temporal.getState();

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["teams", store.bracketType],
    queryFn: async () => {
      const response = await fetch(`/api/bracket-data?bracket=${store.bracketType}`);
      if (!response.ok) throw new Error("Failed loading teams");
      const payload = (await response.json()) as unknown[];
      return normalizeTeams(payload);
    }
  });

  const { data: liveData } = useQuery<LivePayload>({
    queryKey: ["live-state"],
    queryFn: async () => {
      const response = await fetch("/api/live-state");
      if (!response.ok) return { updatedAt: Date.now(), results: [] };
      return (await response.json()) as LivePayload;
    },
    refetchInterval: 30_000
  });

  const teams = useMemo(() => teamData ?? [], [teamData]);
  const teamsById = useMemo<Record<string, Team>>(
    () => Object.fromEntries(teams.map((team) => [team.id, team])),
    [teams]
  );
  const games = useMemo(() => buildGameTree(teams), [teams]);
  const bracketLayout = useBracketLayout(games);

  useEffect(() => {
    const liveResults = liveData?.results ?? [];
    const locked = Object.fromEntries(
      liveResults.filter((entry) => entry.status === "final").map((entry) => [entry.matchupId, entry.winnerId])
    );
    setLocked(locked);
  }, [liveData, setLocked]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("b");
    if (!encoded) return;
    const decoded = decodeSharePayload<Record<string, string>>(encoded);
    if (decoded) {
      hydratePicks(decoded);
    }
  }, [hydratePicks]);

  useEffect(() => {
    const key = `slackbracket:${store.bracketType}:picks`;
    localStorage.setItem(key, JSON.stringify(store.picksByMatchup));
  }, [store.picksByMatchup, store.bracketType]);

  useEffect(() => {
    const key = `slackbracket:${store.bracketType}:picks`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      hydratePicks(parsed);
    } catch {
      // ignore malformed cache
    }
  }, [store.bracketType, hydratePicks]);

  const resolvedGames = useMemo(
    () =>
      lockCompletedGames(
        asMatchups(games, store.lockedByMatchup),
        (liveData?.results ?? []).map((entry) => ({
          matchupId: entry.matchupId,
          winnerId: entry.winnerId,
          status: entry.status
        }))
      ),
    [games, store.lockedByMatchup, liveData]
  );

  const lockedMap = useMemo(
    () => Object.fromEntries(resolvedGames.filter((g) => g.lockedWinnerId).map((g) => [g.id, g.lockedWinnerId!])),
    [resolvedGames]
  );

  const picksCount = Object.keys(store.picksByMatchup).length;
  const totalGames = 63;
  const completion = Math.min(100, Math.round((picksCount / totalGames) * 100));

  const pickedProbabilityByGame = useCallback(
    (game: GameNode): number => {
      const selectedTeamId = store.picksByMatchup[game.id];
      if (!selectedTeamId) return 1;
      const teamA = resolveTeamForSource(game.sourceA, store.picksByMatchup, teamsById);
      const teamB = resolveTeamForSource(game.sourceB, store.picksByMatchup, teamsById);
      if (!teamA || !teamB) return 1;
      const pA = winProbability(teamA, teamB, store.chaos);
      if (selectedTeamId === teamA.id) return pA;
      if (selectedTeamId === teamB.id) return 1 - pA;
      return 1e-12;
    },
    [store.picksByMatchup, teamsById, store.chaos]
  );

  const mostLikelyProbability = useMemo(() => {
    let probability = 1;
    for (const game of games) {
      const teamA = resolveTeamForSource(game.sourceA, store.picksByMatchup, teamsById);
      const teamB = resolveTeamForSource(game.sourceB, store.picksByMatchup, teamsById);
      if (!teamA || !teamB) {
        probability *= 0.5;
        continue;
      }
      const p = winProbability(teamA, teamB, store.chaos);
      probability *= Math.max(p, 1 - p);
    }
    return probability;
  }, [games, store.picksByMatchup, teamsById, store.chaos]);

  const leastLikelyProbability = useMemo(() => {
    let probability = 1;
    for (const game of games) {
      const teamA = resolveTeamForSource(game.sourceA, store.picksByMatchup, teamsById);
      const teamB = resolveTeamForSource(game.sourceB, store.picksByMatchup, teamsById);
      if (!teamA || !teamB) {
        probability *= 0.5;
        continue;
      }
      const p = winProbability(teamA, teamB, store.chaos);
      probability *= Math.min(p, 1 - p);
    }
    return probability;
  }, [games, store.picksByMatchup, teamsById, store.chaos]);

  const oddsSummary = useMemo(
    () =>
      summarizeOdds({
        picksByMatchup: Object.fromEntries(games.map((game) => [game.id, store.picksByMatchup[game.id] ?? ""])),
        matchups: asMatchups(games, store.lockedByMatchup),
        teamsById,
        chaos: store.chaos,
        mostLikelyProbability,
        leastLikelyProbability
      }),
    [store.picksByMatchup, games, teamsById, store.chaos, store.lockedByMatchup, mostLikelyProbability, leastLikelyProbability]
  );

  const liveProbability = useMemo(() => {
    let probability = 1;
    for (const game of games) {
      probability *= pickedProbabilityByGame(game);
    }
    return probability;
  }, [games, pickedProbabilityByGame]);

  const sharePayload = encodeSharePayload(store.picksByMatchup);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}?b=${sharePayload}`;

  const quickGenerate = () => {
    store.setMode("quick");
    store.autoFillRemaining(games, teamsById);
  };

  if (isLoading) {
    return <main style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Loading bracket data...</main>;
  }

  return (
    <main>
      {/* Hero Header — controls consolidated above the bracket */}
      <header style={{ padding: "1rem 1rem 0", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.05em" }}>
            Slackbracket
          </h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={() => store.setBracketType("men")}
              className={store.bracketType === "men" ? "btn-active" : "btn-muted"}
            >
              Men
            </button>
            <button
              onClick={() => store.setBracketType("women")}
              className={store.bracketType === "women" ? "btn-active" : "btn-muted"}
            >
              Women
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
          <button onClick={quickGenerate}>Quick Generate</button>
          <button onClick={() => store.autoFillRemaining(games, teamsById)}>Fill the Rest</button>
          <button onClick={() => temporal.undo()}>Undo</button>
          <button onClick={() => temporal.redo()}>Redo</button>
          <button onClick={store.resetAll}>Reset</button>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem", marginLeft: "auto" }}>
            {picksCount}/{totalGames} picks
          </span>
        </div>

        <progress value={completion} max={100} style={{ width: "100%", height: 4, marginBottom: 8 }} />

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: 12 }}>
          <ChaosMeter value={store.chaos} onChange={store.setChaos} onPreset={store.setChaosPreset} />
          <OddsPanel
            summary={{ ...oddsSummary, exactProbability: liveProbability, oneIn: oneIn(liveProbability) }}
            filled={picksCount}
            total={totalGames}
            mostLikelyProbability={mostLikelyProbability}
            leastLikelyProbability={leastLikelyProbability}
          />
          <SocialSharePanel shareUrl={shareUrl} oneIn={oneIn(oddsSummary.exactProbability)} />
        </div>
      </header>

      {/* Bracket */}
      <BracketShell
        layout={bracketLayout}
        picksByMatchup={store.picksByMatchup}
        lockedByMatchup={lockedMap}
        teamsById={teamsById}
        onPick={(matchupId, teamId) => store.pick(matchupId, teamId)}
        selectedRegion={store.selectedRegion}
        onRegionChange={store.setRegion}
      />

      <TutorialOverlay
        step={store.tutorialStep}
        dismissed={store.tutorialDismissed}
        onNext={store.nextTutorial}
        onDismiss={store.dismissTutorial}
      />
    </main>
  );
}
