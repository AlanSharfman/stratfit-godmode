// src/components/strategy-studio/StrategyStudioPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategy Studio 2.0 · Composition Engine
// 3-zone CSS grid: LEVER STACK | LIVE TERRAIN | DELTA SUMMARY
// Scenario layering (Baseline / A / B), auto-simulation, timeline control.
// Institutional. Deterministic. Capital-grade.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import styles from "./StrategyStudio.module.css";
import { TopControlBar, type ScenarioTab, type Horizon, type RampType } from "./TopControlBar";
import { TimelineScrubber } from "./TimelineScrubber";
import { LeverStack } from "./LeverStack";
import { DeltaSummaryPanel, type DeltaMetrics } from "./DeltaSummaryPanel";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import { useScenarioStore } from "@/state/scenarioStore";
import { useSimulationStore } from "@/state/simulationStore";
import { calculateMetrics } from "@/logic/calculateMetrics";
import type { LeverState, ScenarioId } from "@/logic/calculateMetrics";
import {
  type MonteCarloResult,
  type SimulationConfig,
  type SingleSimulationResult,
  runSingleSimulation,
  processSimulationResults,
} from "@/logic/monteCarloEngine";

// ── Props from App.tsx ──────────────────────────────────────────────────

interface StrategyStudioPageProps {
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
  onSimulateRequest?: () => void;
}

// ── Initial lever defaults ──────────────────────────────────────────────

const INITIAL_LEVERS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

// ── Ramp factor computation ─────────────────────────────────────────────

function computeEffectiveLevers(
  baseline: LeverState,
  scenario: LeverState,
  rampType: RampType,
  horizon: number,
): LeverState {
  if (rampType === "immediate") return scenario;

  const rampMonths = rampType === "6m" ? 6 : 12;
  const rampFactor = Math.max(0.5, 1 - rampMonths / (2 * horizon));

  const result = { ...scenario };
  for (const key of Object.keys(scenario) as (keyof LeverState)[]) {
    const delta = scenario[key] - baseline[key];
    result[key] = Math.round(baseline[key] + delta * rampFactor);
  }
  return result;
}

// ── Chunked auto-simulation runner ──────────────────────────────────────

const AUTO_SIM_ITERATIONS = 2000;
const CHUNK_SIZE = 500;

async function runChunkedSimulation(
  levers: LeverState,
  config: SimulationConfig,
): Promise<MonteCarloResult> {
  const allSims: SingleSimulationResult[] = [];

  for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);
    for (let j = i; j < chunkEnd; j++) {
      allSims.push(runSingleSimulation(j, levers as any, config));
    }
    // Yield to UI thread between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return processSimulationResults(allSims, config, levers as any, 0);
}

// ── Delta computation helper ────────────────────────────────────────────

function computeDeltas(
  baseMetrics: ReturnType<typeof calculateMetrics>,
  scenMetrics: ReturnType<typeof calculateMetrics>,
  baseSim: MonteCarloResult | null,
  scenSim: MonteCarloResult | null,
): DeltaMetrics {
  // Survival: from sim if available, else crude estimate from runway
  const bSurvival = baseSim
    ? Math.round(baseSim.survivalRate * 100)
    : Math.min(100, Math.round((baseMetrics.runway / 36) * 100));
  const sSurvival = scenSim
    ? Math.round(scenSim.survivalRate * 100)
    : Math.min(100, Math.round((scenMetrics.runway / 36) * 100));

  return {
    survival: { baseline: bSurvival, scenario: sSurvival, delta: sSurvival - bSurvival },
    ev: {
      baseline: baseMetrics.enterpriseValue,
      scenario: scenMetrics.enterpriseValue,
      delta: scenMetrics.enterpriseValue - baseMetrics.enterpriseValue,
    },
    runway: {
      baseline: baseMetrics.runway,
      scenario: scenMetrics.runway,
      delta: scenMetrics.runway - baseMetrics.runway,
    },
    risk: {
      baseline: baseMetrics.riskIndex,
      scenario: scenMetrics.riskIndex,
      delta: scenMetrics.riskIndex - baseMetrics.riskIndex,
    },
  };
}

// ── Main Component ──────────────────────────────────────────────────────

