import React from "react";
import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import styles from "./CenterViewPanel.module.css";

/**
 * HudKpis — G-D MODE: 3-card KPI row (Resilience, Momentum, Quality)
 * 
 * Contract:
 * - Fixed 3-column grid (responsive to 1-col on narrow viewports)
 * - Typography polish: no harsh white numerics
 * - No margin drift
 */
export default function HudKpis() {
  const scenario = useScenario();
  const engineResults = useScenarioStore((s) => s.engineResults);
  
  const result = engineResults?.[scenario];
  const kpis = result?.kpis || {};

  // Extract top 3 metrics (adapt these to your actual KPI keys)
  const resilience = kpis.riskIndex?.value ?? 50;
  const momentum = kpis.ebitdaMargin?.value ?? 15;
  const quality = kpis.cashRunway?.value ?? 12;

  return (
    <div className={styles.sfHudRow}>
      {/* RESILIENCE */}
      <div className={styles.sfHudCard}>
        <div className={styles.sfHudCardInner}>
          <div className={styles.sfHudLabel}>Resilience</div>
          <div className={styles.sfHudValue}>{resilience.toFixed(0)}</div>
        </div>
      </div>

      {/* MOMENTUM */}
      <div className={styles.sfHudCard}>
        <div className={styles.sfHudCardInner}>
          <div className={styles.sfHudLabel}>Momentum</div>
          <div className={styles.sfHudValue}>{momentum.toFixed(1)}%</div>
        </div>
      </div>

      {/* QUALITY */}
      <div className={styles.sfHudCard}>
        <div className={styles.sfHudCardInner}>
          <div className={styles.sfHudLabel}>Quality</div>
          <div className={styles.sfHudValue}>{quality.toFixed(0)} mo</div>
        </div>
      </div>
    </div>
  );
}

