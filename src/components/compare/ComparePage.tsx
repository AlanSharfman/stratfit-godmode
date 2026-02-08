// src/components/compare/ComparePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — COMPARE PAGE (INSTITUTIONAL GOD MODE)
// Tactical comparison command center.
// Views: MOUNTAINS | TABLE | INSIGHTS
// Modes: 2-WAY | 3-WAY
// No new simulation runs. All data from committed scenario outputs.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useScenarioStore, type ScenarioId } from "@/state/scenarioStore";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import TerrainFallback2D, { isWebGLSupported } from "@/components/terrain/TerrainFallback2D";

import CompareViewToggle, { type CompareView } from "./CompareViewToggle";
import CompareModeToggle, { type CompareMode } from "./CompareModeToggle";
import DeltaBanner from "./DeltaBanner";
import CompareTable from "./CompareTable";
import CompareInsights from "./CompareInsights";
import TimeInstrumentStrip, { type TimeMetric } from "./TimeInstrumentStrip";

import styles from "./ComparePage.module.css";

// ────────────────────────────────────────────────────────────────────────
// Scenario IDs
// ────────────────────────────────────────────────────────────────────────
const BASELINE_ID: ScenarioId = "base";
const SCENARIO_A_ID: ScenarioId = "upside";
const SCENARIO_B_ID: ScenarioId = "downside";

const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: "upside", label: "Upside" },
  { id: "downside", label: "Downside" },
  { id: "stress", label: "Stress" },
];

// ────────────────────────────────────────────────────────────────────────
// WebGL detection (cached)
// ────────────────────────────────────────────────────────────────────────
const webglSupported = isWebGLSupported();

// ────────────────────────────────────────────────────────────────────────
// Helper: extract KPI set from engine result
// ────────────────────────────────────────────────────────────────────────
type KPISet = Record<string, { value: number }>;

function extractKpis(
  engineResults: Record<string, { kpis: Record<string, { value: number }> }>,
  scenarioId: string
): KPISet | null {
  const result = engineResults[scenarioId];
  if (!result?.kpis) return null;
  return result.kpis;
}

