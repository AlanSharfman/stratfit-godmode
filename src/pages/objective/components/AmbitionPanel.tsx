import React from "react";
import styles from "../ObjectivePage.module.css";

export default function AmbitionPanel() {
  return (
    <section className={styles.ambitionPanel}>
      <h2 className={styles.panelTitle}>DEFINE THE CREST</h2>
      <div className={styles.ambitionBlocks}>
        {/* Growth Block */}
        <div className={styles.ambitionBlock}>
          <div className={styles.ambitionLabel}>Revenue Ambition</div>
          <input type="range" min={500000} max={100000000} step={500000} className={styles.slider} />
          <div className={styles.ambitionDescriptor}>Target annual scale within selected horizon.</div>
        </div>
        <div className={styles.ambitionBlock}>
          <div className={styles.ambitionLabel}>Growth Intensity</div>
          <input type="range" min={0} max={200} step={1} className={styles.slider} />
          <div className={styles.ambitionDescriptor}>Speed at which expansion is pursued.</div>
        </div>
        <div className={styles.ambitionBlock}>
          <div className={styles.ambitionLabel}>Margin Standard</div>
          <input type="range" min={10} max={95} step={1} className={styles.slider} />
          <div className={styles.ambitionDescriptor}>Operating efficiency required to sustain ambition.</div>
        </div>
        {/* Capital Block */}
        <div className={styles.ambitionBlock}>
          <div className={styles.ambitionLabel}>Risk Tolerance</div>
          <input type="range" min={20} max={99} step={1} className={styles.slider} />
          <div className={styles.ambitionDescriptor}>Minimum acceptable survival probability.</div>
        </div>
        <div className={styles.ambitionBlock}>
          <div className={styles.ambitionLabel}>Capital Buffer Horizon</div>
          <input type="range" min={3} max={48} step={1} className={styles.slider} />
          <div className={styles.ambitionDescriptor}>Desired runway stability threshold.</div>
        </div>
      </div>
    </section>
  );
}
