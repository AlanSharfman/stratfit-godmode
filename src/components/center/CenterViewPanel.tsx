// src/components/center/CenterViewPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// TERRAIN VIEW ONLY
// All other views (Risk, Valuation, Impact, Compare, Simulate, Assessment)
// have their own dedicated full-page routes in App.tsx.
// CenterViewPanel now renders ONLY the baseline terrain visualization.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";

// Terrain Intelligence Layer
import { TerrainOverlayLayer } from "@/pages/terrain/TerrainOverlays";
import TerrainOverlayToggles from "@/components/terrain/TerrainOverlayToggles";
import TerrainIntelligencePanel from "@/components/terrain/TerrainIntelligencePanel";
import ConsiderationsPanel from "@/components/terrain/ConsiderationsPanel";
import ModelDisclosure from "@/components/terrain/ModelDisclosure";
import { terrainOverlaysEnabled, heatmapEnabled as heatmapFlagEnabled } from "@/config/featureFlags";

import { useScenario, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";

interface CenterViewPanelProps {
  view?: string;
  viewMode?: string;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  onSimulateRequest?: () => void;
}

export default function CenterViewPanel(props: CenterViewPanelProps) {
  const { baseline: systemBaseline } = useSystemBaseline();
  const scenario = useScenario();
  const engineResults = useScenarioStore((s) => s.engineResults);
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);
  const engineResult = engineResults?.[scenario];

  // Wire engineResults → mountain forces (7-vector)
  const dataPoints = useMemo(() => {
    return engineResultToMountainForces(engineResult);
  }, [engineResult]);

  // ── Terrain Intelligence Layer toggles ──────────────────────────────
  const [intelligenceEnabled, setIntelligenceEnabled] = useState(true);
  const [riskDensityEnabled, setRiskDensityEnabled] = useState(!!props.heatmapEnabled);

  // Sync HEATMAP header toggle → risk density overlay (Baseline)
  useEffect(() => {
    if (props.heatmapEnabled === undefined) return;
    setRiskDensityEnabled(!!props.heatmapEnabled);
  }, [props.heatmapEnabled]);

  // Derive overlay data from engine results (no new simulation runs)
  const terrainKpis = engineResult?.kpis ?? null;
  const overlayRiskScore = useMemo(() => terrainKpis?.riskScore?.value ?? 30, [terrainKpis]);
  const overlayVariance = useMemo(() => {
    const gs = terrainKpis?.growthStress?.value ?? 0.3;
    return Math.max(0, Math.min(1, gs));
  }, [terrainKpis]);
  const overlayRunway = useMemo(() => terrainKpis?.runway?.value ?? 24, [terrainKpis]);
  const overlayLtvCac = useMemo(() => terrainKpis?.ltvCac?.value ?? 3, [terrainKpis]);
  const overlaySurvivalPct = useMemo(() => {
    const ri = terrainKpis?.riskIndex?.value ?? 70;
    return Math.max(0, Math.min(100, ri));
  }, [terrainKpis]);

  // Stable snapshot key for typewriter (only retype when scenario changes)
  const snapshotKey = useMemo(() => `${scenario}-${overlayRunway}-${overlayRiskScore}`, [scenario, overlayRunway, overlayRiskScore]);

  // CAUSAL HIGHLIGHT — Mountain band (Phase 1, UI-only)
  const [bandNonce, setBandNonce] = useState(0);
  const [bandStyle, setBandStyle] = useState<"solid" | "wash">("solid");
  const [bandColor, setBandColor] = useState("rgba(34,211,238,0.18)");

  useEffect(() => {
    const off = onCausal((detail) => {
      setBandStyle(detail.bandStyle);
      setBandColor(detail.color);
      setBandNonce((n) => n + 1);
    });
    return off;
  }, []);

  // ── Baseline gating: show inline panel if baseline is missing ──────
  if (!systemBaseline) {
    return (
      <div className="relative flex h-full w-full flex-col rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-auto">
        <div className="flex flex-1 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-6 mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 tracking-wide">
              Baseline Required
            </h2>
            <p className="text-sm text-white/40 mb-8 leading-relaxed">
              Initialize your financial baseline to unlock scenario modeling,
              simulation, and strategic analysis.
            </p>
            <button
              onClick={() => window.location.assign("/initialize")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase text-white bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-150"
            >
              Initialize Baseline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-auto">
      {/* TERRAIN VIEW — Baseline Mountain + Intelligence Panel */}
      <div className="mountain-stage relative w-full flex-1 p-4" data-tour="mountain">
        <div className="relative h-full w-full overflow-hidden flex flex-col" style={{
          borderRadius: '10px',
          background: 'linear-gradient(180deg, #0E1116 0%, #11161D 100%)',
        }}>
          {/* ═══ 2-COLUMN TERRAIN LAYOUT: Mountain + Intelligence ═══ */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}>
            {/* ── LEFT: Mountain + Overlays ── */}
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              {/* Mountain container with overlays */}
              <div className="relative flex-1 w-full" style={{ minHeight: 300 }}>
                {/* Causal highlight band */}
                {bandNonce > 0 ? (
                  <div
                    key={bandNonce}
                    className={`sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
                    style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
                  />
                ) : null}

                {/* Overlay Toggles (top-right of mountain) */}
                {terrainOverlaysEnabled && (
                  <TerrainOverlayToggles
                    intelligenceEnabled={intelligenceEnabled}
                    riskDensityEnabled={riskDensityEnabled}
                    onToggleIntelligence={() => setIntelligenceEnabled((v) => !v)}
                    onToggleRiskDensity={() => setRiskDensityEnabled((v) => !v)}
                  />
                )}

                {/* Terrain Overlays — positioned above canvas */}
                {terrainOverlaysEnabled && (intelligenceEnabled || riskDensityEnabled) && (
                  <TerrainOverlayLayer
                    intelligenceEnabled={intelligenceEnabled}
                    heatmapEnabled={riskDensityEnabled && heatmapFlagEnabled}
                    dataPoints={dataPoints}
                    riskScore={overlayRiskScore}
                    variance={overlayVariance}
                    runway={overlayRunway}
                    ltvCac={overlayLtvCac}
                    survivalPct={overlaySurvivalPct}
                  />
                )}

                {/* Dark Wireframe Mountain — WebGL with SVG fallback */}
                <TerrainWithFallback dataPoints={dataPoints}>
                  <ScenarioMountain 
                    scenario={scenario} 
                    dataPoints={dataPoints}
                    activeKpiIndex={hoveredKpiIndex}
                  />
                </TerrainWithFallback>
              </div>

              {/* CONSIDERATIONS — exactly 6 lines, typewriter effect */}
              <ConsiderationsPanel
                kpis={terrainKpis}
                snapshotKey={snapshotKey}
              />

              {/* MODEL DISCLOSURE — legal footer */}
              <ModelDisclosure />
            </div>

            {/* ── RIGHT: Active Intelligence Panel ── */}
            <TerrainIntelligencePanel
              kpis={terrainKpis}
              intelligenceEnabled={intelligenceEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
