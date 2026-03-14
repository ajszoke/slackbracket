"use client";

import type { Team } from "@slackbracket/domain";

import type { BracketLayout } from "../../lib/useBracketLayout";

import { FinalFourBracket } from "./FinalFourBracket";
import { RegionBracket } from "./RegionBracket";

import "./bracket.css";

type Props = {
  layout: BracketLayout;
  picksByMatchup: Record<string, string>;
  lockedByMatchup: Record<string, string>;
  teamsById: Record<string, Team>;
  onPick: (matchupId: string, teamId: string) => void;
  /** For mobile: which region tab is selected */
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

const ffProps = (props: Props) => ({
  semi1: props.layout.finalFour.semi1,
  semi2: props.layout.finalFour.semi2,
  championship: props.layout.finalFour.championship,
  picksByMatchup: props.picksByMatchup,
  lockedByMatchup: props.lockedByMatchup,
  teamsById: props.teamsById,
  onPick: props.onPick
});

export function BracketShell(props: Props) {
  const { layout, picksByMatchup, lockedByMatchup, teamsById, onPick, selectedRegion, onRegionChange } = props;

  const regionProps = (region: "East" | "West" | "South" | "Midwest", direction: "ltr" | "rtl") => ({
    rounds: layout.regions[region],
    direction,
    regionColor: REGION_COLORS[region],
    regionLabel: region,
    picksByMatchup,
    lockedByMatchup,
    teamsById,
    onPick
  });

  return (
    <div className="bracket-shell">
      {/* Desktop: Full bracket */}
      <div className="bracket-full">
        {/* Top half: East (LTR) → FF Semi 1 + Champ ← West (RTL) */}
        <div className="bracket-half">
          <RegionBracket {...regionProps("East", "ltr")} />
          <FinalFourBracket {...ffProps(props)} />
          <RegionBracket {...regionProps("West", "rtl")} />
        </div>

        {/* Bottom half: South (LTR) → FF Semi 2 ← Midwest (RTL) */}
        <div className="bracket-half">
          <RegionBracket {...regionProps("South", "ltr")} />
          {/* Spacer to align with center column */}
          <div className="bracket-center" style={{ visibility: "hidden" }}>
            <div style={{ minWidth: 160 }} />
          </div>
          <RegionBracket {...regionProps("Midwest", "rtl")} />
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
          <FinalFourBracket {...ffProps(props)} />
        ) : (
          <RegionBracket
            {...regionProps(selectedRegion, "ltr")}
          />
        )}
      </div>
    </div>
  );
}
