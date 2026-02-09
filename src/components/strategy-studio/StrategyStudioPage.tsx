// src/components/strategy-studio/StrategyStudioPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategy Studio 2.0 · Ghost Preview + Commit Architecture
//
// TWO-PHASE LEVER SYSTEM:
// Phase 1 — Preview (While Dragging):
//   Update previewLevers. Show ghost ridge overlay on mountain.
//   Do NOT trigger simulation. Do NOT update KPIs/deltas.
//
// Phase 2 — Commit (On Release):
//   Debounce 300–500ms. Trigger full simulation.
//   Update survival, EV, runway, risk, confidence.
//   Remove ghost overlay. Animate mountain to committed state.
//
// Constraints:
//   - MountainEngine must not reinitialize on preview.
//   - No FPS drop.
//   - No double simulation trigger.
//   - Simulation only runs on commit.
//   - Deterministic seed behavior maintained.
//
// 3-zone CSS grid: LEVER STACK | LIVE TERRAIN | DELTA SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import styles from "./StrategyStudio.module.css";
import { TopControlBar, type ScenarioTab, type Horizon, type RampType } from "./TopControlBar";
import { TimelineScrubber } from "./TimelineScrubber";
import { LeverStack } from "./LeverStack";
import { DeltaSummaryPanel, type DeltaMetrics } from "./DeltaSummaryPanel";
import GhostRidgeOverlay from "./GhostRidgeOverlay";
import SimulationActivityPanel from "./SimulationActivityPanel";
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
import { useCompareViewStore } from "@/state/compareViewStore";

// ── Props from App.tsx ──────────────────────────────────────────────────

