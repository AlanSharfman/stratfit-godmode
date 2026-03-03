// src/components/system/SimulationPipelineWidget.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Decision Simulation Pipeline Widget (REV 2)
//
// Institutional top-right overlay showing only the stages that are
// actually executed in the current run. Never fabricates stages.
// Auto-hides 5s after render_complete.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useState } from "react";
import {
  useSimulationPipelineStore,
  PIPELINE_LABELS,
  type PipelineStage,
} from "@/stores/simulationPipelineStore";

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function stageStatus(
  stage: PipelineStage,
  currentStage: PipelineStage,
  activeStages: PipelineStage[]
): "completed" | "current" | "pending" {
  const currentIdx = activeStages.indexOf(currentStage);
  const stageIdx = activeStages.indexOf(stage);

  if (currentStage === "render_complete") return "completed";
  if (stage === currentStage) return "current";
  if (stageIdx < currentIdx) return "completed";
  return "pending";
}

function statusIcon(status: "completed" | "current" | "pending"): string {
  switch (status) {
    case "completed": return "✓";
    case "current":   return "⟳";
    case "pending":   return "•";
  }
}

function statusColor(status: "completed" | "current" | "pending"): string {
  switch (status) {
    case "completed": return "#22c55e";
    case "current":   return "#22d3ee";
    case "pending":   return "rgba(148, 163, 184, 0.4)";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SimulationPipelineWidget: React.FC = memo(() => {
  const runId = useSimulationPipelineStore((s) => s.runId);
  const currentStage = useSimulationPipelineStore((s) => s.currentStage);
  const activeStages = useSimulationPipelineStore((s) => s.activeStages);
  const meta = useSimulationPipelineStore((s) => s.meta);

  const [visible, setVisible] = useState(false);

  // Show when running, auto-hide 5s after render_complete
  useEffect(() => {
    if (currentStage !== "idle" && currentStage !== "render_complete") {
      setVisible(true);
    }
    if (currentStage === "render_complete") {
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [currentStage]);

  if (!visible && currentStage === "idle") return null;
  if (!visible && currentStage === "render_complete") return null;
  if (activeStages.length === 0) return null;

  const isComplete = currentStage === "render_complete";

  return (
    <div style={S.container} role="status" aria-live="polite">
      {/* Header */}
      <div style={S.header}>
        <div style={{ ...S.dot, background: isComplete ? "#22c55e" : "#22d3ee" }} />
        <span style={S.title}>DECISION SIMULATION PIPELINE</span>
      </div>

      {/* Run ID */}
      {runId > 0 && (
        <div style={S.row}>
          <span style={S.label}>Run</span>
          <span style={S.value}>#{runId}</span>
        </div>
      )}

      {/* Current stage label */}
      <div style={S.row}>
        <span style={S.label}>Stage</span>
        <span style={{ ...S.value, color: isComplete ? "#22c55e" : "#e2e8f0" }}>
          {PIPELINE_LABELS[currentStage]}
        </span>
      </div>

      {/* Separator */}
      <div style={S.separator} />

      {/* Active stages list */}
      <div style={S.stageList}>
        {activeStages.map((stage) => {
          const status = stageStatus(stage, currentStage, activeStages);
          return (
            <div key={stage} style={S.stageRow}>
              <span style={{ ...S.stageIcon, color: statusColor(status) }}>
                {statusIcon(status)}
              </span>
              <span style={{
                ...S.stageLabel,
                color: status === "current"
                  ? "#e2e8f0"
                  : status === "completed"
                    ? "rgba(34, 197, 94, 0.7)"
                    : "rgba(148, 163, 184, 0.5)",
              }}>
                {PIPELINE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Meta info — only show what actually exists */}
      {(meta.paths || meta.sensitivityVars || meta.stressCases || meta.valuationMethods) && (
        <>
          <div style={S.separator} />
          {meta.paths != null && (
            <div style={S.row}>
              <span style={S.label}>Paths</span>
              <span style={S.value}>{meta.paths.toLocaleString()}</span>
            </div>
          )}
          {meta.sensitivityVars != null && (
            <div style={S.row}>
              <span style={S.label}>Sensitivity vars</span>
              <span style={S.value}>{meta.sensitivityVars}</span>
            </div>
          )}
          {meta.stressCases != null && (
            <div style={S.row}>
              <span style={S.label}>Stress cases</span>
              <span style={S.value}>{meta.stressCases}</span>
            </div>
          )}
          {meta.valuationMethods && meta.valuationMethods.length > 0 && (
            <div style={S.row}>
              <span style={S.label}>Valuation</span>
              <span style={S.value}>{meta.valuationMethods.join(", ")}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});

SimulationPipelineWidget.displayName = "SimulationPipelineWidget";
export default SimulationPipelineWidget;

// ────────────────────────────────────────────────────────────────────────────
// INLINE STYLES — monospaced, institutional
// ────────────────────────────────────────────────────────────────────────────

const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace";

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
    minWidth: 220,
    maxWidth: 280,
    fontFamily: MONO,
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
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.10em",
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
    fontSize: 9,
    color: "rgba(148, 163, 184, 0.7)",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  value: {
    fontSize: 10,
    fontWeight: 500,
    color: "#e2e8f0",
  },
  separator: {
    height: 1,
    background: "rgba(34, 211, 238, 0.06)",
    margin: "6px 0",
  },
  stageList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  stageRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  stageIcon: {
    fontSize: 10,
    width: 14,
    textAlign: "center" as const,
    flexShrink: 0,
  },
  stageLabel: {
    fontSize: 9,
    letterSpacing: "0.03em",
  },
};
