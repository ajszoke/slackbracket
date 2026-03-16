"use client";

import {
  decodeSharePayload,
  encodeSharePayload,
  humanReadableOneIn,
  lockCompletedGames,
  type Matchup,
  type Team,
  winProbability
} from "@slackbracket/domain";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { computePulseMetrics } from "../lib/bracketStats";
import { useBracketStore } from "../lib/store";
import { buildGameTree, normalizeTeams, resolveTeamForSource, type GameNode } from "../lib/tournament";
import { useBracketLayout } from "../lib/useBracketLayout";

import { BracketShell } from "./bracket/BracketShell";
import { ChaosMeter } from "./ChaosMeter";
import { OddsPanel } from "./OddsPanel";
import { SocialSharePanel } from "./SocialSharePanel";

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

  // Live bracket probability
  const liveProbability = useMemo(() => {
    let probability = 1;
    for (const game of games) {
      const selectedTeamId = store.picksByMatchup[game.id];
      if (!selectedTeamId) continue;
      const teamA = resolveTeamForSource(game.sourceA, store.picksByMatchup, teamsById);
      const teamB = resolveTeamForSource(game.sourceB, store.picksByMatchup, teamsById);
      if (!teamA || !teamB) continue;
      // Always use pure ELO probability (chaos=0.5 = true odds) for bracket odds —
      // the odds panel shows real-world likelihood, not chaos-modified probability
      const pA = winProbability(teamA, teamB, 0.5);
      const p = selectedTeamId === teamA.id ? pA : selectedTeamId === teamB.id ? 1 - pA : 1e-12;
      probability *= Math.max(p, 1e-12);
    }
    return probability;
  }, [games, store.picksByMatchup, teamsById, store.chaos]);

  const humanOdds = useMemo(() => humanReadableOneIn(liveProbability), [liveProbability]);

  // Bracket Pulse metrics
  const pulseMetrics = useMemo(
    () => computePulseMetrics(store.picksByMatchup, store.pickSourceByMatchup, games, teamsById),
    [store.picksByMatchup, store.pickSourceByMatchup, games, teamsById]
  );

  // Color temperature: 0 = cool (cyan 190), 1 = hot (red-magenta 340)
  // Path: cyan(190) → blue(240) → purple(280) → magenta(320) → red(340)
  // Going UP through the hue wheel avoids the green zone
  const tempToHue = (t: number) => 190 + t * 150; // 190 → 340
  const userHue = tempToHue(pulseMetrics.userTemp);
  const aiHue = tempToHue(pulseMetrics.aiTemp);

  // Orb visibility: transparent when no picks from that source
  const userGlow = pulseMetrics.userWeight > 0 ? `hsl(${userHue}, 100%, 60%)` : "transparent";
  const aiGlow = pulseMetrics.aiWeight > 0 ? `hsl(${aiHue}, 100%, 60%)` : "transparent";
  const userSpread =
    pulseMetrics.userWeight > 0 ? `${Math.round(20 + pulseMetrics.userWeight * 55)}%` : "0%";
  const aiSpread =
    pulseMetrics.aiWeight > 0 ? `${Math.round(20 + pulseMetrics.aiWeight * 55)}%` : "0%";

  const sharePayload = encodeSharePayload(store.picksByMatchup);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}?b=${sharePayload}`;

  const generateBracket = () => {
    store.autoFillRemaining(games, teamsById);
  };

  if (isLoading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Loading bracket data...</main>
    );
  }

  return (
    <div className="app-wrapper">
    <div
      className="bracket-pulse"
      style={{
        "--pulse-speed": `${pulseMetrics.pulseSpeed}s`,
        "--pulse-lo": `${pulseMetrics.pulseLo}`,
        "--pulse-hi": `${pulseMetrics.pulseHi}`,
        "--user-glow": userGlow,
        "--ai-glow": aiGlow,
        "--user-spread": userSpread,
        "--ai-spread": aiSpread,
      } as React.CSSProperties}
    />
    <main style={{ position: "relative", zIndex: 1 }}>
      {/* Hero Header */}
      <header style={{ padding: "1rem 1rem 0", maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 8
          }}
        >
          <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 800, letterSpacing: "0.06em" }}>Slackbracket</h1>
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
            <div style={{ display: "flex", gap: 4, marginLeft: 8, alignItems: "center" }}>
              <button className="btn-ghost" onClick={() => temporal.undo()}>
                Undo
              </button>
              <button className="btn-ghost" onClick={() => temporal.redo()}>
                Redo
              </button>
              <button className="btn-ghost" onClick={store.resetAll}>
                Reset
              </button>
            </div>
          </div>
        </div>

        <progress value={completion} max={100} style={{ width: "100%", height: 4, marginBottom: 8 }} />

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            alignItems: "stretch",
            marginBottom: 12
          }}
        >
          <ChaosMeter value={store.chaos} onChange={store.setChaos} onPreset={store.setChaosPreset} onGenerate={generateBracket} />
          <OddsPanel summary={humanOdds} filled={picksCount} />
          <SocialSharePanel shareUrl={shareUrl} oneIn={humanOdds.display} />
        </div>
      </header>

      {/* Bracket */}
      <BracketShell
        layout={bracketLayout}
        picksByMatchup={store.picksByMatchup}
        pickSourceByMatchup={store.pickSourceByMatchup}
        lockedByMatchup={lockedMap}
        teamsById={teamsById}
        onPick={(matchupId, teamId) => store.pick(matchupId, teamId)}
        selectedRegion={store.selectedRegion}
        onRegionChange={store.setRegion}
      />
    </main>
    </div>
  );
}
