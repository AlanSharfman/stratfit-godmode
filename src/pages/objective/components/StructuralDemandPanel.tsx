import React from "react";
import styles from "../ObjectivePage.module.css";

export default function StructuralDemandPanel() {
  return (
    <section className={styles.structuralDemandPanel}>
      <h2 className={styles.panelTitle}>STRUCTURAL REQUIREMENTS</h2>
      <div className={styles.feasibilityScoreWrap}>
        <div className={styles.feasibilityScoreLabel}>FEASIBILITY SCORE</div>
        <div className={styles.feasibilityScoreValue}>82</div>
        <div className={styles.feasibilityScoreSub}>Probability of Achieving Objective: 68%</div>
      </div>
      <div className={styles.demandBars}>
        <div className={styles.demandBar}>
          <span className={styles.demandLabel}>Required Net Revenue Retention</span>
          <div className={styles.demandZone}><span className={styles.greenZone}>Achievable</span><span className={styles.amberZone}>Stretch</span><span className={styles.redZone}>Structurally aggressive</span></div>
        </div>
        <div className={styles.demandBar}>
          <span className={styles.demandLabel}>Required CAC Efficiency</span>
          <div className={styles.demandZone}><span className={styles.greenZone}>Achievable</span><span className={styles.amberZone}>Stretch</span><span className={styles.redZone}>Structurally aggressive</span></div>
        </div>
        <div className={styles.demandBar}>
          <span className={styles.demandLabel}>Required Margin Discipline</span>
          <div className={styles.demandZone}><span className={styles.greenZone}>Achievable</span><span className={styles.amberZone}>Stretch</span><span className={styles.redZone}>Structurally aggressive</span></div>
        </div>
        <div className={styles.demandBar}>
          <span className={styles.demandLabel}>Required Pipeline Coverage</span>
          <div className={styles.demandZone}><span className={styles.greenZone}>Achievable</span><span className={styles.amberZone}>Stretch</span><span className={styles.redZone}>Structurally aggressive</span></div>
        </div>
        <div className={styles.demandBar}>
          <span className={styles.demandLabel}>Required Headcount Ceiling</span>
          <div className={styles.demandZone}><span className={styles.greenZone}>Achievable</span><span className={styles.amberZone}>Stretch</span><span className={styles.redZone}>Structurally aggressive</span></div>
        </div>
      </div>
    </section>
  );
}
