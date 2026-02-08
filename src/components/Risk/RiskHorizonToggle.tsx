// src/components/Risk/RiskHorizonToggle.tsx
// STRATFIT — Horizon Toggle: SHORT (0-6m) | MID (6-18m) | LONG (18-36m)
// + View toggle: RADAR | DENSITY | BREAKDOWN

import React from "react";
import styles from "./RiskPage.module.css";

export type RiskHorizon = "short" | "mid" | "long";
export type RiskViewMode = "radar" | "density" | "breakdown";

interface RiskHorizonToggleProps {
  horizon: RiskHorizon;
  onHorizonChange: (h: RiskHorizon) => void;
  viewMode: RiskViewMode;
  onViewModeChange: (v: RiskViewMode) => void;
}

const HORIZONS: { id: RiskHorizon; label: string; range: string }[] = [
  { id: "short", label: "Short", range: "0–6m" },
  { id: "mid", label: "Mid", range: "6–18m" },
  { id: "long", label: "Long", range: "18–36m" },
];

const VIEWS: { id: RiskViewMode; label: string }[] = [
  { id: "radar", label: "Radar" },
  { id: "density", label: "Density" },
  { id: "breakdown", label: "Breakdown" },
];

const RiskHorizonToggle: React.FC<RiskHorizonToggleProps> = ({
  horizon,
  onHorizonChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className={styles.horizonBar}>
      <span className={styles.horizonLabel}>Horizon</span>
      {HORIZONS.map((h, i) => (
        <React.Fragment key={h.id}>
          {i > 0 && <span className={styles.horizonSep} />}
          <button
            type="button"
            className={`${styles.horizonBtn} ${horizon === h.id ? styles.horizonBtnActive : ""}`}
            onClick={() => onHorizonChange(h.id)}
          >
            {h.label} <span style={{ opacity: 0.5 }}>({h.range})</span>
          </button>
        </React.Fragment>
      ))}

      {/* View toggle */}
      <div className={styles.viewToggle}>
        <span className={styles.viewLabel}>View</span>
        {VIEWS.map((v, i) => (
          <React.Fragment key={v.id}>
            {i > 0 && <span className={styles.horizonSep} />}
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === v.id ? styles.viewBtnActive : ""}`}
              onClick={() => onViewModeChange(v.id)}
            >
              {v.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default RiskHorizonToggle;