interface StrategyStudioPageProps {
  levers: LeverState;
  setLevers: React.Dispatch<React.SetStateAction<LeverState>>;
  scenario: ScenarioId;
  dataPoints: number[];
  onSimulateRequest?: () => void;
  /** Called after "Run Scenario" pushes data to compareViewStore */
  onRunScenario?: () => void;
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

// ── Lightweight metrics → data points conversion ────────────────────────
// Converts calculateMetrics output to a 0–1 normalized 7-vector
// compatible with the mountain terrain engine. No simulation needed.

function metricsToDataPoints(metrics: ReturnType<typeof calculateMetrics>): number[] {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  return [
    clamp01(metrics.momentum / 100),               // Revenue/momentum
    clamp01(metrics.earningsPower / 100),           // Profit/earnings
    clamp01(metrics.runway / 36),                   // Runway (0–36 mo)
    clamp01(metrics.cashPosition / 10),             // Cash (scaled)
    clamp01(1 - metrics.burnQuality / 100),         // Burn (inverted)
    clamp01(metrics.enterpriseValue / 100),         // Enterprise value proxy
    clamp01(1 - metrics.riskIndex / 100),           // Risk (safety)
  ];
}

// ── Chunked auto-simulation runner ──────────────────────────────────────

const COMMIT_SIM_ITERATIONS = 2000;
const CHUNK_SIZE = 500;
const COMMIT_DEBOUNCE_MS = 400; // 300–500ms range

async function runChunkedSimulation(
  levers: LeverState,
  config: SimulationConfig,
  onProgress?: (completed: number, total: number) => void,
): Promise<MonteCarloResult> {
  const allSims: SingleSimulationResult[] = [];

  for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);
    for (let j = i; j < chunkEnd; j++) {
      allSims.push(runSingleSimulation(j, levers as any, config));
    }
    // Report progress
    onProgress?.(allSims.length, config.iterations);
    // Yield to UI thread between chunks — prevents FPS drop
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StrategyStudioPage: React.FC<StrategyStudioPageProps> = memo(({
  levers,
  setLevers,
  scenario,
  dataPoints,
  onSimulateRequest,
  onRunScenario,
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

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 1 — PREVIEW STATE (While Dragging)
  // ═════════════════════════════════════════════════════════════════════

  const [isDragging, setIsDragging] = useState(false);
  const [previewLevers, setPreviewLevers] = useState<LeverState | null>(null);
  const [activeDragLever, setActiveDragLever] = useState<keyof LeverState | null>(null);

  // ═════════════════════════════════════════════════════════════════════
  // PHASE 2 — COMMIT STATE (On Release)
  // ═════════════════════════════════════════════════════════════════════

  const [isAutoSimming, setIsAutoSimming] = useState(false);
  const [simJustCompleted, setSimJustCompleted] = useState(false);
  const [autoSimResults, setAutoSimResults] = useState<Record<string, MonteCarloResult | null>>({
    scenarioA: null,
    scenarioB: null,
  });

  // Simulation progress telemetry
  const [simIterations, setSimIterations] = useState(0);
  const [simDurationMs, setSimDurationMs] = useState(0);
  const simStartRef = useRef(0);

  // Commit nonce — incremented on drag end to trigger simulation
  const [commitNonce, setCommitNonce] = useState(0);
  const autoSimIdRef = useRef(0);

  // ── Scenario names (editable) ──────────────────────────────────────
  const [scenarioNames, setScenarioNames] = useState<Record<string, string>>({
    baseline: "Baseline",
    scenarioA: "Scenario A",
    scenarioB: "Scenario B",
  });

  // ── Model Details (collapsible bottom row) ─────────────────────────
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);
  const [lastRunSeed, setLastRunSeed] = useState<number | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string>("—");

  // ── Store selectors ───────────────────────────────────────────────
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const baselineSummary = useSimulationStore((s) => s.summary);

  // ── Derived: active levers (committed) ────────────────────────────
  const activeLevers = useMemo(() => {
    if (activeTab === "baseline") return baselineLevers;
    return scenarioLevers[activeTab];
  }, [activeTab, baselineLevers, scenarioLevers]);

  // ── Derived: display levers (preview during drag, committed otherwise)
  const displayLevers = useMemo(() => {
    if (isDragging && previewLevers) return previewLevers;
    return activeLevers;
  }, [isDragging, previewLevers, activeLevers]);

  // ── Derived: effective levers (ramp-adjusted, from committed) ─────
  const effectiveLevers = useMemo(() => {
    if (activeTab === "baseline") return baselineLevers;
    return computeEffectiveLevers(
      baselineLevers,
      scenarioLevers[activeTab],
      rampType,
      horizon,
    );
  }, [activeTab, baselineLevers, scenarioLevers, rampType, horizon]);

  // ── Instant metrics (lightweight — no sim needed) ─────────────────
  const baselineMetrics = useMemo(
    () => calculateMetrics(baselineLevers, scenario),
    [baselineLevers, scenario],
  );

  const scenarioMetrics = useMemo(
    () => calculateMetrics(effectiveLevers, scenario),
    [effectiveLevers, scenario],
  );

  // ── Preview metrics (computed only during drag — cheap) ───────────
  const previewMetrics = useMemo(() => {
    if (!isDragging || !previewLevers) return null;
    const effective = computeEffectiveLevers(
      baselineLevers,
      previewLevers,
      rampType,
      horizon,
    );
    return calculateMetrics(effective, scenario);
  }, [isDragging, previewLevers, baselineLevers, rampType, horizon, scenario]);

  // ── Ghost ridge data points (for overlay) ─────────────────────────
  const committedDataPoints = useMemo(
    () => metricsToDataPoints(scenarioMetrics),
    [scenarioMetrics],
  );

  const previewDataPoints = useMemo(() => {
    if (!previewMetrics) return committedDataPoints;
    return metricsToDataPoints(previewMetrics);
  }, [previewMetrics, committedDataPoints]);

  // ── Delta computation (from committed metrics only) ───────────────
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

  const activeAutoSimResult = autoSimResults[activeTab] ?? null;

  // ═════════════════════════════════════════════════════════════════════
  // HANDLERS — Two-Phase Lever System
  // ═════════════════════════════════════════════════════════════════════

  const handleTabChange = useCallback((tab: ScenarioTab) => {
    setActiveTab(tab);
    const leversForTab = tab === "baseline"
      ? baselineLevers
      : scenarioLevers[tab];
    setLevers(leversForTab);
  }, [baselineLevers, scenarioLevers, setLevers]);

  // Phase 1: Preview — called on every slider move during drag
  const handleLeverPreview = useCallback(
    (key: keyof LeverState, value: number) => {
      if (activeTab === "baseline") return;

      // Update preview levers (local only — no store writes)
      setPreviewLevers((prev) => ({
        ...(prev ?? scenarioLevers[activeTab]),
        [key]: value,
      }));
    },
    [activeTab, scenarioLevers],
  );

  // Phase 1: Drag start
  const handleLeverDragStart = useCallback(
    (key: keyof LeverState) => {
      if (activeTab === "baseline") return;

      setIsDragging(true);
      setActiveDragLever(key);
      setSimJustCompleted(false);

      // Initialize preview levers from current committed state
      setPreviewLevers({ ...scenarioLevers[activeTab] });
    },
    [activeTab, scenarioLevers],
  );

  // Phase 2: Drag end → Commit
  const handleLeverDragEnd = useCallback(
    (key: keyof LeverState, finalValue: number) => {
      if (activeTab === "baseline") return;

      // Commit: copy preview levers into committed state
      const finalLevers = {
        ...(previewLevers ?? scenarioLevers[activeTab]),
        [key]: finalValue,
      };

      setScenarioLevers((prev) => ({
        ...prev,
        [activeTab]: finalLevers,
      }));
      setLevers(finalLevers);

      // Clear preview state
      setIsDragging(false);
      setPreviewLevers(null);
      setActiveDragLever(null);

      // Increment commit nonce → triggers debounced simulation
      setCommitNonce((n) => n + 1);
    },
    [activeTab, previewLevers, scenarioLevers, setLevers],
  );

  const handleScenarioNameChange = useCallback((name: string) => {
    setScenarioNames((prev) => ({ ...prev, [activeTab]: name }));
  }, [activeTab]);

  const handleHorizonChange = useCallback((h: Horizon) => {
    setHorizon(h);
    setTimelineMonth(h);
  }, []);

  const handleTimelineChange = useCallback((month: number) => {
    setTimelineMonth(month);
  }, []);

  // ── Run Scenario → Push to CompareView Store → Navigate ────────────
  const handleRunScenario = useCallback(() => {
    const store = useCompareViewStore.getState();

    // Push baseline as Current Structure
    store.setCurrentStructure({
      levers: { ...baselineLevers },
      metrics: baselineMetrics,
      dataPoints: metricsToDataPoints(baselineMetrics),
    });

    // Ensure active scenario exists in compare store
    const currentScenarioLevers = scenarioLevers[activeTab] ?? levers;
    const currentScenarioMetrics = scenarioMetrics;
    const currentSimResult = autoSimResults[activeTab] ?? null;
    const currentDataPoints = committedDataPoints;
    const scenarioName = scenarioNames[activeTab] ?? activeTab;

    // Check if scenario already exists in compare store
    const existingScenarios = store.scenarios;
    const existingMatch = existingScenarios.find((s) => s.name === scenarioName);

    if (existingMatch) {
      store.updateScenario(existingMatch.id, {
        levers: { ...currentScenarioLevers },
        metrics: currentScenarioMetrics,
        simulationResult: currentSimResult,
        dataPoints: [...currentDataPoints],
      });
      store.setActiveScenarioId(existingMatch.id);
    } else {
      const newScenario = store.addScenario({
        id: "",
        name: scenarioName,
        levers: { ...currentScenarioLevers },
        metrics: currentScenarioMetrics,
        simulationResult: currentSimResult,
        dataPoints: [...currentDataPoints],
      });
      if (newScenario) {
        store.setActiveScenarioId(newScenario.id);
      }
    }

    store.open();
    onRunScenario?.();
  }, [
    baselineLevers, baselineMetrics, scenarioLevers, activeTab, levers,
    scenarioMetrics, autoSimResults, committedDataPoints, scenarioNames,
    onRunScenario,
  ]);

  // ═════════════════════════════════════════════════════════════════════
  // COMMIT SIMULATION — Fires only on commit (debounced)
  // NEVER fires during preview/drag.
  // ═════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (activeTab === "baseline") return;
    if (commitNonce === 0) return; // Don't run on initial mount

    const timer = setTimeout(async () => {
      const currentEffective = computeEffectiveLevers(
        baselineLevers,
        scenarioLevers[activeTab],
        rampType,
        horizon,
      );

      const simConfig: SimulationConfig = {
        iterations: COMMIT_SIM_ITERATIONS,
        timeHorizonMonths: horizon,
        startingCash: 4_000_000,
        startingARR: 4_800_000,
        monthlyBurn: 47_000,
      };

      autoSimIdRef.current++;
      const thisId = autoSimIdRef.current;
      setIsAutoSimming(true);
      setSimJustCompleted(false);
      setSimIterations(0);
      setSimDurationMs(0);
      simStartRef.current = performance.now();

      try {
        const result = await runChunkedSimulation(
          currentEffective,
          simConfig,
          (completed, total) => {
            // Throttled progress update (only if this is still current)
            if (autoSimIdRef.current === thisId) {
              setSimIterations(completed);
              setSimDurationMs(performance.now() - simStartRef.current);
            }
          },
        );

        if (autoSimIdRef.current !== thisId) return; // Stale — discard

        setAutoSimResults((prev) => ({
          ...prev,
          [activeTab]: result,
        }));
        const finalDuration = performance.now() - simStartRef.current;
        setSimDurationMs(finalDuration);
        setSimIterations(result.iterations);
        setSimJustCompleted(true);
        setLastRunSeed(thisId); // Use commit nonce as pseudo-seed identifier
        setLastRunTime(finalDuration < 1000
          ? `${Math.round(finalDuration)}ms`
          : `${(finalDuration / 1000).toFixed(2)}s`);

        // Auto-clear completion indicator after 4s
        setTimeout(() => {
          if (autoSimIdRef.current === thisId) {
            setSimJustCompleted(false);
          }
        }, 4000);
      } catch {
        // Silently fail auto-sim
      } finally {
        if (autoSimIdRef.current === thisId) {
          setIsAutoSimming(false);
        }
      }
    }, COMMIT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitNonce, activeTab, rampType, horizon, baselineLevers]);

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

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
          levers={displayLevers}
          onLeverChange={handleLeverPreview}
          onLeverDragStart={handleLeverDragStart}
          onLeverDragEnd={handleLeverDragEnd}
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
          onSimulate={handleRunScenario}
          scenarioName={scenarioNames[activeTab]}
          onScenarioNameChange={handleScenarioNameChange}
        />

        {/* Mountain Stage */}
        <div className={isDragging ? styles.mountainStagePreview : styles.mountainStage}>
          <TerrainWithFallback dataPoints={dataPoints}>
            <ScenarioMountain
              scenario={scenario}
              dataPoints={dataPoints}
              activeKpiIndex={hoveredKpiIndex}
            />
          </TerrainWithFallback>

          {/* Ghost Ridge Overlay — Phase 1 preview */}
          <GhostRidgeOverlay
            committedPoints={committedDataPoints}
            previewPoints={previewDataPoints}
            active={isDragging}
          />

          {/* Auto-sim scanning overlay — Phase 2 commit */}
          {isAutoSimming && <div className={styles.autoSimOverlay} />}

          {/* Simulation Activity Monitor */}
          <SimulationActivityPanel
            isRunning={isAutoSimming}
            iterationsCompleted={simIterations}
            iterationsTarget={COMMIT_SIM_ITERATIONS}
            durationMs={simDurationMs}
            methodLabel="Monte Carlo"
            justCompleted={simJustCompleted}
          />
        </div>

        {/* Timeline Scrubber */}
        <TimelineScrubber
          maxMonths={horizon}
          currentMonth={timelineMonth}
          onChange={handleTimelineChange}
        />

        {/* Model Details — Collapsible bottom row */}
        <div className={styles.modelDetailsBar}>
          <button
            type="button"
            className={styles.modelDetailsToggle}
            onClick={() => setModelDetailsOpen((p) => !p)}
          >
            <span className={styles.modelDetailsToggleLabel}>Model Details</span>
            <span className={modelDetailsOpen ? styles.modelDetailsChevronOpen : styles.modelDetailsChevron}>▾</span>
          </button>

          {modelDetailsOpen && (
            <div className={styles.modelDetailsBody}>
              <div className={styles.modelDetailsItem}>
                <span className={styles.modelDetailsItemLabel}>Iterations</span>
                <span className={styles.modelDetailsItemValue}>
                  {activeAutoSimResult ? activeAutoSimResult.iterations.toLocaleString() : "—"}
                </span>
              </div>
              <div className={styles.modelDetailsItem}>
                <span className={styles.modelDetailsItemLabel}>Seed</span>
                <span className={styles.modelDetailsItemValue}>
                  {lastRunSeed !== null ? lastRunSeed : "—"}
                </span>
              </div>
              <div className={styles.modelDetailsItem}>
                <span className={styles.modelDetailsItemLabel}>Last Run</span>
                <span className={styles.modelDetailsItemValue}>{lastRunTime}</span>
              </div>
              <div className={styles.modelDetailsItem}>
                <span className={styles.modelDetailsItemLabel}>Confidence</span>
                <span className={
                  !activeAutoSimResult ? styles.confidenceBand
                    : activeAutoSimResult.iterations >= 5000 ? styles.confidenceVeryHigh
                    : activeAutoSimResult.iterations >= 2000 ? styles.confidenceHigh
                    : activeAutoSimResult.iterations >= 1000 ? styles.confidenceMedium
                    : activeAutoSimResult.iterations >= 500 ? styles.confidenceLow
                    : styles.confidenceVeryLow
                }>
                  {!activeAutoSimResult ? "—"
                    : activeAutoSimResult.iterations >= 5000 ? "VERY HIGH"
                    : activeAutoSimResult.iterations >= 2000 ? "HIGH"
                    : activeAutoSimResult.iterations >= 1000 ? "MEDIUM"
                    : activeAutoSimResult.iterations >= 500 ? "LOW"
                    : "VERY LOW"}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ RIGHT: DELTA SUMMARY ════════════════════════════════════ */}
      <aside className={styles.rightPanel}>
        <DeltaSummaryPanel
          deltas={deltas}
          scenarioLabel={
            compareMode
              ? `${scenarioNames.scenarioA} vs ${scenarioNames.scenarioB}`
              : scenarioNames[activeTab] ?? activeTab
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

