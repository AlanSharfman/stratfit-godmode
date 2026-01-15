// src/components/compound/impact/ImpactView.tsx
// PHASE-IG: War-Room 3-Zone Layout (ledger-only, instrument-ready)

import { useMemo } from "react";
import RiskBreakdownPanel from "@/components/center/RiskBreakdownPanel";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import styles from "./ImpactView.module.css";

export default function ImpactView() {
  const { engineResults, activeScenarioId } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      activeScenarioId: s.activeScenarioId,
    }))
  );

  const ledger = useMemo(() => {
    if (!engineResults) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  // Severity helper (presentation-only, derived from ledger)
  const severity = useMemo(() => {
    if (!ledger) return "neutral";
    
    // Simple severity rule: if Risk or Runway move negatively and materially, escalate
    const riskUp = ledger.riskScore.delta > 15; // danger increasing
    const runwayDown = ledger.runwayMonths.delta < -6; // runway shrinking
    
    if (riskUp && runwayDown) return "critical";
    if (riskUp || runwayDown) return "elevated";
    return "stable";
  }, [ledger]);

  const hasEngine = !!engineResults && Object.keys(engineResults).length > 0;
  const baseHasKpis = !!(engineResults as any)?.base?.kpis && Object.keys((engineResults as any).base.kpis).length > 0;

  if (!hasEngine || !baseHasKpis) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <div className={styles.kicker}>Cross-scenario impact analysis</div>
            <div className={styles.titleRow}>
              <h1 className={styles.h1}>Impact Map</h1>
              <div className={styles.badge}>AWAITING DATA</div>
            </div>
            <div className={styles.hint}>
              Waiting for scenario engine results. Run Base and another scenario to generate impact analysis.
            </div>
          </header>
          
          <section className={styles.empty}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyTitle}>No Engine Data</div>
              <div className={styles.emptyBody}>
                The impact map derives from Base → Scenario deltas. Adjust levers and select a scenario (Upside/Downside/Stress) to see risk breakdown.
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.kicker}>Base → {activeScenarioId} • {severity.toUpperCase()}</div>
          <div className={styles.titleRow}>
            <h1 className={styles.h1}>Impact Map</h1>
            <div className={styles.badge}>LIVE</div>
          </div>
          <div className={styles.hint}>
            Showing delta surface for <strong>{activeScenarioId}</strong> scenario vs Base case. 
            Heatmap intensity reflects magnitude of change across key risk vectors.
          </div>
        </header>

        <div className={styles.zones}>
          {/* Zone A: Future slot for Scenario Delta Snapshot (collapsed panel) */}
          {/* <div className={styles.zoneA}>
            <ScenarioDeltaSnapshot collapsed />
          </div> */}

          {/* Zone B: Risk Breakdown (main heatmap) */}
          <div className={styles.zoneB}>
            <RiskBreakdownPanel ledger={ledger} />
          </div>

          {/* Zone C: Future slot for Variance Commentary or Event Timeline */}
          {/* <div className={styles.zoneC}>
            <VarianceCommentary ledger={ledger} />
          </div> */}
        </div>
      </div>
    </div>
  );
}
