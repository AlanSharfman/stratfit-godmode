import React, { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import type { Scenario, ScenarioId } from "@/state/scenarioStore";
import { useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import type { LeverId } from "@/logic/mountainPeakModel";
import { ScenarioMountain25D } from "./ScenarioMountain25D";

type Props = {
  scenario: Scenario | ScenarioId;
  dataPoints?: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  mode?: "default" | "celebration" | "ghost";
  glowIntensity?: number;
  showPath?: boolean;
  showMilestones?: boolean;
  pathColor?: string;
};

function getScenarioId(s: Scenario | ScenarioId): ScenarioId {
  if (typeof s === "string") return s as ScenarioId;
  return (s as any)?.id as ScenarioId;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function ScenarioMountain25DScene({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  className,
  mode = "default",
  glowIntensity = 1,
  showPath = false,
  showMilestones = false,
  pathColor,
}: Props) {
  const scenarioId = getScenarioId(scenario);

  const { engineResults, solverPath } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      solverPath: s.solverPath,
    }))
  );

  const engineResult = engineResults?.[scenarioId];

  const resolvedDataPoints = useMemo(() => {
    if (Array.isArray(dataPoints) && dataPoints.length === 7) return dataPoints;
    return engineResultToMountainForces((engineResult ?? null) as any);
  }, [dataPoints, engineResult]);

  const { activeGroup, isDragging, riskLevel: uiRiskLevel, hasInteracted, neuralBootComplete } = useUIStore(
    useShallow((s) => ({
      activeGroup: s.activeGroup,
      isDragging: s.isDragging,
      riskLevel: s.riskLevel,
      hasInteracted: s.hasInteracted,
      neuralBootComplete: s.neuralBootComplete,
    }))
  );

  // Seismic when risk group is being dragged (mirrors the 3D semantics).
  const isSeismicActive = activeGroup === "risk" && isDragging;

  const { ref, size } = useElementSize<HTMLDivElement>();
  const w = Math.max(520, Math.floor(size.width || 900));
  const h = Math.max(320, Math.floor(size.height || 420));

  return (
    <div
      ref={ref}
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: "radial-gradient(circle at 50% 55%, #1a2744 0%, #0f1a2e 60%, #0a1220 100%)",
      }}
      data-scenario={scenarioId}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 80px rgba(11, 18, 32, 0.45)" }} />
      <div className="absolute inset-0">
        <ScenarioMountain25D
          dataPoints={resolvedDataPoints}
          activeKpiIndex={activeKpiIndex}
          width={w}
          height={h}
          mode={mode}
          glowIntensity={glowIntensity}
          riskLevel={uiRiskLevel}
          isSeismicActive={isSeismicActive}
          isDragging={isDragging}
          hasInteracted={hasInteracted}
          neuralPulse={neuralBootComplete}
          showPath={showPath}
          showMilestones={showMilestones}
          solverPath={solverPath}
          pathColor={pathColor}
        />
      </div>
    </div>
  );
}


