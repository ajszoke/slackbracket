"use client";

import { CHAOS_PRESETS, chaosLabel } from "@slackbracket/domain";

export function ChaosMeter({
  value,
  onChange,
  onPreset
}: {
  value: number;
  onChange: (value: number) => void;
  onPreset: (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => void;
}) {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Chaos Meter</h3>
        <strong>{chaosLabel(value)}</strong>
      </div>
      <p style={{ marginTop: 6, color: "var(--muted)" }}>Less mathy, more vibes: choose a feel and tune from there.</p>
      <input
        aria-label="Chaos meter"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%" }}
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {CHAOS_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset.id)}
            style={{
              borderRadius: 999,
              border: "1px solid #4a5a7d",
              background: Math.abs(value - preset.value) < 0.05 ? "var(--accent)" : "#1a2440",
              color: "#fff",
              padding: "0.3rem 0.6rem",
              cursor: "pointer"
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
