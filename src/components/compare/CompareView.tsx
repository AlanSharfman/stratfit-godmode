// src/components/compare/CompareView.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare View & Scenario Architecture
//
// Institutional intelligence engine. Not a dashboard. Not a toy.
//
// Layout:
//   - Scenario toggle strip (top)
//   - Dual mountains (side-by-side, shared horizon)
//   - Metrics strip (inline deltas)
//   - Comparison dropdown
//   - Compact comparison table
//   - Single-line structured commentary
//
// System Principles:
//   - Does not advise, warn, dramatise, or celebrate
//   - Reveals structural consequences
//   - No collapse animations, glow, or threshold theatrics
//   - All risk scaling continuous and proportional
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useCallback, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCompareViewStore, type CompareScenario } from "@/state/compareViewStore";
import type { LeverState } from "@/logic/calculateMetrics";
import { calculateMetrics } from "@/logic/calculateMetrics";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";

import ScenarioStrip from "./ScenarioStrip";
import CompareScenarioStrip from "./CompareScenarioStrip";
import CompareKpiOverlay from "./CompareKpiOverlay";
import SnapshotComparePanel from "./SnapshotComparePanel";
import { useCompareScenarioOverride } from "./useCompareScenarioOverride";
import MetricsStrip from "./MetricsStrip";
import DeltaIntelligenceTable from "./DeltaIntelligenceTable";
import KPIDeltaStrip from "./KPIDeltaStrip";
import styles from "./CompareView.module.css";

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL LEVERS (for new scenario creation)
// ═══════════════════════════════════════════════════════════════════════════

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

