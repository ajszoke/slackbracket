"use client";

const STEPS = [
  "Welcome! Slackbracket is two chaos engines working together \u2014 your picks and the AI\u2019s. Lock in your favorites and let the algorithm fill the rest.",
  "Tap any team to pick a winner. Don\u2019t worry about filling every game \u2014 sparse picks are encouraged.",
  "Use the Chaos Meter to set the AI\u2019s personality. \u2018True Odds\u2019 follows ELO ratings. \u2018Sicko Mode\u2019 is pure chaos.",
  "Hit \u2018Generate Bracket\u2019 to fill remaining games, then share your bracket URL to challenge friends!",
];

export function TutorialOverlay({
  step,
  dismissed,
  onNext,
  onDismiss,
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
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: 14,
        padding: "0.9rem",
        backdropFilter: "blur(var(--glass-blur))",
      }}
    >
      <strong>Quick Tour</strong>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>{STEPS[step]}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={onDismiss}
          style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
        >
          Skip
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{step + 1}/{STEPS.length}</span>
          <button
            onClick={onNext}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0.35rem 0.7rem",
              cursor: "pointer",
            }}
          >
            {step < STEPS.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
