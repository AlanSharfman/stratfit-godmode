// src/components/intelligence/SystemCommentaryPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical System Commentary Panel
// ONE component used in both Terrain (Baseline) and Strategy Studio views.
// Reads from simulationStore (priority) → scenarioStore.engineResults (fallback).
// No "AI" labeling. No hardcoded strings. Every claim is metric-derived.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useSimulationStore } from "@/state/simulationStore";
import { useScenarioStore } from "@/state/scenarioStore";
import { generateCommentary, type CommentaryBlock } from "@/logic/intelligence/generateCommentary";
import type { SimulationStatus } from "@/state/simulationStore";
import styles from "./SystemCommentaryPanel.module.css";

// ────────────────────────────────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────────────────────────────────

interface SystemCommentaryPanelProps {
  /** Active scenario id (e.g. "base", "upside", "stress") */
  scenario?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// SEVERITY DOT
// ────────────────────────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: CommentaryBlock["severity"] }) {
  const cls =
    severity === "positive"  ? styles.severityPositive  :
    severity === "neutral"   ? styles.severityNeutral   :
    severity === "warning"   ? styles.severityWarning   :
    styles.severityCritical;
  return <span className={`${styles.severityDot} ${cls}`} />;
}

// ────────────────────────────────────────────────────────────────────────────
// COMMENTARY BLOCK
// ────────────────────────────────────────────────────────────────────────────

function BlockRow({ block }: { block: CommentaryBlock }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>
        <SeverityDot severity={block.severity} />
        <span className={styles.blockTitle}>{block.title}</span>
      </div>
      <p className={styles.blockClaim}>{block.claim}</p>
      {block.metrics && block.metrics.length > 0 && (
        <div className={styles.blockMetrics}>
          {block.metrics.map((m, i) => (
            <div className={styles.metric} key={i}>
              <span className={styles.metricLabel}>{m.label}</span>
              <span className={styles.metricValue}>{m.value}</span>
              {m.delta && (
                <span className={`${styles.metricDelta} ${
                  m.delta.startsWith("+") || m.delta === "positive" ? styles.deltaPositive : styles.deltaNegative
                }`}>
                  {m.delta === "positive" ? "↑" : m.delta === "negative" ? "↓" : m.delta}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STATUS HELPERS
// ────────────────────────────────────────────────────────────────────────────

function statusLabel(s: SimulationStatus): string {
  switch (s) {
    case "idle":     return "Idle";
    case "running":  return "Running";
    case "complete": return "Complete";
    case "error":    return "Error";
    default:         return "—";
  }
}

function statusCls(s: SimulationStatus): string {
  switch (s) {
    case "idle":     return styles.statusIdle;
    case "running":  return styles.statusRunning;
    case "complete": return styles.statusComplete;
    case "error":    return styles.statusError;
    default:         return styles.statusIdle;
  }
}

function formatTimestamp(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SystemCommentaryPanel: React.FC<SystemCommentaryPanelProps> = ({ scenario = "base" }) => {
  // ── Simulation store (priority source) ──
  const {
    fullResult,
    fullVerdict,
    assessmentPayload,
    summary,
    simulationStatus,
    runMeta,
    hasSimulated,
  } = useSimulationStore(
    useShallow((s) => ({
      fullResult: s.fullResult,
      fullVerdict: s.fullVerdict,
      assessmentPayload: s.assessmentPayload,
      summary: s.summary,
      simulationStatus: s.simulationStatus,
      runMeta: s.runMeta,
      hasSimulated: s.hasSimulated,
    }))
  );

  // ── Engine results (fallback) ──
  const engineResults = useScenarioStore((s) => s.engineResults);
  const currentEngineResult = engineResults?.[scenario] ?? null;
  const baseEngineResult = engineResults?.base ?? null;

  // ── Generate commentary ──
  const commentary = useMemo(
    () =>
      generateCommentary({
        simulationResult: fullResult,
        verdict: fullVerdict,
        assessmentPayload,
        summary,
        engineResult: currentEngineResult,
        baseEngineResult,
      }),
    [fullResult, fullVerdict, assessmentPayload, summary, currentEngineResult, baseEngineResult]
  );

  // ── Timestamp display ──
  const runTimestamp = useMemo(() => {
    if (runMeta?.completedAt) {
      // completedAt is performance.now() — convert using Date.now offset
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    return null;
  }, [runMeta?.completedAt]);

  const runIdShort = runMeta?.runId?.slice(0, 12) ?? null;

  // ── Render ──
  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>System Commentary</span>
        {commentary.source === "simulation" && (
          <span className={styles.sourceSim}>
            <span className={styles.sourceDotSim} />
            Simulation
          </span>
        )}
        {commentary.source === "engine" && (
          <span className={styles.sourceEngine}>
            <span className={styles.sourceDotEngine} />
            Engine
          </span>
        )}
        {commentary.source === "empty" && (
          <span className={styles.sourceEmpty}>
            No Data
          </span>
        )}
      </div>

      {/* TIMESTAMP / RUN ID */}
      {(runIdShort || runTimestamp) && (
        <div className={styles.timestampRow}>
          {runIdShort && (
            <>
              <span className={styles.timestampLabel}>Run</span>
              <span className={styles.timestampValue}>{runIdShort}</span>
            </>
          )}
          {!runIdShort && runTimestamp && (
            <>
              <span className={styles.timestampLabel}>Last update</span>
              <span className={styles.timestampValue}>{runTimestamp}</span>
            </>
          )}
        </div>
      )}

      {/* NOT-RUN BANNER (engine fallback with no simulation) */}
      {commentary.source === "engine" && !hasSimulated && (
        <div className={styles.notRunBanner}>
          <span className={styles.notRunDot} />
          <span className={styles.notRunText}>
            Simulation not run. Showing engine estimates.
          </span>
        </div>
      )}

      {/* COMMENTARY BLOCKS */}
      {commentary.blocks.length > 0 ? (
        <div className={styles.blocks}>
          {commentary.blocks.map((block) => (
            <BlockRow key={block.id} block={block} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <div className={styles.emptyTitle}>No Commentary Available</div>
          <div className={styles.emptyText}>
            Initialize your baseline and run a scenario to generate system commentary.
          </div>
        </div>
      )}

      {/* SIMULATION CONSOLE STRIP */}
      <div className={styles.consoleStrip}>
        <div className={styles.consoleTitle}>Simulation Console</div>
        <div className={styles.consoleGrid}>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Engine</span>
            <span className={styles.consoleValue}>Monte Carlo</span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Paths</span>
            <span className={styles.consoleValue}>
              {runMeta?.paths ? runMeta.paths.toLocaleString() : "—"}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Seed</span>
            <span className={styles.consoleValue}>
              {runMeta?.seedLocked ? "Deterministic" : "—"}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Horizon</span>
            <span className={styles.consoleValue}>
              {runMeta?.timeHorizonMonths ? runMeta.timeHorizonMonths + "mo" : "—"}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Duration</span>
            <span className={styles.consoleValue}>
              {runMeta?.durationMs ? (runMeta.durationMs / 1000).toFixed(2) + "s" : "—"}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Status</span>
            <span className={`${styles.consoleStatus} ${statusCls(simulationStatus)}`}>
              {statusLabel(simulationStatus)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

SystemCommentaryPanel.displayName = "SystemCommentaryPanel";

export default SystemCommentaryPanel;

