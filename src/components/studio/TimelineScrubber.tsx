// src/components/studio/TimelineScrubber.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Scrubber
//
// Slider control for scrubbing through simulation timesteps.
// Displays the current step label (Month / Quarter / Year).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "rgba(34, 211, 238, 0.85)";

const S: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: 600,
    color: CYAN,
    minWidth: 64,
    textAlign: "center",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  stepCount: {
    fontFamily: MONO,
    fontSize: 10,
    color: "rgba(148, 180, 214, 0.45)",
    minWidth: 48,
    textAlign: "right",
    flexShrink: 0,
  },
  slider: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    appearance: "auto" as const,
    accentColor: "#22d3ee",
    cursor: "pointer",
    background: "transparent",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const TimelineScrubber: React.FC = memo(() => {
  const timeline = useStudioTimelineStore((s) => s.timeline);
  const currentStep = useStudioTimelineStore((s) => s.currentStep);
  const setStep = useStudioTimelineStore((s) => s.setStep);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStep(Number(e.target.value));
    },
    [setStep],
  );

  if (timeline.length === 0) {
    return (
      <div style={S.wrapper}>
        <span style={{ ...S.label, color: "rgba(148,180,214,0.35)" }}>
          No timeline
        </span>
      </div>
    );
  }

  const step = timeline[currentStep];

  return (
    <div style={S.wrapper}>
      <span style={S.label}>{step?.label ?? "—"}</span>
      <input
        type="range"
        min={0}
        max={timeline.length - 1}
        step={1}
        value={currentStep}
        onChange={handleChange}
        style={S.slider}
        aria-label="Timeline scrubber"
      />
      <span style={S.stepCount}>
        {currentStep + 1}/{timeline.length}
      </span>
    </div>
  );
});

TimelineScrubber.displayName = "TimelineScrubber";
export default TimelineScrubber;
