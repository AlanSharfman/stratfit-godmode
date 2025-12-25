import { useState } from "react";
import CenterViewTabs, { CenterView } from "./CenterViewTabs";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { useScenario, useDataPoints } from "@/state/scenarioStore";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

export default function CenterViewPanel() {
  const [view, setView] = useState<CenterView>("terrain");
  const scenario = useScenario();
  const dataPoints = useDataPoints();

  return (
    <div className="relative h-full w-full rounded-xl bg-black/40 backdrop-blur-sm border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex flex-col gap-1">
          <CenterViewTabs value={view} onChange={setView} />
          {view === "terrain" && (
            <span className="text-[11px] text-white/40">
              Terrain highlights indicate systemic balance and execution stress.
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full w-full">
        {view === "terrain" && (
          <div className="absolute inset-0">
            <ScenarioMountain scenario={scenario} dataPoints={dataPoints} />
          </div>
        )}

        {view === "variance" && (
          <div className="p-6">
            <ScenarioDeltaSnapshot />
          </div>
        )}

        {view === "actuals" && (
          <div className="p-6 text-sm text-white/60">
            <div className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm font-medium text-white mb-2">
                Actuals vs Scenario
              </h3>
              <p className="opacity-70">
                Actuals ingestion and variance commentary will appear here once
                connected to data sources.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
