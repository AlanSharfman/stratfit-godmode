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

import React, { memo, useMemo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { useBaselineStore } from "@/state/baselineStore";
import { selectKpis } from "@/selectors/kpiSelectors";
import { selectRiskScore } from "@/selectors/riskSelectors";
import { selectValuationFromSimulation } from "@/selectors/valuationSelectors";
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";

import TerrainTheatre from "./TerrainTheatre";
import BriefingRail from "./BriefingRail";
import SignalTiles from "./SignalTiles";
import type { SignalTileData } from "./SignalTiles";
import { INVESTOR_BRIEFING_SCRIPT } from "./director/DirectorScript";
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

const TheatreLayout: React.FC = memo(() => {
  // ── Canonical data access ──
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const baseline = useBaselineStore((s) => s.baseline);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const simResults = activeScenario?.simulationResults ?? null;

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
      evP50: valuation?.blendedValue ?? null,
      riskIndex: riskIndex ?? null,
      dispersionWidth: dispersion,
      runwayMonths: kpis?.runwayMonths ?? null,
    };
  }, [simResults]);

  // ── Director mode ──
  const director = useDirectorMode(INVESTOR_BRIEFING_SCRIPT);

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
          beats={INVESTOR_BRIEFING_SCRIPT}
          activeBeatIndex={director.beatIndex}
          status={director.status}
          beatProgress={director.beatProgress}
          totalElapsed={director.totalElapsed}
          totalDuration={director.totalDuration}
          onPlay={director.play}
          onPause={director.pause}
          onStop={director.stop}
        />
      </div>
    </div>
  );
});

TheatreLayout.displayName = "TheatreLayout";
export default TheatreLayout;
