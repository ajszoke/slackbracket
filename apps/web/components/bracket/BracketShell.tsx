"use client";

import type { Team } from "@slackbracket/domain";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { fetchLogoForTeam, teamInitials } from "../../lib/logos";
import type { GameNode } from "../../lib/tournament";
import { resolveTeamForSource } from "../../lib/tournament";
import type { BracketLayout } from "../../lib/useBracketLayout";

import { BracketMatchup } from "./BracketMatchup";
import { RegionBracket } from "./RegionBracket";

import "./bracket.css";

type Props = {
  layout: BracketLayout;
  picksByMatchup: Record<string, string>;
  pickSourceByMatchup: Record<string, "user" | "auto">;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
  selectedRegion: "East" | "West" | "South" | "Midwest" | "FinalFour";
  onRegionChange: (region: "East" | "West" | "South" | "Midwest" | "FinalFour") => void;
};

const REGION_TABS = [
  { key: "East" as const, label: "East", color: "var(--region-east)" },
  { key: "West" as const, label: "West", color: "var(--region-west)" },
  { key: "South" as const, label: "South", color: "var(--region-south)" },
  { key: "Midwest" as const, label: "Midwest", color: "var(--region-midwest)" },
  { key: "FinalFour" as const, label: "Final Four", color: "var(--region-finalfour)" }
];

const REGION_COLORS: Record<string, string> = {
  East: "var(--region-east)",
  West: "var(--region-west)",
  South: "var(--region-south)",
  Midwest: "var(--region-midwest)"
};

function FFGame({
  game,
  picksByMatchup,
  pickSourceByMatchup,
  lockedByMatchup,
  teamsById,
  onPick,
  isChampionship,
}: {
  game: GameNode | null;
  picksByMatchup: Record<string, string>;
  pickSourceByMatchup: Record<string, "user" | "auto">;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
  isChampionship?: boolean;
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
      pickSource={picksByMatchup[game.id] ? pickSourceByMatchup[game.id] : undefined}
      onPick={(teamId) => onPick(game.id, teamId)}
      regionColor="var(--region-finalfour)"
      isChampionship={isChampionship}
    />
  );
}

function ChampionBadge({ team, size = 220 }: { team: Team; size?: number }) {
  const [logo, setLogo] = useState<string | null>(team.logoUrl ?? null);
  const [currentId, setCurrentId] = useState(team.id);

  if (team.id !== currentId) {
    setCurrentId(team.id);
    setLogo(team.logoUrl ?? null);
  }

  useEffect(() => {
    let mounted = true;
    if (!logo) {
      fetchLogoForTeam(team).then((url) => { if (mounted) setLogo(url); });
    }
    return () => { mounted = false; };
  }, [team, logo]);

  return (
    <motion.div
      key={team.id}
      initial={{ scale: 0.5, opacity: 0, x: "-50%", y: "-50%", rotate: 15 }}
      animate={{ scale: 1, opacity: 0.13, x: "-50%", y: "-50%", rotate: 15 }}
      exit={{ scale: 0.5, opacity: 0, x: "-50%", y: "-50%", rotate: 15 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(1.5px)",
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={size} height={size} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
      ) : (
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: size * 0.33,
          fontWeight: 900,
          color: "var(--region-finalfour)",
          background: "radial-gradient(circle, color-mix(in srgb, var(--region-finalfour) 15%, transparent 85%), transparent 70%)",
        }}>
          {teamInitials(team.team)}
        </div>
      )}
    </motion.div>
  );
}

