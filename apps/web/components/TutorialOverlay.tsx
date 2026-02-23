"use client";

const STEPS = [
  "Pick a mode: Quick Generate for instant bracket, or Guided Custom if you want selective control.",
  "Tap winners in any game. Sparse picks are encouraged; lock your favorites and fill the rest.",
  "Use Chaos Meter presets to control upset frequency.",
  "Share your bracket URL and challenge friends."
];

export function TutorialOverlay({
  step,
  dismissed,
  onNext,
  onDismiss
}: {
  step: number;
  dismissed: boolean;
  onNext: () => void;
  onDismiss: () => void;
}) {
  if (dismissed || step >= STEPS.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 50,
        width: "min(360px, 92vw)",
        background: "#111a30",
        border: "1px solid #3f517c",
        borderRadius: 14,
        padding: "0.9rem"
      }}
    >
      <strong>Quick Tour</strong>
      <p style={{ color: "var(--muted)" }}>{STEPS[step]}</p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", color: "#9db2dd" }}>
          Skip
        </button>
        <button
          onClick={onNext}
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "0.35rem 0.7rem",
            cursor: "pointer"
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
