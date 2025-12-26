import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { getVariances } from "@/state/selectors/getVariances";
import { KPI_META } from "@/config/kpiMeta";

function VarianceOverlay({ hasImproved }: { hasImproved: boolean }) {
  return (
    <div className={`variance-overlay ${hasImproved ? "improved" : "degraded"}`}>
      {/* Visual indicator - styling only, no geometry */}
    </div>
  );
}

export function VariancesPanel() {
  const {
    activeScenarioId,
    comparisonTargetScenarioId,
    engineResults,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      comparisonTargetScenarioId: s.comparisonTargetScenarioId,
      engineResults: s.engineResults,
    }))
  );

  const active = engineResults[activeScenarioId];
  const base = comparisonTargetScenarioId ? engineResults[comparisonTargetScenarioId] : null;

  if (!active || !base) return null;

  const variances = getVariances(active, base);

  const netImproved =
    variances.filter((v) => v.improved).length > variances.length / 2;

  return (
    <div className="variances-panel">
      <VarianceOverlay hasImproved={netImproved} />
      {variances.map((v) => {
        const meta = KPI_META[v.key];

        return (
          <div key={v.key} className="variance-card">
            <div className="label">{meta.label}</div>

            <div className="values">
              <span>{meta.format(v.base)}</span>
              <span>{meta.format(v.active)}</span>
            </div>

            <div
              className={`delta ${
                v.improved ? "delta-positive" : "delta-negative"
              }`}
            >
              {meta.format(v.deltaAbs)}
              {v.deltaPct !== null && (
                <span className="pct">
                  {" "}
                  ({(v.deltaPct * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
