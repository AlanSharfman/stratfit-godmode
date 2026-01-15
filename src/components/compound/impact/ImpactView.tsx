// src/components/compound/impact/ImpactView.tsx

import { useMemo } from "react";
import RiskBreakdownPanel from "@/components/center/RiskBreakdownPanel";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";

export default function ImpactView() {
  const { engineResults, activeScenarioId } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      activeScenarioId: s.activeScenarioId,
    }))
  );

  const hasEngine = !!engineResults && Object.keys(engineResults).length > 0;

  if (!hasEngine) {
    return (
      <div style={{ padding: 18, color: "rgba(200,235,255,0.7)" }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Impact Map</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Waiting for scenario engine results…
        </div>
      </div>
    );
  }
  
  const ledger = useMemo(() => {
    if (!engineResults) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  return (
    <div className="relative h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-950/60 to-black/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <RiskBreakdownPanel ledger={ledger} />
    </div>
  );
}
