"use client";

import { humanReadableOneIn, type HumanReadableOdds } from "@slackbracket/domain";
import { AnimatePresence, motion } from "framer-motion";

import type { RoundProbability } from "../lib/bracketStats";

const TEMP_COLORS: Record<string, string> = {
  // Low confidence — muted tones (uncertain)
  "Early Chalk...": "var(--muted)",
  "Leaning Safe...": "var(--muted)",
  "Feeling It Out...": "var(--muted)",
  "A Lil' Spicy?": "#b89850",
  "Going Rogue?": "#c47a40",
  // Mid + High confidence — vivid
  "Chalk City!": "var(--good)",
  "Playing It Safe!": "var(--good)",
  "Chalk-ish!": "#10b981",
  "By the Book!": "var(--good)",
  "Mild!": "#10b981",
  "True Odds!": "var(--muted)",
  "A Lil' Spicy!": "var(--warn)",
  "Spicy!": "var(--warn)",
  "Hot!": "#f97316",
  "Scorching!": "#ef4444",
  "Unhinged!": "var(--danger)",
};

function tempColor(label: string): string {
  return TEMP_COLORS[label] ?? "var(--muted)";
}

const BLOCK_STYLE: React.CSSProperties = {
  position: "absolute",
  fontSize: "3.2rem",
  fontWeight: 900,
  fontFamily: "'Impact', 'Arial Black', sans-serif",
  opacity: 0.12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  pointerEvents: "none",
  lineHeight: 1,
};

function TempLabel({
  label,
  side,
}: {
  label: string;
  side: "left" | "right";
}) {
  const rotate = side === "left" ? -20 : 20;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={label}
        initial={{ scale: 0, rotate: rotate - 10 }}
        animate={{ scale: 1, rotate }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{
          position: "absolute",
          [side]: 0,
          top: 2,
          color: tempColor(label),
          fontSize: "0.72rem",
          fontWeight: 800,
          transformOrigin: "center center",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </motion.span>
    </AnimatePresence>
  );
}

export function OddsPanel({
  summary,
  filled,
  temperature,
  roundOdds,
  realityTemperature,
}: {
  summary: HumanReadableOdds;
  filled: number;
  temperature?: { user: string; ai: string };
  roundOdds?: RoundProbability[];
  realityTemperature?: string | null;
}) {
  const isEmpty = filled === 0;
  const showScientific =
    !isEmpty && summary.scientificHtml !== summary.display;
  const activeRounds = roundOdds?.filter((r) => r.cumulative < 1) ?? [];
  const hasUser = temperature && temperature.user !== "Empty";
  const hasAi = temperature && temperature.ai !== "Empty";

  return (
    <section
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        flex: 1,
      }}
    >
      <h3 style={{ margin: 0, flexShrink: 0 }}>Bracket Odds</h3>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflowWrap: "break-word" }}>

        {/* Temperature labels — tilted, positioned around the odds number */}
        {(hasUser || hasAi) && (
          <div style={{ position: "relative", height: "1.6rem" }}>
            {/* User side */}
            {hasUser && (
              <>
                {hasAi && <span style={{ ...BLOCK_STYLE, left: -4, top: -8, color: tempColor(temperature.user) }}>YOU</span>}
                <TempLabel label={temperature.user} side="left" />
              </>
            )}

            {/* AI side */}
            {hasAi && (
              <>
                {hasUser && <span style={{ ...BLOCK_STYLE, right: -4, top: -8, color: tempColor(temperature.ai) }}>AI</span>}
                {/* When AI-only, show centered; when both, show right */}
                <TempLabel label={temperature.ai} side={hasUser ? "right" : "left"} />
                {!hasUser && <span style={{ ...BLOCK_STYLE, left: -4, top: -8, color: tempColor(temperature.ai) }}>AI</span>}
              </>
            )}
          </div>
        )}

        {/* Reality temperature — how spicy the actual tournament has been */}
        {realityTemperature && (
          <div style={{
            textAlign: "center",
            fontSize: "0.6rem",
            fontWeight: 700,
            color: tempColor(realityTemperature),
            letterSpacing: "0.05em",
            marginBottom: 2,
          }}>
            Reality: {realityTemperature}
          </div>
        )}

        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {isEmpty ? "1 in 1" : summary.display}
        </div>
        <div
          style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 4 }}
        >
          {isEmpty ? (
            "This is definitely, 100%, a bracket"
          ) : showScientific ? (
            <span>( <span dangerouslySetInnerHTML={{ __html: summary.scientificHtml }} /> )</span>
          ) : null}
        </div>

        {/* Round-by-round breakdown */}
        {activeRounds.length > 0 && (
          <div style={{ marginTop: 8, textAlign: "left", fontSize: "0.7rem", color: "var(--muted)" }}>
            <div style={{ fontSize: "0.6rem", opacity: 0.7, marginBottom: 3, fontStyle: "italic" }}>
              Odds of being exactly right through each round
            </div>
            {activeRounds.map((r) => {
              const odds = humanReadableOneIn(r.cumulative);
              return (
                <div key={r.round} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                  <span style={{ fontWeight: 600, minWidth: 52 }}>{r.label}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{odds.display}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
