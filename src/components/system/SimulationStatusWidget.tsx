// src/components/system/SimulationStatusWidget.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Simulation Status Widget
//
// Small, institutional, top-right overlay.
// Shows: run ID, current pipeline stage, simulation count, progress.
// Auto-hides 5 seconds after stage === "complete".
// Wired to real engine state — never fakes data.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useState } from "react";
import {
  useSimulationEngineStore,
  STAGE_LABELS,
  STAGE_ORDER,
  type SimulationStage,
} from "@/state/simulationEngineStore";

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SimulationStatusWidget: React.FC = memo(() => {
  const stage = useSimulationEngineStore((s) => s.stage);
  const runId = useSimulationEngineStore((s) => s.runId);
  const paths = useSimulationEngineStore((s) => s.simulationPaths);
  const runCount = useSimulationEngineStore((s) => s.runCount);
  const progress = useSimulationEngineStore((s) => s.progress);

  const [visible, setVisible] = useState(false);

  // Show when running, auto-hide 5s after complete
  useEffect(() => {
    if (stage !== "idle" && stage !== "complete") {
      setVisible(true);
    }
    if (stage === "complete") {
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  if (!visible && stage === "idle") return null;
  if (!visible && stage === "complete") return null;

  const isComplete = stage === "complete";
  const stageIdx = STAGE_ORDER.indexOf(stage as SimulationStage);
  const progressPct = Math.round(progress * 100);

  return (
    <div style={S.container} role="status" aria-live="polite">
      {/* Header */}
      <div style={S.header}>
        <div style={{ ...S.dot, background: isComplete ? "#22c55e" : "#22d3ee" }} />
        <span style={S.title}>SIMULATION ENGINE</span>
      </div>

      {/* Run ID */}
      {runId && (
        <div style={S.row}>
          <span style={S.label}>Run</span>
          <span style={S.value}>#{runId}</span>
        </div>
      )}

      {/* Stage */}
      <div style={S.row}>
        <span style={S.label}>Stage</span>
        <span style={{ ...S.value, color: isComplete ? "#22c55e" : "#e2e8f0" }}>
          {STAGE_LABELS[stage] ?? stage}
        </span>
      </div>

      {/* Paths */}
      {paths > 0 && (
        <div style={S.row}>
          <span style={S.label}>Paths</span>
          <span style={S.value}>{paths.toLocaleString()} scenario paths</span>
        </div>
      )}

      {/* Progress bar */}
      {!isComplete && stageIdx >= 0 && (
        <div style={S.progressTrack}>
          <div
            style={{
              ...S.progressFill,
              width: `${progressPct}%`,
            }}
          />
        </div>
      )}

      {/* Run count */}
      {runCount > 0 && (
        <div style={S.runCount}>
          {runCount} run{runCount !== 1 ? "s" : ""} this session
        </div>
      )}
    </div>
  );
});

SimulationStatusWidget.displayName = "SimulationStatusWidget";
export default SimulationStatusWidget;

// ────────────────────────────────────────────────────────────────────────────
// INLINE STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const S: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 9000,
    background: "rgba(10, 15, 22, 0.92)",
    border: "1px solid rgba(34, 211, 238, 0.12)",
    borderRadius: 6,
    padding: "10px 14px",
    minWidth: 200,
    maxWidth: 260,
    fontFamily: FONT,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  title: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "rgba(226, 232, 240, 0.6)",
    textTransform: "uppercase" as const,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    color: "rgba(148, 163, 184, 0.7)",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  value: {
    fontSize: 11,
    fontWeight: 500,
    color: "#e2e8f0",
  },
  progressTrack: {
    marginTop: 6,
    height: 2,
    borderRadius: 1,
    background: "rgba(34, 211, 238, 0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1,
    background: "rgba(34, 211, 238, 0.5)",
    transition: "width 300ms ease",
  },
  runCount: {
    marginTop: 6,
    fontSize: 9,
    color: "rgba(148, 163, 184, 0.4)",
    letterSpacing: "0.03em",
  },
};