export function BracketShell(props: Props) {
  const { layout, picksByMatchup, pickSourceByMatchup, lockedByMatchup, teamsById, onPick, selectedRegion, onRegionChange } = props;

  const regionProps = (region: "East" | "West" | "South" | "Midwest", direction: "ltr" | "rtl") => ({
    rounds: layout.regions[region],
    direction,
    regionColor: REGION_COLORS[region],
    regionLabel: region,
    picksByMatchup,
    pickSourceByMatchup,
    lockedByMatchup,
    teamsById,
    onPick
  });

  const ff = layout.finalFour;
  const ffCellProps = { picksByMatchup, pickSourceByMatchup, lockedByMatchup, teamsById, onPick };
  const champWinnerId = ff.championship ? picksByMatchup[ff.championship.id] : undefined;
  const champWinner = champWinnerId ? teamsById[champWinnerId] : undefined;

  return (
    <div className="bracket-shell">
      {/* Desktop: Left regions | FF center | Right regions */}
      <div className="bracket-full">
        {/* Left column: East + South */}
        <div className="bracket-col bracket-col--left">
          <div className="bracket-region-section">
            <div className="bracket-region-header" style={{ "--region-hdr-color": "var(--region-east)" } as React.CSSProperties}>East</div>
            <RegionBracket {...regionProps("East", "ltr")} />
          </div>
          <div className="bracket-region-section">
            <div className="bracket-region-header" style={{ "--region-hdr-color": "var(--region-south)" } as React.CSSProperties}>South</div>
            <RegionBracket {...regionProps("South", "ltr")} />
          </div>
        </div>

        {/* Center: FF semis + championship.
            Each ff-section mirrors a region-section (flex:1 + header spacer + round column).
            Phantom div takes the opposite flex:1 slot, pushing the real game
            to the 75% (top) or 25% (bottom) position — matching R3 game alignment. */}
        <div className="bracket-center" style={{ "--region-color": "var(--region-finalfour)" } as React.CSSProperties}>
          {/* Top section — semi1 aligns with lower R3 game of East/West */}
          <div className="bracket-ff-section">
            <div className="bracket-region-header" style={{ visibility: "hidden" }} aria-hidden="true">&nbsp;</div>
            <div className="bracket-ff-round">
              <div className="bracket-ff-phantom" />
              <div className="bracket-ff-slot">
                <span className="bracket-ff-label">Final Four</span>
                <FFGame game={ff.semi1} {...ffCellProps} />
              </div>
            </div>
          </div>

          {/* Bottom section — semi2 aligns with upper R3 game of South/Midwest */}
          <div className="bracket-ff-section">
            <div className="bracket-region-header" style={{ visibility: "hidden" }} aria-hidden="true">&nbsp;</div>
            <div className="bracket-ff-round">
              <div className="bracket-ff-slot">
                <span className="bracket-ff-label">Final Four</span>
                <FFGame game={ff.semi2} {...ffCellProps} />
              </div>
              <div className="bracket-ff-phantom" />
            </div>
          </div>

          {/* Championship — absolutely centered between the two sections */}
          <div className="bracket-ff-slot bracket-ff-slot--championship">
            <span className="bracket-ff-label">Championship</span>
            <FFGame game={ff.championship} {...ffCellProps} isChampionship />
            {/* Huge winner badge pinned to championship card */}
            <AnimatePresence>
              {champWinner && <ChampionBadge team={champWinner} size={440} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: West + Midwest */}
        <div className="bracket-col bracket-col--right">
          <div className="bracket-region-section">
            <div className="bracket-region-header" style={{ "--region-hdr-color": "var(--region-west)" } as React.CSSProperties}>West</div>
            <RegionBracket {...regionProps("West", "rtl")} />
          </div>
          <div className="bracket-region-section">
            <div className="bracket-region-header" style={{ "--region-hdr-color": "var(--region-midwest)" } as React.CSSProperties}>Midwest</div>
            <RegionBracket {...regionProps("Midwest", "rtl")} />
          </div>
        </div>
      </div>

      {/* Mobile: Region tabs + single region */}
      <nav className="bracket-region-tabs">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`bracket-region-tab ${selectedRegion === tab.key ? "bracket-region-tab--active" : ""}`}
            style={{ "--tab-color": tab.color } as React.CSSProperties}
            onClick={() => onRegionChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile: Selected region bracket */}
      <div className="bracket-mobile-region">
        {selectedRegion === "FinalFour" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem" }}>
            <div className="bracket-region-header" style={{ "--region-hdr-color": "var(--region-finalfour)", textAlign: "center" } as React.CSSProperties}>
              Final Four
            </div>
            <FFGame game={ff.semi1} {...ffCellProps} />
            <FFGame game={ff.semi2} {...ffCellProps} />
            <span className="bracket-championship__label">Championship</span>
            <div style={{ position: "relative" }}>
              <FFGame game={ff.championship} {...ffCellProps} isChampionship />
              <AnimatePresence>
                {champWinner && <ChampionBadge team={champWinner} size={280} />}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <RegionBracket {...regionProps(selectedRegion, "ltr")} />
        )}
      </div>
    </div>
  );
}
