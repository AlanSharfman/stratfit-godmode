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
import type { ObjectiveLens } from "@/state/objectiveLensStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { RouteContract } from "@/app/navigation/routeContract";
import type { ObjectivesSnapshot } from "@/onboard/baseline/types";
import type { ObjectiveMode } from "@/logic/objectiveEngine";

const MODES: ObjectiveMode[] = ["conservative", "base", "aggressive"];
const LENSES: ObjectiveLens[] = ["survival", "value", "liquidity"];

export default function ObjectivePage() {
  const navigate = useNavigate();
  const { baseline, setBaseline } = useSystemBaseline();

  const { horizonMonths, targets, mode, result, setHorizon, setMode } = useObjectiveStore();
  const { lens, setLens } = useObjectiveLensStore();

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
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Strategic Objective</h1>
          <p>Define targets · Confirm model · Proceed to position</p>
        </div>
        <div className={styles.headerControls}>
          {/* Horizon selector */}
          <div className={styles.horizonWrap}>
            <span className={styles.modeLabel}>HORIZON</span>
            <input
              type="number"
              className={styles.numInput}
              min={3}
              max={60}
              value={horizonMonths}
              onChange={(e) => setHorizon(Number(e.target.value))}
            />
            <span className={styles.horizonUnit}>mo</span>
          </div>

          {/* Mode selector */}
          <div className={styles.segmented}>
            {MODES.map((m) => (
              <button
                key={m}
                className={mode === m ? styles.segBtnActive : styles.segBtn}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Lens selector */}
          <div className={styles.segmented}>
            {LENSES.map((l) => (
              <button
                key={l}
                className={lens === l ? styles.segBtnActive : styles.segBtn}
                onClick={() => setLens(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            className={styles.saveBtn}
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
          <div className={styles.trajectoryRibbon} aria-hidden="true" />
          <div className={styles.centerColumnContent}>
            <StructuralDemandPanel />
          </div>
        </div>

        {/* Right: Tension Intelligence (Board-Level Narrative) */}
        <div className={styles.rightColumn}>
          <ObjectiveIntelligencePanel />
        </div>
      </div>
    </div>
  );
}
