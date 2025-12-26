import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { getSystemBrief } from "@/state/selectors/getSystemBrief";

export function SystemBriefPanel() {
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

  const brief = getSystemBrief(active, base);

  return (
    <div className={`system-brief ${brief.status}`}>
      <h2>{brief.headline}</h2>

      <ul>
        {brief.facts.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>

      {brief.flags.length > 0 && (
        <div className="flags">
          {brief.flags.map((f, i) => (
            <div key={i} className="flag">
              ⚠️ {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
