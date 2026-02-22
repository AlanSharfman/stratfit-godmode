import React from "react";
import styles from "../ObjectivePage.module.css";
import { useObjectiveStore } from "@/state/objectiveStore";

export default function ObjectiveIntelligencePanel() {
  const { result } = useObjectiveStore();
  const { primaryConstraint, successConditions, conflicts, riskFlags, constraintRank } = result;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>OBJECTIVE INTELLIGENCE</h2>

      {/* Primary structural constraint */}
      <div className={styles.intelligenceBlock}>
        <div className={styles.intelligenceLabel}>PRIMARY STRUCTURAL CONSTRAINT</div>
        <div className={styles.primaryConstraint}>{primaryConstraint}</div>
      </div>

      {/* Key trade-offs from top constraints */}
      {constraintRank.length > 1 && (
        <div className={styles.intelligenceBlock}>
          <div className={styles.intelligenceLabel}>KEY TRADE-OFFS</div>
          {constraintRank.slice(0, 3).map((c) => (
            <div className={styles.constraintItem} key={c.id}>
              <span
                className={styles.severityDot}
                style={{
                  background:
                    c.severity > 0.65
                      ? "rgba(248,113,113,0.9)"
                      : c.severity > 0.35
                      ? "rgba(251,191,36,0.9)"
                      : "rgba(52,211,153,0.9)",
                }}
              />
              <div>
                <div className={styles.constraintLabel}>{c.label}</div>
                <div className={styles.constraintNote}>{c.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className={styles.intelligenceBlock}>
          <div className={styles.sectionLabel}>CONFLICTS DETECTED</div>
          {conflicts.map((c) => (
            <div className={styles.conflictItem} key={c.id}>
              <span className={styles.flagIcon}>▲</span>
              <span>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success conditions */}
      <div className={styles.intelligenceBlock}>
        <div className={styles.intelligenceLabel}>REQUIRED CONDITIONS FOR SUCCESS</div>
        <ul className={styles.intelligenceList}>
          {successConditions.map((cond, i) => (
            <li className={styles.checklistItem} key={i}>
              <span className={styles.checkIcon}>✓</span>
              <span>{cond}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className={styles.intelligenceBlock}>
          <div className={styles.sectionLabel}>RISK FLAGS</div>
          {riskFlags.map((flag, i) => (
            <div className={styles.conflictItem} key={i}>
              <span className={styles.flagIcon}>⚠</span>
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
