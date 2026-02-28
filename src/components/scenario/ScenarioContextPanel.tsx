// src/components/scenario/ScenarioContextPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — ScenarioContextPanel
// Displays active scenario's decision question, key assumptions (top 3),
// and simulation status. Reads from phase1ScenarioStore.
//
// DATA SOURCE: usePhase1ScenarioStore (activeScenarioId → scenario.identity)
// OUTPUT: Pure presentation — no writes.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import type { SimulationStatus } from "@/state/phase1ScenarioStore";
import styles from "./ScenarioContextPanel.module.css";

// ── Status helpers ──

function statusLabel(status: SimulationStatus): string {
  switch (status) {
    case "draft":    return "Draft";
    case "running":  return "Running";
    case "complete": return "Complete";
    case "error":    return "Error";
    default:         return "—";
  }
}

function statusClass(status: SimulationStatus): string {
  switch (status) {
    case "draft":    return styles.statusDraft;
    case "running":  return styles.statusRunning;
    case "complete": return styles.statusComplete;
    case "error":    return styles.statusError;
    default:         return styles.statusDraft;
  }
}

// ── Component ──

const ScenarioContextPanel: React.FC = memo(() => {
  const activeId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenario = usePhase1ScenarioStore((s) =>
    s.scenarios.find((sc) => sc.id === activeId),
  );

  if (!scenario || !scenario.identity) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Scenario Context</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyText}>
            No active scenario — submit a decision to begin
          </div>
        </div>
      </div>
    );
  }

  const { identity, status } = scenario;

  return (
    <div className={styles.wrapper}>
      {/* Header + status */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Scenario Context</span>
        <span className={`${styles.statusBadge} ${statusClass(status)}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className={styles.body}>
        {/* Decision question */}
        <div>
          <div className={styles.decisionLabel}>Decision</div>
          <div className={styles.decisionText}>{identity.decisionQuestion}</div>
        </div>

        {/* Assumptions (top 3) */}
        {identity.assumptionsSummary.length > 0 && (
          <div>
            <div className={styles.assumptionsLabel}>Key Assumptions</div>
            <ul className={styles.assumptionsList}>
              {identity.assumptionsSummary.map((a, i) => (
                <li key={i} className={styles.assumptionItem}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

ScenarioContextPanel.displayName = "ScenarioContextPanel";
export default ScenarioContextPanel;
