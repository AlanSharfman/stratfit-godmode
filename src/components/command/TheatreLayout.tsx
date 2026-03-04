// src/components/command/TheatreLayout.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Theatre Layout (Command Centre Intelligence Theatre)
//
// Top-level composition component that orchestrates:
//   - TerrainTheatre (left 65%)
//   - BriefingRail (right 35%)
//   - SignalTiles bar (below terrain)
//   - Director mode hook (beat sequencer)
//
// Reads canonical stores for simulation data.
// No UI-side computation — selector-only access.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { useBaselineStore } from "@/state/baselineStore";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { selectKpis } from "@/selectors/kpiSelectors";
import { selectRiskScore } from "@/selectors/riskSelectors";
import {
  selectValuationFromSimulation,
  selectWaterfallFromSimulation,
} from "@/selectors/valuationSelectors";
import { selectStressProbability } from "@/selectors/probabilitySelectors";
import { selectTerrainEvents } from "@/selectors/terrainSelectors";
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import { generateCommandBriefing } from "../../core/command/generateCommandBriefing";
import type {
  BriefingInputs,
  TerrainSignals,
  PathSignals,
  RiskHotspot,
} from "../../core/command/generateCommandBriefing";

import TerrainTheatre from "./TerrainTheatre";
import BriefingRail from "./BriefingRail";
import SignalTiles from "./SignalTiles";
import type { SignalTileData } from "./SignalTiles";
import { INTELLIGENCE_BRIEFING_SCRIPT } from "./director/DirectorScript";
import { useDirectorMode } from "./director/useDirectorMode";

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  theatre: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  leftColumn: {
    flex: "0 0 65%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  terrainArea: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  tilesBar: {
    padding: "10px 14px",
    borderTop: "1px solid rgba(182, 228, 255, 0.06)",
    flexShrink: 0,
  },
  rightColumn: {
    flex: "0 0 35%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

/** Delay in ms after briefing finishes before calling onComplete (auto-collapse) */
const POST_BRIEFING_COLLAPSE_MS = 3500;

interface TheatreLayoutProps {
  /** Called once after the briefing finishes + POST_BRIEFING_COLLAPSE_MS delay */
  onComplete?: () => void;
}

const TheatreLayout: React.FC<TheatreLayoutProps> = memo(({ onComplete }) => {
  // ── Canonical data access ──
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const baseline = useBaselineStore((s) => s.baseline);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const simResults = activeScenario?.simulationResults ?? null;

  // ── Timeline data (override signals when timeline is active) ──
  const tlEngineResults = useStudioTimelineStore((s) => s.engineResults);
  const tlCurrentStep = useStudioTimelineStore((s) => s.currentStep);
  const tlCurrentPoint = useMemo(() => {
    if (!tlEngineResults) return null;
    return tlEngineResults.timeline[tlCurrentStep] ?? null;
  }, [tlEngineResults, tlCurrentStep]);

  // ── Terrain metrics ──
  const terrainMetrics = useMemo<TerrainMetrics | undefined>(() => {
    if (!baseline) return undefined;
    return deriveTerrainMetrics(baseline);
  }, [baseline]);

  // ── Signal tile data from selectors ──
  const signalData = useMemo<SignalTileData>(() => {
    const kpis = selectKpis(simResults?.kpis ?? null);
    const riskIndex = simResults?.kpis
      ? selectRiskScore(simResults.kpis)
      : null;
    const valuation = selectValuationFromSimulation(simResults);

    // Dispersion: spread between min and max method EVs
    let dispersion: number | null = null;
    if (valuation) {
      const evs = [
        valuation.dcf.enterpriseValue,
        valuation.revenueMultiple.enterpriseValue,
        valuation.ebitdaMultiple.enterpriseValue,
      ].filter((v) => isFinite(v));
      if (evs.length >= 2) {
        dispersion = Math.max(...evs) - Math.min(...evs);
      }
    }

    return {
      evP50: tlCurrentPoint?.enterpriseValue ?? valuation?.blendedValue ?? null,
      riskIndex: tlCurrentPoint?.riskIndex ?? riskIndex ?? null,
      dispersionWidth: dispersion,
      runwayMonths: kpis?.runwayMonths ?? null,
    };
  }, [simResults, tlCurrentPoint]);

  // ── Terrain-aware briefing signals (from selectors only) ──
  const terrainSignals = useMemo<TerrainSignals | null>(() => {
    const engineMetrics = simResults?.terrainMetrics;
    if (!engineMetrics) return null;
    return {
      elevationScale: engineMetrics.elevationScale,
      roughness: engineMetrics.roughness,
      ridgeIntensity: engineMetrics.ridgeIntensity,
      volatility: engineMetrics.volatility,
    };
  }, [simResults?.terrainMetrics]);

  const pathSignals = useMemo<PathSignals | null>(() => {
    const kpis = simResults?.kpis;
    if (!kpis) return null;
    return {
      pathPointCount: 120,
      stressProbability: selectStressProbability(kpis),
      growthRate: kpis.growthRate,
      churnRate: kpis.churnRate,
    };
  }, [simResults?.kpis]);

  const riskHotspots = useMemo<RiskHotspot[]>(() => {
    const events = selectTerrainEvents(simResults);
    return events
      .filter((e) => e.severity > 0.3)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        description: e.description,
        month: e.timestamp,
      }));
  }, [simResults]);

  // ── Command briefing ──
  const briefing = useMemo(() => {
    const kpis = selectKpis(simResults?.kpis ?? null);
    const riskIndex = simResults?.kpis
      ? selectRiskScore(simResults.kpis)
      : null;
    const valuation = selectValuationFromSimulation(simResults);
    const waterfall = selectWaterfallFromSimulation(
      simResults,
      baseline ?? undefined,
    );

    // Derive P10/P90 synthetic from method spread
    let evP10: number | null = null;
    let evP90: number | null = null;
    if (valuation) {
      const evs = [
        valuation.dcf.enterpriseValue,
        valuation.revenueMultiple.enterpriseValue,
        valuation.ebitdaMultiple.enterpriseValue,
      ].filter((v) => isFinite(v));
      if (evs.length >= 2) {
        evP10 = Math.min(...evs);
        evP90 = Math.max(...evs);
      }
    }

    // Derive volatility from EV spread relative to P50
    let volatilityEst: number | null = null;
    if (valuation && signalData.dispersionWidth != null && valuation.blendedValue > 0) {
      volatilityEst = signalData.dispersionWidth / valuation.blendedValue;
    }

    const inputs: BriefingInputs = {
      scenarioName: activeScenario?.decision ?? "Unknown Scenario",
      baselineName: "Baseline",
      evP50: valuation?.blendedValue ?? null,
      evDCF: valuation?.dcf.enterpriseValue ?? null,
      evRevMultiple: valuation?.revenueMultiple.enterpriseValue ?? null,
      evEbitdaMultiple: valuation?.ebitdaMultiple.enterpriseValue ?? null,
      evP10,
      evP90,
      riskIndex: riskIndex ?? null,
      runwayMonths: kpis?.runwayMonths ?? null,
      dispersionWidth: signalData.dispersionWidth,
      volatility: volatilityEst,
      waterfallSteps: waterfall?.steps?.map((s) => ({
        label: s.label,
        delta: s.delta,
        direction: s.direction,
      })) ?? null,
      probZones: null,
      provenance: {
        runId: activeScenario?.id ?? "—",
        seed: null,
        engineVersion: "stratfit-v1",
      },
      terrainSignals,
      pathSignals,
      riskHotspots,
    };

    return generateCommandBriefing(inputs);
  }, [simResults, baseline, activeScenario, signalData.dispersionWidth, terrainSignals, pathSignals, riskHotspots]);

  // ── Director mode ──
  const director = useDirectorMode(INTELLIGENCE_BRIEFING_SCRIPT);

  // Auto-collapse to console after briefing completes (plays once only)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (director.status === "finished" && onComplete) {
      collapseTimerRef.current = setTimeout(onComplete, POST_BRIEFING_COLLAPSE_MS);
    }
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, [director.status, onComplete]);

  const tileEmphasis = director.currentBeat?.tileOverrides ?? null;

  return (
    <div style={S.theatre}>
      {/* ── Left: Terrain + Tiles ── */}
      <div style={S.leftColumn}>
        <div style={S.terrainArea}>
          <TerrainTheatre
            currentBeat={director.currentBeat}
            terrainMetrics={terrainMetrics}
          />
        </div>
        <div style={S.tilesBar}>
          <SignalTiles data={signalData} emphasis={tileEmphasis} />
        </div>
      </div>

      {/* ── Right: Briefing Rail ── */}
      <div style={S.rightColumn}>
        <BriefingRail
          beats={INTELLIGENCE_BRIEFING_SCRIPT}
          activeBeatIndex={director.beatIndex}
          status={director.status}
          beatProgress={director.beatProgress}
          totalElapsed={director.totalElapsed}
          totalDuration={director.totalDuration}
          onPlay={director.play}
          onPause={director.pause}
          onStop={director.stop}
          briefing={briefing}
        />
      </div>
    </div>
  );
});

TheatreLayout.displayName = "TheatreLayout";
export default TheatreLayout;
