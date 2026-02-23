"use client";

import type { BracketOddsSummary } from "@slackbracket/domain";
import { oneIn } from "@slackbracket/domain";

export function OddsPanel({
  summary,
  filled,
  total,
  mostLikelyProbability,
  leastLikelyProbability
}: {
  summary: BracketOddsSummary;
  filled: number;
  total: number;
  mostLikelyProbability: number;
  leastLikelyProbability: number;
}) {
  const complete = filled === total;
  const exponentReadable = summary.exponentApprox.replace("e-", " x10^-");

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>Bracket Odds</h3>
      <p style={{ color: "var(--muted)" }}>
        {complete ? "Exact odds for your fully filled bracket." : "Live projected odds as you keep filling picks."}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <strong>{summary.oneIn}</strong>
          <div style={{ color: "var(--muted)" }}>({exponentReadable})</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="card">
            <small style={{ color: "var(--muted)" }}>Most likely bracket</small>
            <div>{oneIn(mostLikelyProbability)}</div>
          </div>
          <div className="card">
            <small style={{ color: "var(--muted)" }}>Least likely bracket</small>
            <div>{oneIn(leastLikelyProbability)}</div>
          </div>
        </div>
        <small style={{ color: "var(--muted)" }}>
          Your bracket is {summary.relativeToMostLikely.toExponential(2)}x the most likely baseline and{" "}
          {summary.relativeToLeastLikely.toExponential(2)}x the least likely baseline.
        </small>
      </div>
    </section>
  );
}
