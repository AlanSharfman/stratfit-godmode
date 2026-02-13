import React from "react";
import styles from "../ObjectivePage.module.css";

export default function ObjectiveIntelligencePanel() {
  return (
    <section className={styles.objectiveIntelligencePanel}>
      <h2 className={styles.panelTitle}>OBJECTIVE INTELLIGENCE</h2>
      <div className={styles.intelligenceBlock}>
        <div className={styles.intelligenceLabel}>PRIMARY STRUCTURAL CONSTRAINT</div>
        <div className={styles.intelligenceValue}>Growth intensity requires margin discipline above 68%.</div>
      </div>
      <div className={styles.intelligenceBlock}>
        <div className={styles.intelligenceLabel}>KEY TRADE-OFF</div>
        <div className={styles.intelligenceValue}>Increasing revenue ambition reduces survival probability below tolerance threshold.</div>
      </div>
      <div className={styles.intelligenceBlock}>
        <div className={styles.intelligenceLabel}>REQUIRED CONDITIONS FOR SUCCESS</div>
        <ul className={styles.intelligenceList}>
          <li>Maintain NRR above X%</li>
          <li>Keep burn multiple below Y</li>
          <li>Sustain pipeline coverage at Z</li>
        </ul>
      </div>
    </section>
  );
}
