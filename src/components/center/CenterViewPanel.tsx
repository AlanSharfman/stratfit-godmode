import { useEffect, useMemo, useState, useRef } from "react";
import CenterViewSegmented, { CenterView } from "@/components/CenterViewSegmented";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";
import { useScenario, useDataPoints, useScenarioStore } from "@/state/scenarioStore";
import { buildScenarioDelta, ScenarioDelta } from "@/logic/buildScenarioDelta";

import BriefingPanel from "@/components/briefing/BriefingPanel";
import {
  isBriefingSeen,
  setBriefingSeen,
} from "@/components/briefing/briefingStorage";

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function viewToBriefingKey(view: CenterView): "terrain" | "variance" | "actuals" {
  if (view === "systemBrief") return "variance";
  return view;
}

export default function CenterViewPanel() {
  const [view, setView] = useState<CenterView>("terrain");
  const scenario = useScenario();
  const dataPoints = useDataPoints();
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);

  const downsideResult = engineResults?.["downside"];
  const upsideResult = engineResults?.["upside"];
  const baseResult = engineResults?.["base"];

  // === Canonical delta (computed once per change) =====================
  const prevEngineResultsRef = useRef<typeof engineResults | null>(null);
  const scenarioDeltaRef = useRef<ScenarioDelta | null>(null);

  useEffect(() => {
    if (!engineResults || !activeScenarioId) return;

    const prev = prevEngineResultsRef.current?.[activeScenarioId];
    const next = engineResults[activeScenarioId];

    scenarioDeltaRef.current = buildScenarioDelta(
      prev ?? null,
      next ?? null,
      activeScenarioId
    );

    prevEngineResultsRef.current = engineResults;
  }, [engineResults, activeScenarioId]);
  // ===================================================================

  const briefingKey = useMemo(() => viewToBriefingKey(view), [view]);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingNonce, setBriefingNonce] = useState(0);
  const [soundOn, setSoundOnState] = useState<boolean>(false);

  useEffect(() => {
    const seen = isBriefingSeen(briefingKey);
    if (!seen) {
      setBriefingOpen(true);
      setBriefingNonce((n) => n + 1);
    } else {
      setBriefingOpen(false);
    }
  }, [briefingKey]);

  const openBriefing = () => {
    setBriefingOpen(true);
    setBriefingNonce((n) => n + 1);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    if (next) openBriefing();
  };

  return (
    <div className="relative h-full w-full rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-hidden">
      <div className="px-6 pt-4 pb-3 border-b border-white/5 bg-gradient-to-b from-black/30 to-transparent">
        <BriefingPanel
          briefingKey={briefingKey}
          open={briefingOpen}
          soundEnabled={soundOn}
          onClose={() => setBriefingOpen(false)}
          onSeen={() => setBriefingSeen(briefingKey)}
          forceNonce={briefingNonce}
        />
      </div>

      <div className="relative h-[calc(100%-68px)] w-full p-4">
        <div className="mb-3">
          <CenterViewSegmented value={view} onChange={setView} />
        </div>
        {view === "terrain" && (
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="relative h-full w-full">
              <ScenarioMountain
                scenario={scenario}
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
                ghostBase={baseResult?.kpis ? Object.values(baseResult.kpis).slice(0, 7).map(k => k.value) : undefined}
                ghostUpside={upsideResult?.kpis ? Object.values(upsideResult.kpis).slice(0, 7).map(k => k.value) : undefined}
                ghostDownside={downsideResult?.kpis ? Object.values(downsideResult.kpis).slice(0, 7).map(k => k.value) : undefined}
                scenarioDelta={scenarioDeltaRef.current}
              />
            </div>
          </div>
        )}

        {view === "variance" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-950/60 to-black/80 p-6">
            <ScenarioDeltaSnapshot />
          </div>
        )}
      </div>
    </div>
  );
}