// ────────────────────────────────────────────────────────────────────────
// ComparePage Component
// ────────────────────────────────────────────────────────────────────────
const ComparePage: React.FC = () => {
  // ── View state ──
  const [view, setView] = useState<CompareView>("mountains");
  const [mode, setMode] = useState<CompareMode>("2way");
  const [timeMetric, setTimeMetric] = useState<TimeMetric>("off");
  const [scenarioAId, setScenarioAId] = useState<ScenarioId>(SCENARIO_A_ID);
  const [scenarioBId, setScenarioBId] = useState<ScenarioId>(SCENARIO_B_ID);

  // ── Store data ──
  const { engineResults, hoveredKpiIndex } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      hoveredKpiIndex: s.hoveredKpiIndex,
    }))
  );

  // ── Derived data (useMemo for performance) ──
  const baselineResult = engineResults[BASELINE_ID];
  const scenarioAResult = engineResults[scenarioAId];
  const scenarioBResult = engineResults[scenarioBId];

  const baselineDataPoints = useMemo(
    () => engineResultToMountainForces(baselineResult ?? null),
    [baselineResult]
  );

  const scenarioADataPoints = useMemo(
    () => engineResultToMountainForces(scenarioAResult ?? null),
    [scenarioAResult]
  );

  const scenarioBDataPoints = useMemo(
    () => engineResultToMountainForces(scenarioBResult ?? null),
    [scenarioBResult]
  );

  const baselineKpis = useMemo(
    () => extractKpis(engineResults as Record<string, { kpis: Record<string, { value: number }> }>, BASELINE_ID),
    [engineResults]
  );

  const scenarioAKpis = useMemo(
    () => extractKpis(engineResults as Record<string, { kpis: Record<string, { value: number }> }>, scenarioAId),
    [engineResults, scenarioAId]
  );

  const scenarioBKpis = useMemo(
    () => extractKpis(engineResults as Record<string, { kpis: Record<string, { value: number }> }>, scenarioBId),
    [engineResults, scenarioBId]
  );

  // ── Delta banner data (derived from KPIs) ──
  const deltaData = useMemo(() => {
    if (!baselineKpis || !scenarioAKpis) {
      return {
        direction: "neutral" as const,
        deltas: [
          { label: "Runway", value: "—", direction: "neutral" as const },
          { label: "Survival", value: "—", direction: "neutral" as const },
          { label: "Risk", value: "—", direction: "neutral" as const },
          { label: "EV", value: "—", direction: "neutral" as const },
        ],
      };
    }

    const bRun = baselineKpis.runway?.value ?? 24;
    const aRun = scenarioAKpis.runway?.value ?? 24;
    const runDelta = aRun - bRun;

    const bSurv = baselineKpis.riskIndex?.value ?? 70;
    const aSurv = scenarioAKpis.riskIndex?.value ?? 70;
    const survDelta = aSurv - bSurv;

    const bRisk = baselineKpis.riskScore?.value ?? 30;
    const aRisk = scenarioAKpis.riskScore?.value ?? 30;
    const riskDelta = aRisk - bRisk;

    const bEV = (baselineKpis.enterpriseValue?.value ?? 50) / 10;
    const aEV = (scenarioAKpis.enterpriseValue?.value ?? 50) / 10;
    const evDelta = aEV - bEV;

    // Overall direction
    let positiveCount = 0;
    let negativeCount = 0;
    if (runDelta > 0.5) positiveCount++;
    else if (runDelta < -0.5) negativeCount++;
    if (survDelta > 1) positiveCount++;
    else if (survDelta < -1) negativeCount++;
    if (riskDelta < -2) positiveCount++;
    else if (riskDelta > 2) negativeCount++;
    if (evDelta > 0.5) positiveCount++;
    else if (evDelta < -0.5) negativeCount++;

    const direction: "positive" | "negative" | "neutral" =
      positiveCount > negativeCount
        ? "positive"
        : negativeCount > positiveCount
          ? "negative"
          : "neutral";

    return {
      direction,
      deltas: [
        {
          label: "Runway",
          value: `${runDelta >= 0 ? "+" : ""}${runDelta.toFixed(1)}mo`,
          direction: (runDelta > 0.5 ? "positive" : runDelta < -0.5 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
        },
        {
          label: "Survival",
          value: `${survDelta >= 0 ? "+" : ""}${survDelta.toFixed(0)}pp`,
          direction: (survDelta > 1 ? "positive" : survDelta < -1 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
        },
        {
          label: "Downside Risk",
          value: `${riskDelta <= 0 ? "" : "+"}${riskDelta.toFixed(0)}%`,
          direction: (riskDelta < -2 ? "positive" : riskDelta > 2 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
        },
        {
          label: "EV",
          value: `${evDelta >= 0 ? "+" : ""}$${evDelta.toFixed(1)}M`,
          direction: (evDelta > 0.5 ? "positive" : evDelta < -0.5 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
        },
      ],
    };
  }, [baselineKpis, scenarioAKpis]);

  // ── 3-way availability ──
  const threeWayDisabled = !scenarioBResult;
  const is3Way = mode === "3way" && !threeWayDisabled;

  // ── Render helpers ──
  const renderMountain = (
    label: string,
    dataPoints: number[],
    scenarioId: ScenarioId
  ) => (
    <div className={styles.mountainCard}>
      <div className={styles.mountainLabel}>{label}</div>
      <div className={styles.mountainCanvas}>
        {webglSupported ? (
          <ScenarioMountain
            scenario={scenarioId}
            dataPoints={dataPoints}
            activeKpiIndex={hoveredKpiIndex}
          />
        ) : (
          <TerrainFallback2D dataPoints={dataPoints} />
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      {/* ── TOP CONTROL BAR ──────────────────────────────────── */}
      <div className={styles.controlBar}>
        <CompareViewToggle active={view} onChange={setView} />

        <div className={styles.controlGroup}>
          {/* Scenario A selector */}
          <div className={styles.scenarioSelector}>
            <span className={styles.scenarioLabel}>Scenario A</span>
            <select
              className={styles.scenarioSelect}
              value={scenarioAId}
              onChange={(e) => setScenarioAId(e.target.value as ScenarioId)}
            >
              {SCENARIO_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <span className={styles.controlSep} />

          <CompareModeToggle
            active={mode}
            onChange={setMode}
            threeWayDisabled={threeWayDisabled}
          />

          {is3Way && (
            <>
              <span className={styles.controlSep} />
              <div className={styles.scenarioSelector}>
                <span className={styles.scenarioLabel}>Scenario B</span>
                <select
                  className={styles.scenarioSelect}
                  value={scenarioBId}
                  onChange={(e) => setScenarioBId(e.target.value as ScenarioId)}
                >
                  {SCENARIO_OPTIONS.filter((o) => o.id !== scenarioAId).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className={styles.content}>
        {/* ── MOUNTAINS VIEW ─────────────────────────────────── */}
        {view === "mountains" && (
          <>
            <div
              className={`${styles.mountainsGrid} ${
                is3Way ? styles.mountainsGrid3 : styles.mountainsGrid2
              }`}
            >
              {renderMountain("Baseline", baselineDataPoints, BASELINE_ID)}
              {renderMountain(
                `Scenario A · ${scenarioAId.toUpperCase()}`,
                scenarioADataPoints,
                scenarioAId
              )}
              {is3Way &&
                renderMountain(
                  `Scenario B · ${scenarioBId.toUpperCase()}`,
                  scenarioBDataPoints,
                  scenarioBId
                )}
            </div>

            {/* Delta Banner */}
            <DeltaBanner
              direction={deltaData.direction}
              deltas={deltaData.deltas}
            />

            {/* Time Instrument Strip */}
            <TimeInstrumentStrip
              active={timeMetric}
              onChange={setTimeMetric}
              baselineKpis={baselineKpis}
              scenarioAKpis={scenarioAKpis}
            />
          </>
        )}

        {/* ── TABLE VIEW ─────────────────────────────────────── */}
        {view === "table" && (
          <CompareTable
            baselineKpis={baselineKpis}
            scenarioAKpis={scenarioAKpis}
            scenarioBKpis={scenarioBKpis}
            is3Way={is3Way}
          />
        )}

        {/* ── INSIGHTS VIEW ──────────────────────────────────── */}
        {view === "insights" && (
          <CompareInsights
            baselineKpis={baselineKpis}
            scenarioAKpis={scenarioAKpis}
          />
        )}
      </div>
    </div>
  );
};

export default ComparePage;
