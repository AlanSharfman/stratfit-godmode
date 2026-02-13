import React from "react";
import AmbitionPanel from "./components/AmbitionPanel";
import StructuralDemandPanel from "./components/StructuralDemandPanel";
import ObjectiveIntelligencePanel from "./components/ObjectiveIntelligencePanel";
import styles from "./ObjectivePage.module.css";

export default function ObjectivePage() {
  return (
    <div className={styles.objectivePageGrid}>
      {/* Left: Ambition (Define the Crest) */}
      <div className={styles.leftColumn}>
        <AmbitionPanel />
      </div>

      {/* Center: Structural Demands (The Cost of Ambition) */}
      <div className={styles.centerColumn}>
        <StructuralDemandPanel />
      </div>

      {/* Right: Tension Intelligence (Board-Level Narrative) */}
      <div className={styles.rightColumn}>
        <ObjectiveIntelligencePanel />
      </div>

      {/* Optional: Crest Silhouette overlay */}
      <div className={styles.crestSilhouette} />
    </div>
  );
}


function severityColor(severity: number): string {

