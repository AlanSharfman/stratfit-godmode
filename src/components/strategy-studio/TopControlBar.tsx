// src/components/strategy-studio/TopControlBar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategy Studio Top Control Bar
// Objective selector, Horizon selector, Baseline/Scenario toggle, Advanced Mode
// Institutional. No pills. No glow. Cyan underline active state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import styles from "./StrategyStudio.module.css";

export type Objective = "SURVIVAL" | "GROWTH" | "EXIT";
export type Horizon = 6 | 12 | 18 | 24 | 36;

interface TopControlBarProps {
  objective: Objective;
  onObjectiveChange: (o: Objective) => void;
  horizon: Horizon;
  onHorizonChange: (h: Horizon) => void;
  showBaseline: boolean;
  onBaselineToggle: () => void;
  advancedMode: boolean;
  onAdvancedModeToggle: () => void;
}

const OBJECTIVES: Objective[] = ["SURVIVAL", "GROWTH", "EXIT"];
const HORIZONS: Horizon[] = [6, 12, 18, 24, 36];

export const TopControlBar: React.FC<TopControlBarProps> = memo(({
  objective,
  onObjectiveChange,
  horizon,
  onHorizonChange,
  showBaseline,
  onBaselineToggle,
  advancedMode,
  onAdvancedModeToggle,
}) => {
  return (
    <div className={styles.controlBar}>
      {/* Objective Selector */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Objective</span>
        {OBJECTIVES.map((o) => (
          <button
            key={o}
            type="button"
            className={objective === o ? styles.controlBtnActive : styles.controlBtn}
            onClick={() => onObjectiveChange(o)}
          >
            {o}
          </button>
        ))}
      </div>

      <div className={styles.controlDivider} />

      {/* Horizon Selector */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Horizon</span>
        {HORIZONS.map((h) => (
          <button
            key={h}
            type="button"
            className={horizon === h ? styles.controlBtnActive : styles.controlBtn}
            onClick={() => onHorizonChange(h)}
          >
            {h}m
          </button>
        ))}
      </div>

      <div className={styles.controlDivider} />

      {/* Baseline / Scenario Toggle */}
      <button
        type="button"
        className={showBaseline ? styles.toggleBtnActive : styles.toggleBtn}
        onClick={onBaselineToggle}
      >
        {showBaseline ? "Baseline" : "Scenario"}
      </button>

      {/* Spacer */}
      <div className={styles.controlSpacer} />

      {/* Advanced Mode Toggle (right aligned) */}
      <button
        type="button"
        className={advancedMode ? styles.toggleBtnActive : styles.toggleBtn}
        onClick={onAdvancedModeToggle}
      >
        Advanced
      </button>
    </div>
  );
});

TopControlBar.displayName = "TopControlBar";





