"use client";

import {
  decodeSharePayload,
  humanReadableOneIn,
  lockCompletedGames,
  type Matchup,
  type Team,
  winProbability
} from "@slackbracket/domain";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { chaosToTemperatureLabel, computePulseMetrics, roundByRoundProbability } from "../lib/bracketStats";
import { decodeCompact, encodeCompact, isCompactPayload } from "../lib/shareCompact";
import { useBracketStore } from "../lib/store";
import { track } from "../lib/telemetry";
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
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const response = await fetch(`${basePath}/data/${file}`);
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

  // Share URL takes priority over localStorage — ref avoids batching race
  const loadedFromShare = useRef(false);

  useEffect(() => {
    if (games.length === 0) return; // wait for game tree
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("b");
    if (!encoded) return;

    // v2 compact format (26 bytes) or v1 JSON format
    if (isCompactPayload(encoded)) {
      const result = decodeCompact(encoded, games);
      if (result) {
        loadedFromShare.current = true;
        store.setBracketType(result.bracketType);
        store.setChaos(result.chaos);
        hydratePicks(result.picks, result.sources);
      }
    } else {
      const decoded = decodeSharePayload<Record<string, string>>(encoded);
      if (decoded) {
        loadedFromShare.current = true;
        hydratePicks(decoded);
      }
    }
  }, [hydratePicks, games]); // eslint-disable-line react-hooks/exhaustive-deps

  // Offer to restore picks from localStorage (if any exist and no share URL)
  const [showRestore, setShowRestore] = useState(false);
  const savedPicksRef = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    if (loadedFromShare.current) return;
    const key = `slackbracket:${store.bracketType}:picks`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (Object.keys(parsed).length > 0) {
        savedPicksRef.current = parsed;
        setShowRestore(true);
      }
    } catch {
      // ignore malformed cache
    }
  }, [store.bracketType, hydratePicks]);

  const handleRestore = () => {
    if (savedPicksRef.current) hydratePicks(savedPicksRef.current);
    setShowRestore(false);
  };
  const handleStartFresh = () => {
    const key = `slackbracket:${store.bracketType}:picks`;
    localStorage.removeItem(key);
    setShowRestore(false);
  };

  // Persist picks to localStorage as user works
  useEffect(() => {
    if (Object.keys(store.picksByMatchup).length > 0) {
      const key = `slackbracket:${store.bracketType}:picks`;
      localStorage.setItem(key, JSON.stringify(store.picksByMatchup));
    }
  }, [store.picksByMatchup, store.bracketType]);

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

  // Telemetry: page view + session end
  useEffect(() => {
    track("page_view", { bracketType: store.bracketType });

    const handleVisChange = () => {
      if (document.visibilityState === "hidden") {
        const s = useBracketStore.getState();
        track("session_end", {
          totalPicks: Object.keys(s.picksByMatchup).length,
          userPicks: Object.values(s.pickSourceByMatchup).filter((v) => v === "user").length,
          chaos: s.chaos,
          bracketType: s.bracketType,
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);
    return () => document.removeEventListener("visibilitychange", handleVisChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tutorial: show on first visit or via ?tour, skip if loading shared bracket or restoring
  const [tourStep, setTourStep] = useState(0);
  useEffect(() => {
    if (showRestore) return; // wait for restore decision
    const params = new URLSearchParams(window.location.search);
    if (params.has("tour")) {
      store.setShowTour(true);
      setTourStep(0);
    } else if (!params.has("b") && !localStorage.getItem("slackbracket:tour-dismissed")) {
      store.setShowTour(true);
      setTourStep(0);
    }
  }, [showRestore]); // eslint-disable-line react-hooks/exhaustive-deps

  const launchTour = () => {
    store.setShowTour(true);
    setTourStep(0);
  };

  const handleTourNext = () => {
    track("tour_step", { step: tourStep, action: "next" });
    const next = tourStep + 1;
    if (next >= 6) {
      handleTourDismiss();
    } else {
      setTourStep(next);
    }
  };
  const handleTourDismiss = () => {
    track("tour_step", { step: tourStep, action: "dismiss" });
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

  const sharePayload = encodeCompact(store.picksByMatchup, store.pickSourceByMatchup, games, store.bracketType, store.chaos);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}${basePath}?b=${sharePayload}`;

  const generateBracket = () => {
    const before = Object.keys(store.picksByMatchup).length;
    store.autoFillRemaining(games, teamsById);
    const after = Object.keys(useBracketStore.getState().picksByMatchup).length;
    track("generate", { chaos: store.chaos, bracketType: store.bracketType, filledBefore: before, filledAfter: after });
  };

  if (isLoading) {
    return (
      <main style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Loading bracket data...</main>
    );
  }

  return (
    <div className="app-wrapper">
    {/* Restore prompt — shown when localStorage has saved picks */}
    {showRestore && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      }}>
        <div className="card" style={{ maxWidth: 360, textAlign: "center", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Welcome Back</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            You have a bracket in progress. Pick up where you left off?
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-active" onClick={handleRestore} style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Continue
            </button>
            <button className="btn-ghost" onClick={handleStartFresh} style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )}
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
              onChange={(checked) => { const to = checked ? "women" : "men"; store.setBracketType(to); track("bracket_switch", { to }); }}
              iconLeft={<span title="Men's bracket" className="gender-icon gender-icon--male">♂</span>}
              iconRight={<span title="Women's bracket" className="gender-icon gender-icon--female">♀</span>}
              ariaLabel="Toggle men's or women's bracket"
            />
            <ToggleSwitch
              checked={store.theme === "dark"}
              onChange={(checked) => { const to = checked ? "dark" : "light"; store.setTheme(to); track("theme_toggle", { to }); }}
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
        onPick={(matchupId, teamId) => { store.pick(matchupId, teamId, games); track("pick", { matchupId, teamId, round: parseInt(matchupId.split("-")[0].slice(1), 10) }); }}
        selectedRegion={store.selectedRegion}
        onRegionChange={store.setRegion}
      />
      {/* Take the tour CTA — show when tour was skipped (share URL or dismissed) */}
      {!store.showTour && (
        <div style={{ textAlign: "center", margin: "1rem 0 0" }}>
          <button className="btn-ghost" onClick={launchTour} style={{ fontSize: "0.75rem" }}>
            New here? Take the tour
          </button>
        </div>
      )}
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
