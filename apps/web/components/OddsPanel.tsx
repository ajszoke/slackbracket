"use client";

import type { HumanReadableOdds } from "@slackbracket/domain";

export function OddsPanel({
  summary,
  filled,
}: {
  summary: HumanReadableOdds;
  filled: number;
}) {
  const isEmpty = filled === 0;
  const showScientific =
    !isEmpty && summary.scientificHtml !== summary.display;

  return (
    <section
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <h3 style={{ margin: 0, flexShrink: 0 }}>Bracket Odds</h3>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflowWrap: "break-word" }}>
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
            <span dangerouslySetInnerHTML={{ __html: summary.scientificHtml }} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
