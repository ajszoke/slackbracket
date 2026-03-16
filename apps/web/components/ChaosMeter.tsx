"use client";

import { CHAOS_PRESETS, chaosLabel } from "@slackbracket/domain";
import { useCallback } from "react";

let sickoTimeout: ReturnType<typeof setTimeout> | null = null;

function triggerSickoAnnouncement() {
  const html = document.documentElement;

  // Clean up any in-progress animation
  if (sickoTimeout) clearTimeout(sickoTimeout);
  document.querySelectorAll(".sicko-flash").forEach((el) => el.remove());

  // Force-restart animation: remove → reflow → re-add
  html.classList.remove("sicko-active");
  void (html as HTMLElement).offsetWidth;
  html.classList.add("sicko-active");

  // Red flash overlay
  const flash = document.createElement("div");
  flash.className = "sicko-flash";
  document.body.appendChild(flash);

  // Audio (best-effort — file may not exist yet)
  try {
    const audio = new Audio("/sicko-woomph.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {
    // no audio file yet — that's fine
  }

  // Cleanup after animation
  sickoTimeout = setTimeout(() => {
    html.classList.remove("sicko-active");
    flash.remove();
    sickoTimeout = null;
  }, 1000);
}

export function ChaosMeter({
  value,
  onChange,
  onPreset,
  onGenerate
}: {
  value: number;
  onChange: (value: number) => void;
  onPreset: (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => void;
  onGenerate: () => void;
}) {
  const handlePreset = useCallback(
    (presetId: (typeof CHAOS_PRESETS)[number]["id"]) => {
      if (presetId === "sicko") {
        // Fire animation FIRST — before React re-render blocks the main thread.
        // Double-RAF ensures at least one painted frame before state change.
        triggerSickoAnnouncement();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => onPreset(presetId));
        });
      } else {
        onPreset(presetId);
      }
    },
    [onPreset]
  );

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Chaos Meter</h3>
        <strong
          style={
            chaosLabel(value) === "True Random"
              ? {
                  color: "var(--danger)",
                  textShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
                  animation: "glow-pulse 2s ease-in-out infinite",
                }
              : undefined
          }
        >
          {chaosLabel(value)}
        </strong>
      </div>
      <p style={{ marginTop: 6, color: "var(--muted)", fontSize: "0.8rem" }}>
        Set the AI&apos;s personality. How wild should its picks be?
      </p>
      <div style={{ position: "relative" }}>
        <input
          aria-label="Chaos meter"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ width: "100%", transition: "all 0.3s" }}
        />
        {/* 50% tick mark */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -2,
            transform: "translateX(-50%)",
            width: 2,
            height: 10,
            background: "rgba(255, 255, 255, 0.3)",
            borderRadius: 1,
            pointerEvents: "none"
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, justifyContent: "center" }}>
        {CHAOS_PRESETS.map((preset) => {
          const active = Math.abs(value - preset.value) < 0.03;
          const isCenter = preset.value === 0.5;
          const isSicko = preset.id === "sicko";
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.description}
              onClick={() => handlePreset(preset.id)}
              style={{
                borderRadius: 999,
                border: isSicko
                  ? "1.5px solid rgba(239, 68, 68, 0.6)"
                  : isCenter
                    ? "1.5px solid #10b981"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                background: active
                  ? isSicko
                    ? "rgba(239, 68, 68, 0.35)"
                    : isCenter
                      ? "rgba(16, 185, 129, 0.3)"
                      : "color-mix(in srgb, var(--accent) 50%, transparent 50%)"
                  : "rgba(18, 26, 48, 0.6)",
                color: "#fff",
                padding: "0.25rem 0.55rem",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: isSicko ? 800 : isCenter ? 700 : 600,
                transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                boxShadow: isSicko
                  ? active
                    ? "0 0 12px rgba(239, 68, 68, 0.5), 0 0 4px rgba(239, 68, 68, 0.3)"
                    : "0 0 6px rgba(239, 68, 68, 0.2)"
                  : isCenter
                    ? active
                      ? "0 0 8px rgba(16, 185, 129, 0.35)"
                      : "0 0 4px rgba(16, 185, 129, 0.15)"
                    : active
                      ? "0 0 8px color-mix(in srgb, var(--accent) 30%, transparent 70%)"
                      : "none",
                animation: isSicko && active ? "glow-pulse 2s ease-in-out infinite" : "none",
              }}
            >
              <span style={{ fontSize: "1.1rem", verticalAlign: "middle" }}>{preset.emoji}</span>{" "}
              {preset.label}
            </button>
          );
        })}
      </div>
      <button
        className="btn-primary"
        onClick={onGenerate}
        style={{ marginTop: 10, width: "100%" }}
      >
        🎲 Generate Bracket
      </button>
    </section>
  );
}
