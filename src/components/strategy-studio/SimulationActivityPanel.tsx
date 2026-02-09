// src/components/strategy-studio/SimulationActivityPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Inline Simulation Activity Module
//
// Small, non-blocking activity indicator that appears in the Strategy Studio
// while a Monte Carlo simulation is running. Shows real telemetry:
// - Status text
// - Iteration count
// - Method summary
// - Completion state
//
// Must not block UI. Driven by real engine state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import styles from "./StrategyStudio.module.css";

interface SimulationActivityPanelProps {
  /** Whether simulation is currently running */
  isRunning: boolean;
  /** Current iteration count */
  iterationsCompleted: number;
  /** Target iteration count */
  iterationsTarget: number;
  /** Elapsed duration in ms */
  durationMs: number;
  /** Simulation method label */
  methodLabel?: string;
  /** Whether simulation just completed (for completion flash) */
  justCompleted: boolean;
}

const SimulationActivityPanel: React.FC<SimulationActivityPanelProps> = memo(({
  isRunning,
  iterationsCompleted,
  iterationsTarget,
  durationMs,
  methodLabel = "Monte Carlo",
  justCompleted,
}) => {
  const progress = useMemo(() => {
    if (iterationsTarget <= 0) return 0;
    return Math.min(100, (iterationsCompleted / iterationsTarget) * 100);
  }, [iterationsCompleted, iterationsTarget]);

  const elapsed = useMemo(() => {
    if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  }, [durationMs]);

  const statusText = useMemo(() => {
    if (justCompleted) return "SIMULATION COMPLETE";
    if (isRunning) return "SIMULATING";
    return "IDLE";
  }, [isRunning, justCompleted]);

  if (!isRunning && !justCompleted) return null;

  return (
    <div
      className={`${styles.simMonitor} ${justCompleted ? styles.simMonitorComplete : ""}`}
    >
      {/* Status header */}
      <div className={styles.simMonitorHeader}>
        <span
          className={
            isRunning ? styles.simMonitorDotActive : styles.simMonitorDotComplete
          }
        />
        <span className={styles.simMonitorStatus}>{statusText}</span>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className={styles.simMonitorProgressWrap}>
          <div
            className={styles.simMonitorProgress}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Telemetry */}
      <div className={styles.simMonitorTelemetry}>
        <div className={styles.simMonitorRow}>
          <span className={styles.simMonitorLabel}>Iterations</span>
          <span className={styles.simMonitorValue}>
            {iterationsCompleted.toLocaleString()}
            {isRunning && ` / ${iterationsTarget.toLocaleString()}`}
          </span>
        </div>
        <div className={styles.simMonitorRow}>
          <span className={styles.simMonitorLabel}>Method</span>
          <span className={styles.simMonitorValue}>{methodLabel}</span>
        </div>
        {durationMs > 0 && (
          <div className={styles.simMonitorRow}>
            <span className={styles.simMonitorLabel}>Elapsed</span>
            <span className={styles.simMonitorValue}>{elapsed}</span>
          </div>
        )}
      </div>

      {/* Legal */}
      {justCompleted && (
        <div className={styles.simMonitorLegal}>
          Simulation based on probabilistic sampling of provided inputs.
        </div>
      )}
    </div>
  );
});

SimulationActivityPanel.displayName = "SimulationActivityPanel";
export default SimulationActivityPanel;


