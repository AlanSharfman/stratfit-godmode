import { useMemo, useState } from "react";
import CenterViewTabs, { CenterView } from "./CenterViewTabs";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { useScenario, useDataPoints } from "@/state/scenarioStore";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

export default function CenterViewPanel() {
  const [view, setView] = useState<CenterView>("terrain");
  const scenario = useScenario();
  const dataPoints = useDataPoints();

  const helperText = useMemo(() => {
    if (view !== "terrain") return null;
    return "Terrain highlights indicate systemic balance and execution stress.";
  }, [view]);

  return (
    <div className="relative h-full w-full rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-hidden">
      {/* Header Strip (always visible, never overlaps content) */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between">
          <CenterViewTabs value={view} onChange={setView} />
        </div>

        {helperText && (
          <div className="mt-1 text-[11px] text-white/35">{helperText}</div>
        )}
      </div>

      {/* Content Area (scrollable for non-terrain views) */}
      <div className="relative h-[calc(100%-52px)] w-full">
        {view === "terrain" && (
          <div className="absolute inset-0">
            <ScenarioMountain scenario={scenario} dataPoints={dataPoints} />
          </div>
        )}

        {view === "variance" && (
          <div className="h-full w-full overflow-auto px-4 py-4">
            {/* Keep this component, but present it cleanly */}
            <ScenarioDeltaSnapshot />
          </div>
        )}

        {view === "actuals" && (
          <div className="h-full w-full overflow-auto px-4 py-4">
            <div className="h-full w-full rounded-lg border border-white/10 bg-black/20 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Actuals vs Scenario
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Connect Actuals to unlock variance tracking, alerts, and commentary.
                  </div>
                </div>
              </div>

              {/* Placeholder grid to avoid “empty void” feeling */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Revenue", "ARR", "Burn", "Cash", "Runway", "Risk Score"].map((m) => (
                  <div
                    key={m}
                    className="rounded-md border border-white/10 bg-black/30 p-3"
                  >
                    <div className="text-[11px] text-white/50">{m}</div>
                    <div className="mt-2 text-sm text-white/70">—</div>
                    <div className="mt-1 text-[11px] text-white/35">
                      Actuals pending
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] text-white/50">Commentary</div>
                <div className="mt-2 text-sm text-white/60">
                  Placeholder: once Supabase actuals are connected, we’ll generate
                  CFO-grade narrative explaining variance drivers.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