const DEFAULT_DATA_POINTS = [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const CompareView: React.FC = memo(() => {
  // STEP 25: Compare-local override + restore on exit
  useCompareScenarioOverride();
  // ── Store selectors ────────────────────────────────────────────────
  const {
    currentStructure,
    scenarios,
    activeScenarioId,
    compareToId,
  } = useCompareViewStore(
    useShallow((s) => ({
      currentStructure: s.currentStructure,
      scenarios: s.scenarios,
      activeScenarioId: s.activeScenarioId,
      compareToId: s.compareToId,
    }))
  );

  const setActiveScenarioId = useCompareViewStore((s) => s.setActiveScenarioId);
  const setCompareToId = useCompareViewStore((s) => s.setCompareToId);
  const addScenario = useCompareViewStore((s) => s.addScenario);
  const duplicateScenario = useCompareViewStore((s) => s.duplicateScenario);
  const renameScenario = useCompareViewStore((s) => s.renameScenario);
  const deleteScenario = useCompareViewStore((s) => s.deleteScenario);

  // ── Derived: active scenario & compare target ──────────────────────
  const activeScenario = useMemo<CompareScenario | null>(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0] ?? null,
    [scenarios, activeScenarioId],
  );

  const compareTarget = useMemo<CompareScenario>(() => {
    if (compareToId === "current") return currentStructure;
    return scenarios.find((s) => s.id === compareToId) ?? currentStructure;
  }, [compareToId, currentStructure, scenarios]);

  // ── Left = compare target (default: Current Structure) ─────────────
  // ── Right = active scenario ────────────────────────────────────────
  const leftData = compareTarget;
  const rightData = activeScenario;

  // ── Ensure metrics exist (compute if missing) ──────────────────────
  const leftMetrics = useMemo(() => {
    if (leftData.metrics) return leftData.metrics;
    return calculateMetrics(leftData.levers, "base");
  }, [leftData]);

  const rightMetrics = useMemo(() => {
    if (!rightData) return null;
    if (rightData.metrics) return rightData.metrics;
    return calculateMetrics(rightData.levers, "base");
  }, [rightData]);

  // ── Data points for mountains ──────────────────────────────────────
  const leftDataPoints = leftData.dataPoints.length > 0
    ? leftData.dataPoints
    : DEFAULT_DATA_POINTS;

  const rightDataPoints = rightData
    ? (rightData.dataPoints.length > 0 ? rightData.dataPoints : DEFAULT_DATA_POINTS)
    : DEFAULT_DATA_POINTS;

  // ── Comparison dropdown options ────────────────────────────────────
  const compareOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [
      { id: "current", name: "Current Structure" },
    ];
    for (const s of scenarios) {
      opts.push({ id: s.id, name: s.name });
    }
    return opts;
  }, [scenarios]);

  // ── Scenario CRUD callbacks ────────────────────────────────────────
  const handleAdd = useCallback(() => {
    const proposed = `Scenario ${String.fromCharCode(64 + (scenarios.length + 1))}`;
    const input = window.prompt("Name this scenario", proposed);
    const name = String(input ?? "").trim();
    if (!name) return;
    const newScenario = addScenario({
      id: "",
      name,
      levers: { ...INITIAL_LEVERS },
      metrics: null,
      simulationResult: null,
      dataPoints: [...DEFAULT_DATA_POINTS],
    });
    if (newScenario) {
      setActiveScenarioId(newScenario.id);
    }
  }, [scenarios.length, addScenario, setActiveScenarioId]);

  const handleDuplicate = useCallback((id: string) => {
    const dup = duplicateScenario(id);
    if (dup) {
      setActiveScenarioId(dup.id);
    }
  }, [duplicateScenario, setActiveScenarioId]);

  const handleRename = useCallback((id: string, name: string) => {
    renameScenario(id, name);
  }, [renameScenario]);

  const handleDelete = useCallback((id: string) => {
    deleteScenario(id);
  }, [deleteScenario]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className={styles.root}>

      {/* Controls */}
      <div className={styles.controls}>
        <ScenarioStrip
          currentStructureName={currentStructure.name}
          scenarios={scenarios}
          activeId={activeScenarioId}
          onSelect={setActiveScenarioId}
          onDuplicate={handleDuplicate}
          onRename={handleRename}
          onDelete={handleDelete}
          onAdd={handleAdd}
          maxScenarios={3}
        />

        <div className={styles.comparisonRow}>
          <label className={styles.comparisonLabel}>Compare to</label>
          <select
            className={styles.comparisonSelect}
            value={compareToId}
            onChange={(e) => setCompareToId(e.target.value)}
          >
            {compareOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Delta */}
      <div className={styles.kpiWrap}>
        <KPIDeltaStrip
          leftMetrics={leftMetrics}
          rightMetrics={rightMetrics}
          leftName={leftData.name}
          rightName={rightData?.name}
        />
      </div>

      {/* Mountains */}
      <div className={styles.mountainsRow}>
        <div className={styles.mountainLeft}>
          <div className={styles.mountainLabel}>{leftData.name.toUpperCase()}</div>
          <div className={styles.mountainCanvas}>
            <TerrainWithFallback dataPoints={leftDataPoints}>
              <ScenarioMountain scenario="base" dataPoints={leftDataPoints} />
            </TerrainWithFallback>
          </div>
        </div>

        <div className={styles.mountainGap} />

        <div className={styles.mountainRight}>
          <div className={styles.mountainLabel}>
            {rightData ? rightData.name.toUpperCase() : "—"}
          </div>
          <div className={styles.mountainCanvas}>
            {rightData ? (
              <TerrainWithFallback dataPoints={rightDataPoints}>
                <ScenarioMountain scenario="upside" dataPoints={rightDataPoints} />
              </TerrainWithFallback>
            ) : (
              <div className={styles.emptyMountain}>No scenario selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsWrap}>
        <MetricsStrip
          leftMetrics={leftMetrics}
          rightMetrics={rightMetrics}
          leftSim={leftData.simulationResult}
          rightSim={rightData?.simulationResult ?? null}
        />
      </div>

      {/* Delta Intelligence */}
      <div className={styles.deltaWrap}>
        <DeltaIntelligenceTable
          leftMetrics={leftMetrics}
          rightMetrics={rightMetrics}
          leftName={leftData.name}
          rightName={rightData?.name ?? "Scenario"}
          leftSim={leftData.simulationResult}
          rightSim={rightData?.simulationResult ?? null}
        />
      </div>

      {/* STEP 24: Compare-local scenario selection + persistence */}
      <CompareScenarioStrip />

      {/* STEP 28: KPI overlay (Baseline vs Scenario + deltas) */}
      <CompareKpiOverlay />

      {/* STEP 21: snapshot-driven narrative + deltas overlay */}
      <SnapshotComparePanel />
    </div>
  );
});

CompareView.displayName = "CompareView";
export default CompareView;




