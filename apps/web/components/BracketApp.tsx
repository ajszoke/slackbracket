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
import { useEffect, useMemo, useState } from "react";

import { chaosToTemperatureLabel, computePulseMetrics, roundByRoundProbability } from "../lib/bracketStats";
import { useBracketStore } from "../lib/store";
import { buildGameTree, normalizeTeams, resolveTeamForSource, type GameNode } from "../lib/tournament";
import { useBracketLayout } from "../lib/useBracketLayout";

import { BracketShell } from "./bracket/BracketShell";
import { ChaosMeter } from "./ChaosMeter";
import { Footer } from "./Footer";
import { HowItWorks } from "./HowItWorks";
import { OddsPanel } from "./OddsPanel";
import { SocialSharePanel } from "./SocialSharePanel";
import { ToggleSwitch } from "./ToggleSwitch";
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
      const file = store.bracketType === "women" ? "bracket_women.json" : "bracket_men.json";
      const response = await fetch(`/data/${file}`);
      if (!response.ok) throw new Error("Failed loading teams");
      const payload = (await response.json()) as unknown[];
      return normalizeTeams(payload);
    }
  });

  // Live state: stub for static export (no server)
  const liveData: LivePayload = useMemo(() => ({ updatedAt: Date.now(), results: [] }), []);

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

  // Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem("slackbracket:theme") as "dark" | "light" | null;
    if (saved) store.setTheme(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("slackbracket:theme", store.theme);
    document.documentElement.setAttribute("data-theme", store.theme);
  }, [store.theme]);

  // Quality persistence
  useEffect(() => {
    const saved = localStorage.getItem("slackbracket:quality");
    if (saved && ["low", "medium", "high", "ultra"].includes(saved)) {
      store.setQuality(saved as "low" | "medium" | "high" | "ultra");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("slackbracket:quality", store.quality);
    document.documentElement.setAttribute("data-quality", store.quality);
  }, [store.quality]);

  // Tutorial: show on first visit or via ?tour URL param
  const [tourStep, setTourStep] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("tour") || !localStorage.getItem("slackbracket:tour-dismissed")) {
      store.setShowTour(true);
      setTourStep(0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTourNext = () => {
    const next = tourStep + 1;
    if (next >= 6) {
      handleTourDismiss();
    } else {
      setTourStep(next);
    }
  };
  const handleTourDismiss = () => {
    store.setShowTour(false);
    localStorage.setItem("slackbracket:tour-dismissed", "1");
  };

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

  // Pick source tally
  const userPickCount = Object.values(store.pickSourceByMatchup).filter((s) => s === "user").length;
  const aiPickCount = picksCount - userPickCount;

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
  }, [games, store.picksByMatchup, teamsById]);

  const humanOdds = useMemo(() => humanReadableOneIn(liveProbability), [liveProbability]);

  // Bracket Pulse metrics
  const pulseMetrics = useMemo(
    () => computePulseMetrics(store.picksByMatchup, store.pickSourceByMatchup, games, teamsById),
    [store.picksByMatchup, store.pickSourceByMatchup, games, teamsById]
  );

  // Temperature labels — centered percentile + confidence gating
  const temperatureLabels = useMemo(() => ({
    user: pulseMetrics.userWeight > 0
      ? chaosToTemperatureLabel(pulseMetrics.userPercentile, pulseMetrics.userPickCount, pulseMetrics.userZScore)
      : "Empty",
    ai: pulseMetrics.aiWeight > 0
      ? chaosToTemperatureLabel(pulseMetrics.aiPercentile, pulseMetrics.aiPickCount, pulseMetrics.aiZScore)
      : "Empty",
  }), [pulseMetrics]);

  // Round-by-round cumulative probability
  const roundOdds = useMemo(
    () => roundByRoundProbability(games, store.picksByMatchup, teamsById, 0.5),
    [games, store.picksByMatchup, teamsById]
  );

  // Orb hue: centered percentile → chalk=cyan(190), neutral=purple(265), spicy=red(340)
  const tempToHue = (t: number) => 190 + t * 150; // 0→190, 0.5→265, 1→340
  const userHue = tempToHue(pulseMetrics.userPercentile);
  const aiHue = tempToHue(pulseMetrics.aiPercentile);

  // Per-orb pulse speed: each orb breathes at its own frequency
  const userPulseSpeed = 8 - pulseMetrics.userChaos * 6; // 8s calm → 2s intense
  const aiPulseSpeed = 8 - pulseMetrics.aiChaos * 6;

  // Per-orb opacity range
  const userHasPicks = pulseMetrics.userWeight > 0;
  const aiHasPicks = pulseMetrics.aiWeight > 0;
  const userPulseLo = userHasPicks ? 0.1 + pulseMetrics.userChaos * 0.25 : 0.1;
  const userPulseHi = userHasPicks ? 0.18 + pulseMetrics.userChaos * 0.47 : 0.14;
  const aiPulseLo = aiHasPicks ? 0.1 + pulseMetrics.aiChaos * 0.25 : 0.1;
  const aiPulseHi = aiHasPicks ? 0.18 + pulseMetrics.aiChaos * 0.47 : 0.14;

  // Orb visibility: transparent when no picks from that source
  const userGlow = userHasPicks ? `hsl(${userHue}, 100%, 60%)` : "transparent";
  const aiGlow = aiHasPicks ? `hsl(${aiHue}, 100%, 60%)` : "transparent";
  const userSpread = userHasPicks ? `${Math.round(32 + pulseMetrics.userWeight * 88)}%` : "0%";
  const aiSpread = aiHasPicks ? `${Math.round(32 + pulseMetrics.aiWeight * 88)}%` : "0%";

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
    <div className="bracket-pulse-ambient" />
    <div
      className="bracket-pulse-user"
      style={{
        "--pulse-speed": `${userPulseSpeed}s`,
        "--pulse-lo": `${userPulseLo}`,
        "--pulse-hi": `${userPulseHi}`,
        "--user-glow": userGlow,
        "--user-spread": userSpread,
      } as React.CSSProperties}
    />
    <div
      className="bracket-pulse-ai"
      style={{
        "--pulse-speed": `${aiPulseSpeed}s`,
        "--pulse-lo": `${aiPulseLo}`,
        "--pulse-hi": `${aiPulseHi}`,
        "--ai-glow": aiGlow,
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ textDecoration: "none" }}>
            <h1 className="hero-title">Slackbracket <span className="hero-year">2026</span></h1>
          </a>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <ToggleSwitch
              checked={store.bracketType === "women"}
              onChange={(checked) => store.setBracketType(checked ? "women" : "men")}
              iconLeft={<span title="Men's bracket" style={{ fontWeight: 900, fontSize: "1.15rem", color: "#38bdf8", WebkitTextStroke: "1px #38bdf8" }}>♂</span>}
              iconRight={<span title="Women's bracket" style={{ fontWeight: 900, fontSize: "1.15rem", color: "#f472b6", WebkitTextStroke: "1px #f472b6" }}>♀</span>}
              ariaLabel="Toggle men's or women's bracket"
            />
            <ToggleSwitch
              checked={store.theme === "dark"}
              onChange={(checked) => store.setTheme(checked ? "dark" : "light")}
              iconLeft={<span>☀️</span>}
              iconRight={<span>🌙</span>}
              ariaLabel="Toggle light or dark mode"
            />
            <div style={{ display: "flex", gap: 4, marginLeft: 12, alignItems: "center" }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <progress value={completion} max={100} style={{ flex: 1, height: 4 }} />
          {picksCount > 0 && (
            <span style={{ fontSize: "0.65rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
              <span style={{ color: "var(--text)" }}>You: {userPickCount}</span>
              <> · <span style={{ opacity: 0.7 }}>AI: {aiPickCount}</span></>
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            alignItems: "stretch",
            marginBottom: 12
          }}
        >
          <div data-tour-target="chaos-meter" style={{ display: "flex", flexDirection: "column" }}><ChaosMeter value={store.chaos} onChange={store.setChaos} onPreset={store.setChaosPreset} onGenerate={generateBracket} /></div>
          <div data-tour-target="odds-panel" style={{ display: "flex", flexDirection: "column" }}><OddsPanel summary={humanOdds} filled={picksCount} temperature={temperatureLabels} roundOdds={roundOdds} /></div>
          <SocialSharePanel shareUrl={shareUrl} oneIn={humanOdds.display} filled={picksCount} />
        </div>
      </header>

      {/* Bracket */}
      <BracketShell
        layout={bracketLayout}
        picksByMatchup={store.picksByMatchup}
        pickSourceByMatchup={store.pickSourceByMatchup}
        lockedByMatchup={lockedMap}
        teamsById={teamsById}
        onPick={(matchupId, teamId) => store.pick(matchupId, teamId, games)}
        selectedRegion={store.selectedRegion}
        onRegionChange={store.setRegion}
      />
      <HowItWorks />
      <Footer />
      <TutorialOverlay
        step={tourStep}
        dismissed={!store.showTour}
        onNext={handleTourNext}
        onDismiss={handleTourDismiss}
      />
    </main>
    </div>
  );
}
