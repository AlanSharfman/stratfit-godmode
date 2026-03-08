// src/components/timeline/TimelineSyncStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Sync Strip
//
// Compact horizontal bar that provides timeline awareness on any page.
// Shows: current step label • scrubber • playback • key metric (contextual).
// Reads from studioTimelineStore — no local state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useMemo } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import type { EngineTimelinePoint } from "@/core/engine/types";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type TimelineMetricMode = "risk" | "valuation" | "revenue" | "all";

interface Props {
  /** Which metric to emphasise */
  mode?: TimelineMetricMode;
  /** Whether to show the generate button (Compare page) */
  showGenerate?: boolean;
  /** Optional extra class */
  className?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtDollar(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(1)}M`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

function riskColor(v: number): string {
  if (v < 0.25) return "#34d399";
  if (v < 0.45) return "#22d3ee";
  if (v < 0.6) return "#fbbf24";
  return "#ef4444";
}

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "rgba(34, 211, 238, 0.85)";
const CYAN_DIM = "rgba(34, 211, 238, 0.15)";

const S: Record<string, React.CSSProperties> = {
  strip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 16px",
    background: "rgba(6, 12, 20, 0.7)",
    backdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(182, 228, 255, 0.06)",
    borderBottom: "1px solid rgba(182, 228, 255, 0.06)",
    flexShrink: 0,
    minHeight: 36,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "5px 16px",
    background: "rgba(6, 12, 20, 0.5)",
    borderTop: "1px solid rgba(182, 228, 255, 0.04)",
    borderBottom: "1px solid rgba(182, 228, 255, 0.04)",
    flexShrink: 0,
    minHeight: 32,
  },
  emptyLabel: {
    fontSize: 10,
    color: "rgba(148, 180, 214, 0.35)",
    fontFamily: FONT,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  badge: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(34, 211, 238, 0.6)",
    background: "rgba(34, 211, 238, 0.06)",
    padding: "2px 7px",
    borderRadius: 3,
    textTransform: "uppercase" as const,
    flexShrink: 0,
  },
  stepLabel: {
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: 600,
    color: CYAN,
    minWidth: 56,
    textAlign: "center" as const,
    flexShrink: 0,
  },
  slider: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    appearance: "auto" as const,
    accentColor: "#22d3ee",
    cursor: "pointer",
    background: "transparent",
    minWidth: 80,
  },
  stepCount: {
    fontFamily: MONO,
    fontSize: 9,
    color: "rgba(148, 180, 214, 0.4)",
    minWidth: 40,
    textAlign: "right" as const,
    flexShrink: 0,
  },
  // Playback buttons
  btnGroup: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 24,
    borderRadius: 4,
    border: `1px solid ${CYAN_DIM}`,
    background: "rgba(34,211,238,0.05)",
    color: CYAN,
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 150ms ease",
    padding: 0,
    lineHeight: 1,
  },
  btnActive: {
    background: "rgba(34,211,238,0.16)",
    borderColor: "rgba(34,211,238,0.35)",
  },
  btnDisabled: {
    opacity: 0.3,
    cursor: "not-allowed",
  },
  // Metric chips
  metricGroup: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
    marginLeft: "auto",
  },
  metricChip: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 0,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(148, 180, 214, 0.45)",
    fontFamily: FONT,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: MONO,
    letterSpacing: "-0.01em",
  },
  generateBtn: {
    padding: "4px 10px",
    borderRadius: 4,
    border: `1px solid rgba(34, 211, 238, 0.2)`,
    background: "rgba(34, 211, 238, 0.08)",
    color: CYAN,
    fontSize: 9,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    flexShrink: 0,
    transition: "background 180ms ease",
  },
  resolutionGroup: {
    display: "flex",
    gap: 0,
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid rgba(182, 228, 255, 0.08)",
    flexShrink: 0,
  },
  resBtn: {
    padding: "3px 7px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.45)",
    fontSize: 8,
    fontWeight: 700,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    transition: "background 150ms ease, color 150ms ease",
  },
  resBtnActive: {
    padding: "3px 7px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: CYAN,
    fontSize: 8,
    fontWeight: 800,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// METRIC RENDERERS
// ────────────────────────────────────────────────────────────────────────────

function renderMetrics(point: EngineTimelinePoint, mode: TimelineMetricMode) {
  const chips: React.ReactElement[] = [];

  if (mode === "risk" || mode === "all") {
    chips.push(
      <div key="risk" style={S.metricChip}>
        <span style={S.metricLabel}>Risk</span>
        <span style={{ ...S.metricValue, color: riskColor(point.riskIndex) }}>
          {fmtPct(point.riskIndex)}
        </span>
      </div>,
    );
  }

  if (mode === "valuation" || mode === "all") {
    chips.push(
      <div key="ev" style={S.metricChip}>
        <span style={S.metricLabel}>EV</span>
        <span style={{ ...S.metricValue, color: "#e2e8f0" }}>
          {fmtDollar(point.enterpriseValue)}
        </span>
      </div>,
    );
  }

  if (mode === "revenue" || mode === "all") {
    chips.push(
      <div key="rev" style={S.metricChip}>
        <span style={S.metricLabel}>Rev</span>
        <span style={{ ...S.metricValue, color: CYAN }}>
          {fmtDollar(point.revenue)}
        </span>
      </div>,
    );
    chips.push(
      <div key="ebitda" style={S.metricChip}>
        <span style={S.metricLabel}>EBITDA</span>
        <span style={{ ...S.metricValue, color: point.ebitda >= 0 ? "#34d399" : "#ef4444" }}>
          {fmtDollar(point.ebitda)}
        </span>
      </div>,
    );
  }

  return chips;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const TimelineSyncStrip: React.FC<Props> = memo(({
  mode = "all",
  showGenerate = false,
}) => {
  const timeline = useStudioTimelineStore((s) => s.timeline);
  const engineResults = useStudioTimelineStore((s) => s.engineResults);
  const currentStep = useStudioTimelineStore((s) => s.currentStep);
  const isPlaying = useStudioTimelineStore((s) => s.isPlaying);
  const resolution = useStudioTimelineStore((s) => s.resolution);
  const setStep = useStudioTimelineStore((s) => s.setStep);
  const play = useStudioTimelineStore((s) => s.play);
  const pause = useStudioTimelineStore((s) => s.pause);
  const reset = useStudioTimelineStore((s) => s.reset);
  const setResolution = useStudioTimelineStore((s) => s.setResolution);
  const generateTimeline = useStudioTimelineStore((s) => s.generateTimeline);

  const currentPoint: EngineTimelinePoint | null = useMemo(() => {
    if (!engineResults || !engineResults.timeline[currentStep]) return null;
    return engineResults.timeline[currentStep];
  }, [engineResults, currentStep]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setStep(Number(e.target.value)),
    [setStep],
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  // ── Empty state ──
  if (timeline.length === 0) {
    return (
      <div style={S.empty}>
        <span style={S.badge}>Timeline</span>
        <span style={S.emptyLabel}>
          {showGenerate ? "Generate a timeline to enable temporal analysis" : "No timeline generated — go to Studio or Compare to generate"}
        </span>
        {showGenerate && (
          <>
            <div style={S.resolutionGroup}>
              {(["monthly", "quarterly", "yearly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setResolution(r)}
                  style={resolution === r ? S.resBtnActive : S.resBtn}
                >
                  {r.slice(0, 3)}
                </button>
              ))}
            </div>
            <button type="button" onClick={generateTimeline} style={S.generateBtn}>
              ▶ Generate
            </button>
          </>
        )}
      </div>
    );
  }

  const step = timeline[currentStep];

  return (
    <div style={S.strip}>
      <span style={S.badge}>Timeline</span>

      {/* Resolution selector (only on pages with generate) */}
      {showGenerate && (
        <div style={S.resolutionGroup}>
          {(["monthly", "quarterly", "yearly"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResolution(r)}
              style={resolution === r ? S.resBtnActive : S.resBtn}
            >
              {r.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Step label */}
      <span style={S.stepLabel}>{step?.label ?? "—"}</span>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={timeline.length - 1}
        step={1}
        value={currentStep}
        onChange={handleScrub}
        style={S.slider}
        aria-label="Timeline position"
      />
      <span style={S.stepCount}>
        {currentStep + 1}/{timeline.length}
      </span>

      {/* Playback */}
      <div style={S.btnGroup}>
        <button
          type="button"
          onClick={handlePlayPause}
          style={{ ...S.btn, ...(isPlaying ? S.btnActive : {}) }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          onClick={reset}
          style={S.btn}
          title="Reset to start"
        >
          ⟲
        </button>
      </div>

      {/* Contextual metrics */}
      {currentPoint && (
        <div style={S.metricGroup}>
          {renderMetrics(currentPoint, mode)}
        </div>
      )}
    </div>
  );
});

TimelineSyncStrip.displayName = "TimelineSyncStrip";
export default TimelineSyncStrip;
