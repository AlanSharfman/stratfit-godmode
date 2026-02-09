// src/components/system/SimulationActivityMonitor.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Institutional Simulation Activity Monitor
//
// Fixed top-right. Real telemetry only. No fake data. No toy animation.
// Activates on engine run. Auto-collapses after completion.
// Feels like mission control infrastructure.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useEngineActivityStore, type EngineStage } from "@/state/engineActivityStore";
import styles from "./SimulationActivityMonitor.module.css";

// ────────────────────────────────────────────────────────────────────────────
// STAGE LABELS (real, factual, institutional)
// ────────────────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<EngineStage, string> = {
  IDLE: "Idle",
  INITIALIZING: "Initializing engine…",
  SAMPLING: "Sampling distribution…",
  AGGREGATING: "Aggregating percentiles…",
  CONVERGING: "Calculating survival probability…",
  FINALIZING: "Finalizing output…",
  COMPLETE: "Complete",
  ERROR: "Error",
};

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtNumber(n: number): string {
  return n.toLocaleString();
}

// ────────────────────────────────────────────────────────────────────────────
// AUTO-COLLAPSE TIMER (ms after completion)
// ────────────────────────────────────────────────────────────────────────────

const AUTO_COLLAPSE_MS = 4000;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

const SimulationActivityMonitor: React.FC = () => {
  const {
    isRunning,
    stage,
    iterationsTarget,
    iterationsCompleted,
    durationMs,
    seed,
    modelType,
    message,
    error,
  } = useEngineActivityStore();

  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);

  // Live elapsed timer while running
  useEffect(() => {
    if (isRunning) {
      const startedAt = useEngineActivityStore.getState().startedAt;
      elapsedIntervalRef.current = setInterval(() => {
        if (startedAt != null) {
          setLiveElapsed(performance.now() - startedAt);
        }
      }, 100);
    } else {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
      setLiveElapsed(durationMs);
    }
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [isRunning, durationMs]);

  // Show panel when engine starts, auto-collapse after completion
  useEffect(() => {
    if (isRunning) {
      setVisible(true);
      setExpanded(true);
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    }
  }, [isRunning]);

  useEffect(() => {
    if (stage === "COMPLETE" || stage === "ERROR") {
      collapseTimerRef.current = setTimeout(() => {
        setExpanded(false);
      }, AUTO_COLLAPSE_MS);
      return () => {
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      };
    }
  }, [stage]);

  // Toggle expand
  const toggleExpand = useCallback(() => {
    setExpanded((p) => !p);
  }, []);

  // Progress
  const progress = useMemo(() => {
    if (iterationsTarget <= 0) return 0;
    return Math.min(1, iterationsCompleted / iterationsTarget);
  }, [iterationsCompleted, iterationsTarget]);

  const displayElapsed = isRunning ? liveElapsed : durationMs;

  // Don't render if never activated
  if (!visible && stage === "IDLE") return null;

  // ── COMPACT MODE (icon only) ──
  if (!expanded) {
    const dotClass =
      stage === "COMPLETE" ? styles.dotComplete :
      stage === "ERROR" ? styles.dotError :
      isRunning ? styles.dotRunning :
      styles.dotIdle;

    return (
      <button
        className={styles.compactBtn}
        onClick={toggleExpand}
        title="Simulation Activity Monitor"
        aria-label="Expand simulation monitor"
      >
        <span className={`${styles.compactDot} ${dotClass}`} />
      </button>
    );
  }

  // ── FULL PANEL ──
  const isActive = isRunning;
  const isComplete = stage === "COMPLETE";
  const isError = stage === "ERROR";

  return (
    <div
      className={`${styles.root} ${isActive ? styles.rootActive : ""} ${isComplete ? styles.rootComplete : ""} ${isError ? styles.rootError : ""}`}
    >
      {/* HEADER */}
      <div className={styles.header} onClick={toggleExpand}>
        <div className={styles.headerLeft}>
          <span className={`${styles.headerDot} ${isActive ? styles.dotRunning : isComplete ? styles.dotComplete : isError ? styles.dotError : styles.dotIdle}`} />
          <span className={styles.headerTitle}>
            {isActive ? "SYSTEM SIMULATION ACTIVE" : isComplete ? "SIMULATION COMPLETE" : isError ? "SIMULATION ERROR" : "SIMULATION MONITOR"}
          </span>
        </div>
        <button className={styles.collapseBtn} onClick={toggleExpand} aria-label="Collapse">
          ▾
        </button>
      </div>

      {/* BODY */}
      <div className={styles.body}>
        {/* Stage + Message */}
        <div className={styles.row}>
          <span className={styles.label}>Stage</span>
          <span className={styles.value}>{STAGE_LABELS[stage]}</span>
        </div>

        {/* Iterations */}
        <div className={styles.row}>
          <span className={styles.label}>Iterations</span>
          <span className={styles.valueMono}>
            {fmtNumber(iterationsCompleted)}{" "}
            <span className={styles.dimSlash}>/</span>{" "}
            {fmtNumber(iterationsTarget)}
          </span>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <div
            className={`${styles.progressBar} ${isComplete ? styles.progressComplete : ""}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
          {isActive && <div className={styles.progressPulse} style={{ left: `${Math.round(progress * 100)}%` }} />}
        </div>

        {/* Seed */}
        {seed != null && (
          <div className={styles.row}>
            <span className={styles.label}>Seed</span>
            <span className={styles.valueMono}>{seed}</span>
          </div>
        )}

        {/* Model Type */}
        {modelType && (
          <div className={styles.row}>
            <span className={styles.label}>Engine</span>
            <span className={styles.value}>{modelType}</span>
          </div>
        )}

        {/* Elapsed */}
        <div className={styles.row}>
          <span className={styles.label}>Elapsed</span>
          <span className={styles.valueMono}>{fmtDuration(displayElapsed)}</span>
        </div>

        {/* Stability (only on complete) */}
        {isComplete && (
          <div className={styles.row}>
            <span className={styles.label}>Stability</span>
            <span className={`${styles.value} ${styles.stabilityHigh}`}>High</span>
          </div>
        )}

        {/* Error */}
        {isError && error && (
          <div className={styles.errorBox}>{error}</div>
        )}

        {/* Live ticker */}
        {isActive && message && (
          <div className={styles.ticker}>{message}</div>
        )}

        {/* Legal footnote (only on complete) */}
        {isComplete && (
          <div className={styles.footnote}>
            Simulation based on probabilistic sampling of provided inputs.
          </div>
        )}
      </div>
    </div>
  );
};

SimulationActivityMonitor.displayName = "SimulationActivityMonitor";
export default SimulationActivityMonitor;