const StrategyStudioPage: React.FC<StrategyStudioPageProps> = memo(({
  levers,
  setLevers,
  scenario,
  dataPoints,
  onSimulateRequest,
}) => {
  // ── Scenario layer state ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ScenarioTab>("scenarioA");
  const [scenarioLevers, setScenarioLevers] = useState<Record<string, LeverState>>(() => ({
    scenarioA: { ...levers },
    scenarioB: { ...levers },
  }));

  // ── Baseline levers (from last full simulation or initial defaults) ──
  const leverSnapshot = useSimulationStore((s) => s.leverSnapshot);
  const baselineLevers = useMemo<LeverState>(() => {
    if (leverSnapshot) {
      return {
        demandStrength: leverSnapshot.demandStrength ?? INITIAL_LEVERS.demandStrength,
        pricingPower: leverSnapshot.pricingPower ?? INITIAL_LEVERS.pricingPower,
        expansionVelocity: leverSnapshot.expansionVelocity ?? INITIAL_LEVERS.expansionVelocity,
        costDiscipline: leverSnapshot.costDiscipline ?? INITIAL_LEVERS.costDiscipline,
        hiringIntensity: leverSnapshot.hiringIntensity ?? INITIAL_LEVERS.hiringIntensity,
        operatingDrag: leverSnapshot.operatingDrag ?? INITIAL_LEVERS.operatingDrag,
        marketVolatility: leverSnapshot.marketVolatility ?? INITIAL_LEVERS.marketVolatility,
        executionRisk: leverSnapshot.executionRisk ?? INITIAL_LEVERS.executionRisk,
        fundingPressure: leverSnapshot.fundingPressure ?? INITIAL_LEVERS.fundingPressure,
      };
    }
    return INITIAL_LEVERS;
  }, [leverSnapshot]);

  // ── Controls ──────────────────────────────────────────────────────
  const [horizon, setHorizon] = useState<Horizon>(24);
  const [rampType, setRampType] = useState<RampType>("immediate");
  const [compareMode, setCompareMode] = useState(false);
  const [timelineMonth, setTimelineMonth] = useState(24);

  // ── Auto-simulation state ─────────────────────────────────────────
  const [isAutoSimming, setIsAutoSimming] = useState(false);
  const [autoSimResults, setAutoSimResults] = useState<Record<string, MonteCarloResult | null>>({
    scenarioA: null,
    scenarioB: null,
  });
  const autoSimIdRef = useRef(0);

  // ── Store selectors ───────────────────────────────────────────────
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const baselineSummary = useSimulationStore((s) => s.summary);

  // ── Derived: active levers ────────────────────────────────────────
  const activeLevers = useMemo(() => {
    if (activeTab === "baseline") return baselineLevers;
    return scenarioLevers[activeTab];
  }, [activeTab, baselineLevers, scenarioLevers]);

  // ── Derived: effective levers (ramp-adjusted) ─────────────────────
  const effectiveLevers = useMemo(() => {
    if (activeTab === "baseline") return baselineLevers;
    return computeEffectiveLevers(
      baselineLevers,
      scenarioLevers[activeTab],
      rampType,
      horizon,
    );
  }, [activeTab, baselineLevers, scenarioLevers, rampType, horizon]);

  // ── Instant metrics (from calculateMetrics — no sim needed) ───────
  const baselineMetrics = useMemo(
    () => calculateMetrics(baselineLevers, scenario),
    [baselineLevers, scenario],
  );

  const scenarioMetrics = useMemo(
    () => calculateMetrics(effectiveLevers, scenario),
    [effectiveLevers, scenario],
  );

  // ── Delta computation ─────────────────────────────────────────────
  const deltas = useMemo<DeltaMetrics>(() => {
    if (compareMode) {
      const effectiveA = computeEffectiveLevers(baselineLevers, scenarioLevers.scenarioA, rampType, horizon);
      const effectiveB = computeEffectiveLevers(baselineLevers, scenarioLevers.scenarioB, rampType, horizon);
      const metricsA = calculateMetrics(effectiveA, scenario);
      const metricsB = calculateMetrics(effectiveB, scenario);
      return computeDeltas(metricsA, metricsB, autoSimResults.scenarioA, autoSimResults.scenarioB);
    }
    return computeDeltas(baselineMetrics, scenarioMetrics, null, autoSimResults[activeTab] ?? null);
  }, [
    compareMode, baselineLevers, scenarioLevers, rampType, horizon, scenario,
    baselineMetrics, scenarioMetrics, autoSimResults, activeTab,
  ]);

  // ── Auto-sim result for display ───────────────────────────────────
  const activeAutoSimResult = autoSimResults[activeTab] ?? null;

  // ── Handlers ──────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: ScenarioTab) => {
    setActiveTab(tab);
    const leversForTab = tab === "baseline"
      ? baselineLevers
      : scenarioLevers[tab];
    setLevers(leversForTab);
  }, [baselineLevers, scenarioLevers, setLevers]);

  const handleLeverChange = useCallback(
    (key: keyof LeverState, value: number) => {
      if (activeTab === "baseline") return; // read-only

      setScenarioLevers((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], [key]: value },
      }));
      setLevers((prev) => ({ ...prev, [key]: value }));
    },
    [activeTab, setLevers],
  );

  const handleHorizonChange = useCallback((h: Horizon) => {
    setHorizon(h);
    setTimelineMonth(h);
  }, []);

  const handleTimelineChange = useCallback((month: number) => {
    setTimelineMonth(month);
  }, []);

  // ── Auto-simulation (debounced 500ms on lever change) ─────────────
  useEffect(() => {
    if (activeTab === "baseline") return;

    const timer = setTimeout(async () => {
      const currentEffective = computeEffectiveLevers(
        baselineLevers,
        scenarioLevers[activeTab],
        rampType,
        horizon,
      );

      const simConfig: SimulationConfig = {
        iterations: AUTO_SIM_ITERATIONS,
        timeHorizonMonths: horizon,
        startingCash: 4_000_000,
        startingARR: 4_800_000,
        monthlyBurn: 47_000,
      };

      autoSimIdRef.current++;
      const thisId = autoSimIdRef.current;
      setIsAutoSimming(true);

      try {
        const result = await runChunkedSimulation(currentEffective, simConfig);
        if (autoSimIdRef.current !== thisId) return; // Stale — discard

        setAutoSimResults((prev) => ({
          ...prev,
          [activeTab]: result,
        }));
      } catch {
        // Silently fail auto-sim
      } finally {
        if (autoSimIdRef.current === thisId) {
          setIsAutoSimming(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioLevers, activeTab, rampType, horizon, baselineLevers]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* ═══ LEFT: LEVER STACK ═══════════════════════════════════════ */}
      <aside className={styles.leftPanel}>
        <div className={styles.leverPanelHeader}>
          <span className={styles.leverPanelTitle}>
            {activeTab === "baseline"
              ? "BASELINE"
              : activeTab === "scenarioA"
                ? "SCENARIO A"
                : "SCENARIO B"}
          </span>
          {activeTab === "baseline" && (
            <span className={styles.readOnlyBadge}>READ-ONLY</span>
          )}
        </div>
        <LeverStack
          levers={activeLevers}
          onLeverChange={handleLeverChange}
          readOnly={activeTab === "baseline"}
        />
      </aside>

      {/* ═══ CENTER: LIVE TERRAIN ════════════════════════════════════ */}
      <main className={styles.centerPanel}>
        <TopControlBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          horizon={horizon}
          onHorizonChange={handleHorizonChange}
          rampType={rampType}
          onRampTypeChange={setRampType}
          compareMode={compareMode}
          onCompareModeToggle={() => setCompareMode((p) => !p)}
          onSimulate={onSimulateRequest}
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

          {/* Auto-sim scanning overlay */}
          {isAutoSimming && <div className={styles.autoSimOverlay} />}
        </div>

        {/* Timeline Scrubber */}
        <TimelineScrubber
          maxMonths={horizon}
          currentMonth={timelineMonth}
          onChange={handleTimelineChange}
        />
      </main>

      {/* ═══ RIGHT: DELTA SUMMARY ════════════════════════════════════ */}
      <aside className={styles.rightPanel}>
        <DeltaSummaryPanel
          deltas={deltas}
          scenarioLabel={
            compareMode
              ? "A vs B"
              : activeTab === "scenarioA"
                ? "Scenario A"
                : activeTab === "scenarioB"
                  ? "Scenario B"
                  : "Baseline"
          }
          isAutoSimming={isAutoSimming}
          compareMode={compareMode}
          autoSimResult={activeAutoSimResult}
        />
      </aside>
    </div>
  );
});

StrategyStudioPage.displayName = "StrategyStudioPage";
export default StrategyStudioPage;

