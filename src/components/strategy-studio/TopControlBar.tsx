// src/components/strategy-studio/TopControlBar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategy Studio 2.0 Control Bar
// Scenario tabs, Horizon, Ramp type, Compare toggle, Simulate
// Institutional. No pills. No glow. Cyan underline active state.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import styles from "./StrategyStudio.module.css";

export type ScenarioTab = "baseline" | "scenarioA" | "scenarioB";
export type Horizon = 12 | 24 | 36 | 60;
export type RampType = "immediate" | "6m" | "12m";

interface TopControlBarProps {
  activeTab: ScenarioTab;
  onTabChange: (tab: ScenarioTab) => void;
  horizon: Horizon;
  onHorizonChange: (h: Horizon) => void;
  rampType: RampType;
  onRampTypeChange: (r: RampType) => void;
  compareMode: boolean;
  onCompareModeToggle: () => void;
  onSimulate?: () => void;
}

const TABS: { id: ScenarioTab; label: string }[] = [
  { id: "baseline", label: "Baseline" },
  { id: "scenarioA", label: "Scenario A" },
  { id: "scenarioB", label: "Scenario B" },
];

const HORIZONS: Horizon[] = [12, 24, 36, 60];

const RAMP_OPTIONS: { id: RampType; label: string }[] = [
  { id: "immediate", label: "Imm" },
  { id: "6m", label: "6mo" },
  { id: "12m", label: "12mo" },
];

export const TopControlBar: React.FC<TopControlBarProps> = memo(({
  activeTab,
  onTabChange,
  horizon,
  onHorizonChange,
  rampType,
  onRampTypeChange,
  compareMode,
  onCompareModeToggle,
  onSimulate,
}) => {
  return (
    <div className={styles.controlBar}>
      {/* Scenario Tabs */}
      <div className={styles.scenarioTabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isBaseline = tab.id === "baseline";
          let cls = styles.scenarioTab;
          if (isActive && isBaseline) cls = styles.scenarioTabBaselineActive;
          else if (isActive) cls = styles.scenarioTabActive;
          else if (isBaseline) cls = styles.scenarioTabBaseline;
          return (
            <button
              key={tab.id}
              type="button"
              className={cls}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
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

      {/* Ramp Type Selector */}
      <div className={styles.controlGroup}>
        <span className={styles.controlLabel}>Ramp</span>
        {RAMP_OPTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={rampType === r.id ? styles.controlBtnActive : styles.controlBtn}
            onClick={() => onRampTypeChange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className={styles.controlDivider} />

      {/* Compare Toggle */}
      <button
        type="button"
        className={compareMode ? styles.toggleBtnActive : styles.toggleBtn}
        onClick={onCompareModeToggle}
      >
        Compare
      </button>

      {/* Spacer */}
      <div className={styles.controlSpacer} />

      {/* Simulate Button */}
      {onSimulate && (
        <button
          type="button"
          className={styles.simulateBtn}
          onClick={onSimulate}
        >
          Run Simulation
        </button>
      )}
    </div>
  );
});

TopControlBar.displayName = "TopControlBar";


        onClick={onCompareModeToggle}
      >
        Compare
      </button>

      {/* Spacer */}
      <div className={styles.controlSpacer} />

      {/* Simulate Button */}
      {onSimulate && (
        <button
          type="button"
          className={styles.simulateBtn}
          onClick={onSimulate}
        >
          Run Simulation
        </button>
      )}
    </div>
  );
});

TopControlBar.displayName = "TopControlBar";


        onClick={onCompareModeToggle}
  
  TopControlBar.displayName = "TopControlBar";
  );
});

TopControlBar.displayName = "TopControlBar";


        onClick={onCompareModeToggle}
      >
        Compare
      </button>

      {/* Spacer */}
      <div className={styles.controlSpacer} />

          TopControlBar.displayName = "TopControlBar";
      {onSimulate && (
        <button
          type="button"
          className={styles.simulateBtn}
          onClick={onSimulate}
        >
          Run Simulation
        </button>
      )}
    </div>
  );
});

TopControlBar.displayName = "TopControlBar";


        onClick={onCompareModeToggle}
      >
        Compare
      </button>

      {/* Spacer */}
      <div className={styles.controlSpacer} />

      {/* Simulate Button */}
      {onSimulate && (
        <button
          type="button"
          className={styles.simulateBtn}
          onClick={onSimulate}
        >
          Run Simulation
        </button>
      )}
    </div>
  );
});

TopControlBar.displayName = "TopControlBar";

