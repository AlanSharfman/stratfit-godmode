// src/pages/objective/ObjectivePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Objectives Page (INTENT LAYER)
// Navigation Contract: src/contracts/navigationContract.ts
//
// ROLE: Define targets, constraints, and priority mode.
// READS: Initiate snapshot (read-only via SystemBaselineProvider).
// WRITES: baseline.objectives (ObjectivesSnapshot) on Save & Continue.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AmbitionPanel from "./components/AmbitionPanel";
import StructuralDemandPanel from "./components/StructuralDemandPanel";
import ObjectiveIntelligencePanel from "./components/ObjectiveIntelligencePanel";
import styles from "./ObjectivePage.module.css";
import { useObjectiveStore } from "@/state/objectiveStore";
import { useObjectiveLensStore } from "@/state/objectiveLensStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { RouteContract } from "@/app/navigation/routeContract";
import type { ObjectivesSnapshot } from "@/onboard/baseline/types";

export default function ObjectivePage() {
  const navigate = useNavigate();
  const { baseline, setBaseline } = useSystemBaseline();

  const { horizonMonths, targets, mode, result } = useObjectiveStore();
  const { lens } = useObjectiveLensStore();

  const handleSaveAndContinue = useCallback(() => {
    if (!baseline) return;

    const snapshot: ObjectivesSnapshot = {
      horizonMonths,
      mode,
      lens,
      targets: { ...targets },
      result,
    };

    setBaseline({ ...baseline, objectives: snapshot });
    navigate(RouteContract.position, { replace: true });
  }, [baseline, setBaseline, navigate, horizonMonths, mode, lens, targets, result]);

  return (
    <div className={styles.objectivePage}>
      {/* Header bar with Save & Continue */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Strategic Objective</h1>
          <p>Define targets · Confirm model · Proceed to position</p>
        </div>
        <div className={styles.headerControls}>
          <button
            className={styles.segBtnActive}
            onClick={handleSaveAndContinue}
            disabled={!baseline}
          >
            SAVE &amp; CONTINUE →
          </button>
        </div>
      </div>

      {/* Three-panel grid */}
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
      </div>
    </div>
  );
}
