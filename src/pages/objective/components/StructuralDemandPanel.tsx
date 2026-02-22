import React from "react";
import styles from "../ObjectivePage.module.css";
import { useObjectiveStore } from "@/state/objectiveStore";

/* severity → colour class */
function zoneClass(severity: number): string {
  if (severity < 0.35) return styles.greenZone;
  if (severity < 0.65) return styles.amberZone;
  return styles.redZone;
}
function zoneLabel(severity: number): string {
  if (severity < 0.35) return "Achievable";
  if (severity < 0.65) return "Stretch";
  return "Aggressive";
}

export default function StructuralDemandPanel() {
  const { result: { requirements: r, feasibilityScore, constraintRank } } = useObjectiveStore();

  const bars: { label: string; severity: number }[] = [
    { label: "Required Net Revenue Retention", severity: (r.requiredNRR - 100) / 60 },
    { label: "Required CAC Efficiency", severity: r.cacPaybackMonths > 18 ? 0.8 : r.cacPaybackMonths / 24 },
    { label: "Required Margin Discipline", severity: r.operatingDisciplineScore / 100 },
    { label: "Required Pipeline Coverage", severity: (r.pipelineCoverage - 2) / 5 },
    { label: "Required Headcount Ceiling", severity: constraintRank.find((c) => c.id === "burn")?.severity ?? 0.3 },
  ];

  const probPct = Math.max(0, Math.min(100, Math.round(feasibilityScore * 0.85)));

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>STRUCTURAL REQUIREMENTS</h2>

      {/* Feasibility score hero */}
      <div className={styles.feasibilityScoreWrap}>
        <div className={styles.feasibilityScoreLabel}>FEASIBILITY SCORE</div>
        <div className={styles.feasibilityScoreValue}>{feasibilityScore}</div>
        <div className={styles.feasibilityScoreSub}>
          Probability of Achieving Objective: {probPct}%
        </div>
      </div>

      {/* Demand bars */}
      <div className={styles.demandBars}>
        {bars.map((b) => {
          const sev = Math.max(0, Math.min(1, b.severity));
          return (
            <div className={styles.demandBar} key={b.label}>
              <span className={styles.demandLabel}>{b.label}</span>
              <div className={styles.demandZone}>
                <div
                  className={zoneClass(sev)}
                  style={{ width: `${Math.round(sev * 100)}%` }}
                />
                <span className={styles.demandZoneLabel}>{zoneLabel(sev)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
