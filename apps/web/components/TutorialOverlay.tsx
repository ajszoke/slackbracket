"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

type StepDef = {
  target?: string; // data-tour-target value, or CSS selector fallback
  title: string;
  body: string;
  position?: "below" | "above" | "right" | "left";
};

const STEPS: StepDef[] = [
  {
    // Step 0: Welcome — no target
    title: "Welcome to Slackbracket",
    body: "Slackbracket is two chaos engines working together \u2014 your picks and the AI\u2019s. Lock in your favorites, dial the chaos, and let the algorithm fill the rest.",
  },
  {
    target: ".bracket-item",
    title: "Pick Winners",
    body: "Tap any team to pick a winner. Your picks cascade forward automatically. Don\u2019t worry about filling every game \u2014 you\u2019ll see how to use the bracket AI in the next step.",
    position: "above",
  },
  {
    target: "chaos-meter",
    title: "The Chaos Meter",
    body: "Set the AI\u2019s personality. \u2018True Odds\u2019 follows real ELO ratings. \u2018Sicko Mode\u2019 is pure chaos. Move the slider or tap a preset.",
    position: "below",
  },
  {
    target: "generate-btn",
    title: "The Button",
    body: "Hit this to fill the rest with AI picks. The algorithm uses your chaos setting to decide. Press it again for a whole new bracket!",
    position: "above",
  },
  {
    target: "odds-panel",
    title: "Bracket Odds",
    body: "This shows how likely your picks are according to real ratings. The temperature labels tell you how wild your bracket is \u2014 from Chalk City to Unhinged.",
    position: "below",
  },
  {
    // Step 5: Benediction — no target
    title: "You\u2019re Ready",
    body: "Try Sicko Mode at least once. Share your wildest bracket. There\u2019s no wrong way to fill a bracket. Go make something ridiculous.",
  },
];

function useTargetRect(step: number, dismissed: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (dismissed) return;
    const def = STEPS[step];
    if (!def?.target) {
      setRect(null);
      return;
    }

    // Find target: prefer data-tour-target, fallback to CSS selector.
    // For CSS selectors, find the first *visible* match (non-zero rect)
    // since mobile hides the desktop bracket layout.
    let el: HTMLElement | null = document.querySelector(`[data-tour-target="${def.target}"]`);
    if (!el) {
      const candidates = document.querySelectorAll<HTMLElement>(def.target!);
      for (const c of candidates) {
        const r = c.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el = c;
          break;
        }
      }
    }

    if (!el) {
      setRect(null);
      return;
    }

    const target = el;
    let cancelled = false;

    // Scroll target into view, then poll until position stabilizes
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    let lastTop = -Infinity;
    let stableFrames = 0;
    const REQUIRED_STABLE = 5;

    function pollUntilStable() {
      if (cancelled) return;
      const r = target.getBoundingClientRect();
      if (Math.abs(r.top - lastTop) < 1) {
        stableFrames++;
        if (stableFrames >= REQUIRED_STABLE) {
          setRect(r);
          return; // Done polling, switch to event listeners
        }
      } else {
        stableFrames = 0;
      }
      lastTop = r.top;
      requestAnimationFrame(pollUntilStable);
    }

    requestAnimationFrame(pollUntilStable);

    // After stable, keep updating on resize/scroll
    const update = () => {
      if (!cancelled) setRect(target.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step, dismissed]);

  return rect;
}

function SpotlightOverlay({ rect }: { rect: DOMRect }) {
  const pad = 8;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const r = 12;

  // Full-screen polygon with a rounded-rect hole
  const path = `
    M 0 0
    H ${window.innerWidth}
    V ${window.innerHeight}
    H 0
    Z
    M ${x + r} ${y}
    H ${x + w - r}
    Q ${x + w} ${y} ${x + w} ${y + r}
    V ${y + h - r}
    Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    H ${x + r}
    Q ${x} ${y + h} ${x} ${y + h - r}
    V ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 9998,
        pointerEvents: "none",
      }}
    >
      <path d={path} fill="rgba(0, 0, 0, 0.65)" fillRule="evenodd" />
    </svg>
  );
}

function TooltipCard({
  step,
  rect,
  total,
  onNext,
  onDismiss,
  isWelcome,
}: {
  step: StepDef;
  rect: DOMRect | null;
  total: number;
  onNext: () => void;
  onDismiss: () => void;
  isWelcome: boolean;
}) {
  const stepIndex = STEPS.indexOf(step);
  const isLast = stepIndex === STEPS.length - 1;

  // Position tooltip relative to target
  let tooltipStyle: React.CSSProperties = {};
  if (rect && !isWelcome && !isLast) {
    const pos = step.position ?? "below";
    const pad = 16;
    if (pos === "below") {
      tooltipStyle = {
        position: "fixed",
        top: rect.bottom + pad,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
        zIndex: 9999,
      };
    } else if (pos === "above") {
      tooltipStyle = {
        position: "fixed",
        bottom: window.innerHeight - rect.top + pad,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 340)),
        zIndex: 9999,
      };
    }
  } else {
    // Centered (welcome / benediction) — use inset + margin:auto to avoid
    // transform conflicts with Framer Motion's y animation
    tooltipStyle = {
      position: "fixed",
      inset: 0,
      margin: "auto",
      height: "fit-content",
      zIndex: 9999,
    };
  }

  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        ...tooltipStyle,
        width: "min(360px, 88vw)",
        background: "var(--card)",
        border: "1px solid var(--glass-border)",
        borderRadius: 14,
        padding: "1.2rem",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(124, 77, 255, 0.15)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.5rem",
          fontFamily: "var(--font-hero), system-ui, sans-serif",
          fontSize: isWelcome ? "1.2rem" : "0.95rem",
          letterSpacing: "0.04em",
        }}
      >
        {step.title}
      </h3>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 1rem" }}>
        {step.body}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "0.8rem",
            padding: "0.25rem 0",
          }}
        >
          {isWelcome ? "I Know What I\u2019m Doing" : "Skip"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isWelcome && !isLast && (
            <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
              {stepIndex}/{total - 1}
            </span>
          )}
          <button
            onClick={onNext}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0.4rem 0.85rem",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            {isWelcome ? "Show Me Around" : isLast ? "Let\u2019s Go!" : "Next"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
  const currentStep = STEPS[step];
  const rect = useTargetRect(step, dismissed);
  const hasTarget = !!currentStep?.target && !!rect;

  const handleDismissAndScroll = useCallback(() => {
    onDismiss();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [onDismiss]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleDismissAndScroll();
    },
    [handleDismissAndScroll]
  );

  if (dismissed || !currentStep) return null;

  return (
    <>
      {/* Backdrop — full screen dark overlay for welcome/benediction, or spotlight for targeted steps */}
      {hasTarget ? (
        <SpotlightOverlay rect={rect!} />
      ) : (
        <div
          onClick={handleBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 9998,
          }}
        />
      )}

      {/* Click-through blocker for spotlight steps */}
      {hasTarget && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            cursor: "default",
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <TooltipCard
          key={step}
          step={currentStep}
          rect={rect}
          total={STEPS.length}
          onNext={onNext}
          onDismiss={handleDismissAndScroll}
          isWelcome={step === 0}
        />
      </AnimatePresence>
    </>
  );
}
