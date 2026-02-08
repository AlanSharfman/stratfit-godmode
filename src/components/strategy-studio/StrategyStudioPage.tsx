// src/components/strategy-studio/StrategyStudioPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategy Studio · Institutional God Mode
// 3-zone CSS grid: LEVER STACK | LIVE TERRAIN | INTELLIGENCE PANEL
// Capital-allocation war room. Deterministic. Single canonical engine.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, memo } from "react";
import styles from "./StrategyStudio.module.css";
import { TopControlBar, type Objective, type Horizon } from "./TopControlBar";
import { TimelineScrubber } from "./TimelineScrubber";
import { LeverStack } from "./LeverStack";
import { IntelligencePanel } from "./IntelligencePanel";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverState } from "@/logic/calculateMetrics";
import type { ScenarioId } from "@/logic/calculateMetrics";

// ── Props from App.tsx ──────────────────────────────────────────────────

interface StrategyStudioPageProps {
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
}

// ── Heatmap color from risk ─────────────────────────────────────────────

function riskToHeatmapGradient(riskScore: number): string {
  // Low risk → indigo, mid → transparent, high → red
  if (riskScore < 30) {
    return "linear-gradient(180deg, rgba(99,102,241,0.15) 0%, transparent 60%)";
  }
  if (riskScore < 60) {
    return "linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 40%, rgba(239,68,68,0.04) 100%)";
  }
  return "linear-gradient(180deg, transparent 0%, rgba(239,68,68,0.12) 80%)";
}

// ── Main Component ──────────────────────────────────────────────────────

const StrategyStudioPage: React.FC<StrategyStudioPageProps> = memo(({
  levers,
  setLevers,
  scenario,
  dataPoints,
}) => {
  // ── Internal state ──────────────────────────────────────────────────
  const [objective, setObjective] = useState<Objective>("GROWTH");
  const [horizon, setHorizon] = useState<Horizon>(24);
  const [showBaseline, setShowBaseline] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [timelineMonth, setTimelineMonth] = useState(24);

  // ── Store selectors (read-only, no duplicated engine) ──────────────
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const engineResults = useScenarioStore((s) => s.engineResults);
  const riskScore = engineResults?.[scenario]?.kpis?.riskScore?.value ?? 40;

  // ── Lever change handler (direct state key update) ─────────────────
  const handleLeverChange = useCallback(
    (key: keyof LeverState, value: number) => {
      setLevers((prev) => ({ ...prev, [key]: value }));
    },
    [setLevers]
  );

  // ── Horizon ↔ Timeline sync ────────────────────────────────────────
  const handleHorizonChange = useCallback((h: Horizon) => {
    setHorizon(h);
    setTimelineMonth(h);
  }, []);

  const handleTimelineChange = useCallback((month: number) => {
    setTimelineMonth(month);
  }, []);

  // ── Heatmap gradient (Advanced Mode only, from real variance) ──────
  const heatmapGradient = useMemo(
    () => riskToHeatmapGradient(riskScore),
    [riskScore]
  );

  return (
    <div className={styles.root}>
      {/* ═══ LEFT: LEVER STACK ═══════════════════════════════════════ */}
      <aside className={styles.leftPanel}>
        <LeverStack levers={levers} onLeverChange={handleLeverChange} />
      </aside>

      {/* ═══ CENTER: LIVE TERRAIN ════════════════════════════════════ */}
      <main className={styles.centerPanel}>
        {/* Top Control Bar */}
        <TopControlBar
          objective={objective}
          onObjectiveChange={setObjective}
          horizon={horizon}
          onHorizonChange={handleHorizonChange}
          showBaseline={showBaseline}
          onBaselineToggle={() => setShowBaseline((p) => !p)}
          advancedMode={advancedMode}
          onAdvancedModeToggle={() => setAdvancedMode((p) => !p)}
        />

        {/* Mountain Stage */}
        <div className={styles.mountainStage}>
          <TerrainWithFallback dataPoints={dataPoints}>
            <ScenarioMountain
              scenario={scenario}
              dataPoints={dataPoints}
              activeKpiIndex={hoveredKpiIndex}
            />
          </TerrainWithFallback>

          {/* Heatmap Overlay — Advanced Mode only, derived from real risk variance */}
          {advancedMode && (
            <div
              className={styles.heatmapOverlay}
              style={{ background: heatmapGradient }}
            />
          )}
        </div>

        {/* Timeline Scrubber */}
        <TimelineScrubber
          maxMonths={36}
          currentMonth={timelineMonth}
          onChange={handleTimelineChange}
        />
      </main>

      {/* ═══ RIGHT: INTELLIGENCE ENGINE ══════════════════════════════ */}
      <aside className={styles.rightPanel}>
        <IntelligencePanel
          objective={objective}
          advancedMode={advancedMode}
          scenario={scenario}
        />
      </aside>
    </div>
  );
});

StrategyStudioPage.displayName = "StrategyStudioPage";
export default StrategyStudioPage;





