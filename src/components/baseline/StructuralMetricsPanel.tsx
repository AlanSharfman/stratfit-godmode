import React, { memo, useMemo } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useScenarioStore } from "@/state/scenarioStore";
import type { MetricId } from "@/types/baseline";
import styles from "@/pages/baseline/BaselinePage.module.css";

type Row = {
  id: MetricId;
  label: string;
  value: number; // 0..100
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

const StructuralMetricsPanel: React.FC<{
  activeMetricId?: MetricId | null;
  onHover: (id: MetricId | null) => void;
}> = memo(({ activeMetricId, onHover }) => {
  const { baseline } = useSystemBaseline();
  const engineKpis = useScenarioStore((s) => s.engineResults?.base?.kpis ?? null);

  const rows = useMemo<Row[]>(() => {
    const margin = baseline?.financial.grossMarginPct ?? 0;
    const burn = baseline?.financial.monthlyBurn ?? 0;
    const cash = baseline?.financial.cashOnHand ?? 0;
    const runway = burn > 0 ? cash / burn : 36;
    const riskIndex = (engineKpis?.riskIndex?.value as number | undefined) ?? 70;

    return [
      { id: "revenueFitness", label: "Revenue Fitness", value: clamp(((engineKpis?.momentum?.value as number | undefined) ?? 68), 0, 100) },
      { id: "costDiscipline", label: "Cost Discipline", value: clamp(100 - (burn > 0 ? (burn / Math.max(1, (baseline?.financial.arr ?? 1) / 12)) * 40 : 20), 0, 100) },
      { id: "capitalStrength", label: "Capital Strength", value: clamp((runway / 24) * 100, 0, 100) },
      { id: "runwayStability", label: "Runway Stability", value: clamp((runway / 18) * 100, 0, 100) },
      { id: "operatingEfficiency", label: "Operating Efficiency", value: clamp((margin / 60) * 100, 0, 100) },
      { id: "structuralRisk", label: "Structural Risk Index", value: clamp(riskIndex, 0, 100) },
    ];
  }, [baseline, engineKpis]);

  return (
    <div className={styles.leftPanel}>
      <div className={styles.leftPanelInner}>
        {rows.map((r) => {
          const isActive = activeMetricId === r.id;
          const dim = !!activeMetricId && !isActive;
          return (
            <button
              key={r.id}
              type="button"
              className={styles.metricRow}
              onMouseEnter={() => onHover(r.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(r.id)}
              onBlur={() => onHover(null)}
              onClick={() => onHover(isActive ? null : r.id)}
              style={{ opacity: dim ? 0.55 : 1 }}
            >
              <div className={styles.metricTop}>
                <div className={styles.metricLabel}>{r.label}</div>
                <div className={styles.metricValue}>{Math.round(r.value)}</div>
              </div>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricBarFill}
                  style={{
                    width: `${clamp(r.value, 0, 100)}%`,
                    opacity: isActive ? 0.95 : 0.7,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

StructuralMetricsPanel.displayName = "StructuralMetricsPanel";
export default StructuralMetricsPanel;


