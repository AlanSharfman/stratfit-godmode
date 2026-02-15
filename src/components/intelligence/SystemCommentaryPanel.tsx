// src/components/intelligence/SystemCommentaryPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical System Commentary Panel (God Mode)
//
// DATA SOURCE (STRICT):
//   SystemAnalysisSnapshot only — passed as prop.
//   This component does NOT import simulationStore, scenarioStore,
//   leverStore, or any other Zustand store.
//
// ANTI-MISWIRING RULES:
//   • No scenarioStore imports.
//   • No raw simulationStore reads.
//   • No hardcoded commentary strings.
//   • Runtime console warning if snapshot is undefined.
//
// NARRATIVE PIPELINE:
//   snapshot → extractQuantifiedFindings → generateNarrative → render
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useEffect, useRef } from "react";
import type { SystemAnalysisSnapshot, SystemAnalysisResult } from "@/logic/system/SystemAnalysisEngine";
import { extractQuantifiedFindings } from "@/logic/intelligence/extractQuantifiedFindings";
import { generateNarrative, type NarrativeBlock } from "@/logic/intelligence/generateNarrative";
import styles from "./SystemCommentaryPanel.module.css";

// ────────────────────────────────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────────────────────────────────

interface SystemCommentaryPanelProps {
  /** The analysis snapshot — sole data source */
  snapshot: SystemAnalysisResult;
}

// ────────────────────────────────────────────────────────────────────────────
// SEVERITY DOT
// ────────────────────────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: NarrativeBlock["severity"] }) {
  const cls =
    severity === "positive"  ? styles.severityPositive  :
    severity === "neutral"   ? styles.severityNeutral   :
    severity === "warning"   ? styles.severityWarning   :
    styles.severityCritical;
  return <span className={`${styles.severityDot} ${cls}`} />;
}

// ────────────────────────────────────────────────────────────────────────────
// BLOCK ROW
// ────────────────────────────────────────────────────────────────────────────

function BlockRow({ block }: { block: NarrativeBlock }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHeader}>
        <SeverityDot severity={block.severity} />
        <span className={styles.blockTitle}>{block.title}</span>
      </div>
      <p className={styles.blockClaim}>{block.claim}</p>
      {block.citations && block.citations.length > 0 && (
        <div className={styles.blockMetrics}>
          {block.citations.map((c, i) => (
            <div className={styles.metric} key={i}>
              <span className={styles.metricLabel}>{c.label}</span>
              <span className={styles.metricValue}>{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SystemCommentaryPanel: React.FC<SystemCommentaryPanelProps> = ({ snapshot }) => {
  // ── Runtime guard ──
  const warnedRef = useRef(false);
  useEffect(() => {
    if (!snapshot && !warnedRef.current) {
      console.warn("[SystemCommentaryPanel] snapshot is undefined. No analysis data available. Ensure useSystemAnalysis() is wired correctly.");
      warnedRef.current = true;
    }
    if (snapshot) {
      warnedRef.current = false;
    }
  }, [snapshot]);

  // ── Track runId changes for re-generation ──
  const prevRunIdRef = useRef<string | null>(null);

  // ── Extract findings and generate narrative (recomputes when runId changes) ──
  const narrativeOutput = useMemo(() => {
    if (!snapshot || !snapshot.computed) {
      return null;
    }

    const snap = snapshot as SystemAnalysisSnapshot;

    // Log runId change
    if (prevRunIdRef.current !== null && prevRunIdRef.current !== snap.runId) {
      console.info(`[SystemCommentaryPanel] RunId changed: ${prevRunIdRef.current} → ${snap.runId}. Regenerating narrative.`);
    }
    prevRunIdRef.current = snap.runId;

    const findings = extractQuantifiedFindings(snap);
    return generateNarrative(findings);
  }, [snapshot]);

  // ── NOT COMPUTED STATE ──
  if (!snapshot || !snapshot.computed) {
    const reason = snapshot && !snapshot.computed ? snapshot.reason : "No analysis data.";
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>System Commentary</span>
          <span className={styles.sourceEmpty}>No Data</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <div className={styles.emptyTitle}>No Commentary Available</div>
          <div className={styles.emptyText}>{reason}</div>
        </div>
        {/* Minimal console strip */}
        <div className={styles.consoleStrip}>
          <div className={styles.consoleTitle}>Simulation Console</div>
          <div className={styles.consoleGrid}>
            <div className={styles.consoleRow}>
              <span className={styles.consoleLabel}>Status</span>
              <span className={`${styles.consoleStatus} ${styles.statusIdle}`}>Idle</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const snap = snapshot as SystemAnalysisSnapshot;
  const blocks = narrativeOutput?.blocks ?? [];

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>System Commentary</span>
        <span className={styles.sourceSim}>
          <span className={styles.sourceDotSim} />
          Simulation
        </span>
      </div>

      {/* TIMESTAMP / RUN ID */}
      <div className={styles.timestampRow}>
        <span className={styles.timestampLabel}>Run</span>
        <span className={styles.timestampValue}>{snap.runId.slice(0, 16)}</span>
        <span className={styles.timestampLabel} style={{ marginLeft: "auto" }}>At</span>
        <span className={styles.timestampValue}>{formatTimestamp(snap.timestamp)}</span>
      </div>

      {/* COMMENTARY BLOCKS */}
      {blocks.length > 0 ? (
        <div className={styles.blocks}>
          {blocks.map((block) => (
            <BlockRow key={block.id} block={block} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <div className={styles.emptyTitle}>No Commentary Available</div>
          <div className={styles.emptyText}>
            Run a simulation to generate system commentary.
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
            <span className={styles.consoleLabel}>Iterations</span>
            <span className={styles.consoleValue}>
              {snap.simulationSummary.iterations.toLocaleString()}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Seed</span>
            <span className={styles.consoleValue}>Deterministic</span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Horizon</span>
            <span className={styles.consoleValue}>
              {snap.simulationSummary.timeHorizonMonths}mo
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Duration</span>
            <span className={styles.consoleValue}>
              {(snap.simulationSummary.executionTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>RunId</span>
            <span className={styles.consoleValue}>
              {snap.runId.slice(0, 12)}
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Confidence</span>
            <span className={styles.consoleValue}>
              {snap.confidenceScore.confidenceScore.toFixed(0)} ({snap.confidenceScore.classification})
            </span>
          </div>
          <div className={styles.consoleRow}>
            <span className={styles.consoleLabel}>Status</span>
            <span className={`${styles.consoleStatus} ${styles.statusComplete}`}>
              Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

SystemCommentaryPanel.displayName = "SystemCommentaryPanel";

export default SystemCommentaryPanel;
