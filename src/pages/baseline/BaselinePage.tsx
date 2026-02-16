import React, { useEffect, useMemo, useState } from "react";
import TerrainStage from "@/terrain/TerrainStage";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import StructuralMetricsPanel from "@/components/baseline/StructuralMetricsPanel";
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel";
import MountainMarkers, { type MountainMarker } from "@/components/terrain/MountainMarkers";
import { useMarkerLinkStore } from "@/state/markerLinkStore";
import type { MetricId } from "@/types/baseline";
import {
  TerrainAnchorOverlay,
  BASELINE_METRIC_CONNECTIONS,
} from "@/components/mountain/anchorSystem";
import TerrainRiskHeatmapOverlay from "@/components/mountain/overlays/TerrainRiskHeatmapOverlay";
import InterventionShockwave from "@/components/mountain/overlays/InterventionShockwave";
// DISABLED: Single corridor authority — only P50Path in TerrainStage
// import FinancialTrajectoryFan from "@/components/mountain/overlays/FinancialTrajectoryFan";
// import ProbabilisticEnvelopeShell from "@/components/mountain/overlays/ProbabilisticEnvelopeShell";
// import StressContours from "@/components/mountain/overlays/StressContours";
// import CapitalThresholdPlane from "@/components/mountain/overlays/CapitalThresholdPlane";
// import ContextRiver from "@/components/mountain/overlays/ContextRiver";
// import ContextTrees from "@/components/mountain/overlays/ContextTrees";
// import TerrainPathSystem from "@/components/terrain/TerrainPathSystem";
import DemoTourDirector from "@/demo/DemoTourDirector";
import { TrajectoryEngine } from "@/engine/trajectory";
import { ExecutiveDecisionOverlay, AICommentaryPanel } from "@/components/insights";
import RiskPressureField from "@/components/terrain/RiskPressureField";
import ConfidenceField from "@/components/terrain/ConfidenceField";
import StrategicLeverageMarkers from "@/components/terrain/StrategicLeverageMarkers";
import InterventionPreview from "@/components/terrain/InterventionPreview";
import TemporalFlow from "@/components/terrain/TemporalFlow";
import ScenarioDivergence from "@/components/terrain/ScenarioDivergence";
import DecisionHeat from "@/components/terrain/DecisionHeat";
import StructuralResonance from "@/components/terrain/StructuralResonance";
import StructuralTopography from "@/components/terrain/StructuralTopography";
import SemanticHarmonizer from "@/components/terrain/SemanticHarmonizer";
import MarkerPedestals from "@/components/terrain/MarkerPedestals";
import BaselineTimelineTicks from "@/components/terrain/core/BaselineTimelineTicks";
import BaselineStoryRail from "@/components/baseline/BaselineStoryRail";
import { generateBaselineRiskCurve } from "@/render/rpf/generateBaselineRisk";
import { generateBaselineConfidenceCurve } from "@/render/cf/generateBaselineConfidence";
import { generateBaselineVelocityCurve } from "@/render/tfl/generateBaselineVelocity";
import { generateBaselineHeatCurve } from "@/render/dhl/createHeatTexture";
import { generateBaselineResonanceCurve } from "@/render/srl/createResonanceTexture";
import { generateBaselineStructureCurve } from "@/render/stm/createStructureTexture";
import { rpfEnabled, cfEnabled, slmEnabled, ipeEnabled, tflEnabled, sdlEnabled, dhlEnabled, srlEnabled, shlEnabled, stmEnabled } from "@/config/featureFlags";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { setStmStructureCurve, setStmTopoScale, setStmTopoWidth } from "@/render/stm/stmRuntime";
import styles from "./BaselinePage.module.css";
import { useAnchorRegistry } from "@/spatial/AnchorRegistry";
import PathAnnotations, { type PathAnnotation } from "@/components/terrain/PathAnnotations";
import ProbabilityBadge from "@/components/probability/ProbabilityBadge";
import { BASELINE_DEMO_SCRIPT } from "@/core/demo/demoScript";
import { useDemoController } from "@/core/demo/useDemoController";
import * as THREE from "three";

export default function BaselinePage() {
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [envelopeOn, setEnvelopeOn] = useState(false);
  const [annotationsOn, setAnnotationsOn] = useState(false);
  const [demoOn, setDemoOn] = useState(false);
  const [rpfOn, setRpfOn] = useState(rpfEnabled);
  const [cfOn, setCfOn] = useState(cfEnabled);
  const [slmOn, setSlmOn] = useState(slmEnabled);
  const [ipeOn, setIpeOn] = useState(ipeEnabled);
  const [tflOn, setTflOn] = useState(tflEnabled);
  const [sdlOn, setSdlOn] = useState(sdlEnabled);
  const [dhlOn, setDhlOn] = useState(dhlEnabled);
  const [srlOn, setSrlOn] = useState(srlEnabled);
  const [stmOn, setStmOn] = useState(stmEnabled);
  const [activeMetricId, setActiveMetricId] = useState<MetricId | null>(null);
  const [terrainMesh, setTerrainMesh] = useState<import("three").Mesh | null>(null);

  // Phase 4: Register minimum spatial anchors
  useEffect(() => {
    const reg = useAnchorRegistry.getState();
    reg.upsertAnchor("origin", { x: 0, y: 0, z: 0 }, 1, "Origin");
    reg.upsertAnchor("timelineStart", { x: 0, y: 0, z: 0.1 }, 1, "Timeline Start");
    reg.upsertAnchor("timelineEnd", { x: 1, y: 0, z: 0.1 }, 1, "Timeline End");
    reg.upsertAnchor("p50_mid", { x: 0.5, y: 0, z: 0.4 }, 2, "P50 Mid");
  }, []);

  const envelopeVisible = envelopeOn;

  const activeMarkerId = useMarkerLinkStore((s) => s.activeId);
  const setActiveMarker = useMarkerLinkStore((s) => s.setActive);
  const setHoverMarker = useMarkerLinkStore((s) => s.setHover);

  const connections = useMemo(() => BASELINE_METRIC_CONNECTIONS, []);

  // ── Read actual BaselineV1 from SystemBaselineProvider ──
  const { baseline: systemBaseline } = useSystemBaseline();

  // ── Deterministic baseline risk curve for RPF (driven by real data) ──
  const baselineRiskCurve = useMemo(
    () => generateBaselineRiskCurve(256, systemBaseline),
    [systemBaseline],
  );

  // ── Deterministic baseline confidence curve for CF (derived from risk) ──
  const baselineConfidenceCurve = useMemo(
    () => generateBaselineConfidenceCurve(baselineRiskCurve),
    [baselineRiskCurve],
  );

  // ── Deterministic velocity curve for TFL (derived from risk) ──
  const baselineVelocityCurve = useMemo(
    () => generateBaselineVelocityCurve(baselineRiskCurve, 256),
    [baselineRiskCurve],
  );

  // ── Deterministic heat curve for DHL (derived from risk) ──
  const baselineHeatCurve = useMemo(
    () => generateBaselineHeatCurve(baselineRiskCurve, 256),
    [baselineRiskCurve],
  );

  // ── Deterministic resonance curve for SRL (derived from risk + heat + confidence) ──
  const baselineResonanceCurve = useMemo(
    () => generateBaselineResonanceCurve(baselineRiskCurve, baselineHeatCurve, baselineConfidenceCurve, 256),
    [baselineRiskCurve, baselineHeatCurve, baselineConfidenceCurve],
  );

  // ── Deterministic structure curve for STM (derived from confidence + risk) ──
  const baselineStructureCurve = useMemo(
    () => generateBaselineStructureCurve(baselineConfidenceCurve, baselineRiskCurve, 256),
    [baselineConfidenceCurve, baselineRiskCurve],
  );

  // Eagerly set STM runtime curve so P50Path/markers can sample displacement
  // during their first render (before StructuralTopography useEffect runs).
  useEffect(() => {
    setStmStructureCurve(baselineStructureCurve);
    setStmTopoScale(24.0);
    setStmTopoWidth(70.0);
  }, [baselineStructureCurve]);

  // Demo controller + path annotations
  const activeDemoStep = useDemoController(BASELINE_DEMO_SCRIPT, demoOn);

  const annotations: PathAnnotation[] = useMemo(() => {
    return [
      {
        id: "runway-compression",
        position: new THREE.Vector3(0, 0.6, 6),
        label: "Runway compression begins here",
      },
      {
        id: "margin-volatility",
        position: new THREE.Vector3(-4, 0.8, 0),
        label: "Margin volatility dominates outcomes",
      },
      {
        id: "capital-dependency",
        position: new THREE.Vector3(5, 0.7, -4),
        label: "Capital dependency peaks here",
      },
    ];
  }, []);

  // ── Risk points for heatmap + fill overlays ──
  const riskPoints = useMemo(
    () => [
      { x: -1.2, z: 0.2, intensity: 0.75 },  // burn acceleration
      { x: 1.1, z: -0.1, intensity: 0.45 },   // margin volatility
      { x: 2.6, z: 0.8, intensity: 0.30 },    // capital dependency
    ],
    [],
  );

  // Derive geometry from mesh for geometry-aligned overlays
  const terrainGeometry = (terrainMesh?.geometry as import("three").BufferGeometry | undefined) ?? null;

  // ── Baseline trail (terrain-hugging, "real path" ribbon) ──
  const { baselineTrailPoints, riverPoints, contourLines, sampleHeightFn } = useMemo(() => {
    const empty = {
      baselineTrailPoints: [] as [number, number, number][],
      riverPoints: [] as [number, number, number][],
      contourLines: [] as [number, number, number][][],
      sampleHeightFn: null as null | ((x: number, y: number) => number),
    };
    if (!terrainGeometry) return empty;

    const pos = terrainGeometry.getAttribute("position") as import("three").BufferAttribute | undefined;
    if (!pos) return empty;

    const params = (terrainGeometry as any).parameters as
      | {
        width?: number;
        height?: number;
        widthSegments?: number;
        heightSegments?: number;
      }
      | undefined;

    const width = params?.width ?? 50;
    const depth = params?.height ?? 25;
    const segW = params?.widthSegments ?? 120;
    const segD = params?.heightSegments ?? 60;
    const wHalf = width / 2;
    const dHalf = depth / 2;
    const stride = segW + 1;

    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

    const sampleHeight = (x: number, y: number) => {
      const uFloat = ((x + wHalf) / width) * segW;
      const vFloat = ((y + dHalf) / depth) * segD;

      const u0 = clamp(Math.floor(uFloat), 0, segW);
      const v0 = clamp(Math.floor(vFloat), 0, segD);
      const u1 = clamp(u0 + 1, 0, segW);
      const v1 = clamp(v0 + 1, 0, segD);
      const fu = uFloat - u0;
      const fv = vFloat - v0;

      const idx00 = v0 * stride + u0;
      const idx10 = v0 * stride + u1;
      const idx01 = v1 * stride + u0;
      const idx11 = v1 * stride + u1;

      const h00 = pos.getZ(idx00);
      const h10 = pos.getZ(idx10);
      const h01 = pos.getZ(idx01);
      const h11 = pos.getZ(idx11);

      const hx0 = h00 * (1 - fu) + h10 * fu;
      const hx1 = h01 * (1 - fu) + h11 * fu;
      return hx0 * (1 - fv) + hx1 * fv;
    };

    // Trail curve: gently meanders (so it reads like a real path, not a ruler line)
    const samples = 140;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = -wHalf + t * width;
      const y =
        -1.6 +
        Math.sin(t * Math.PI * 2.0) * 1.05 +
        Math.sin(t * Math.PI * 0.9 + 0.7) * 0.55;
      const h = sampleHeight(x, y);
      pts.push([x, y, h + 0.18]);
    }

    return { baselineTrailPoints: pts, riverPoints: [], contourLines: [], sampleHeightFn: sampleHeight };
  }, [terrainGeometry, riskPoints]);

  const baselinePathXZ = useMemo(
    () => baselineTrailPoints.map(([x, y]) => ({ x, z: y })),
    [baselineTrailPoints]
  );

  // ── Shockwave trigger (intervention pulse) ──
  const [shockId, setShockId] = useState(0);
  const [shockCenter, setShockCenter] = useState<[number, number, number]>([0, 0, 0]);

  const markers: MountainMarker[] = useMemo(
    () => [
      {
        id: "burn-acceleration",
        title: "Burn Acceleration",
        subtitle: "Burn rising faster than ARR scale",
        tone: "risk" as const,
        uv: { u: 0.82, v: 0.38 },
        tooltip: {
          what: "Burn rate is accelerating relative to revenue growth.",
          why: "Runway collapses even if ARR grows.",
          how: "Reduce fixed load / phase hiring / delay non-core spend.",
          next: "Use Studio levers to test cost discipline + hiring intensity.",
        },
      },
      {
        id: "margin-volatility",
        title: "Margin Volatility",
        subtitle: "Gross margin sensitivity detected",
        tone: "risk" as const,
        uv: { u: 0.44, v: 0.44 },
        tooltip: {
          what: "Gross margin is sensitive to mix shifts and cost fluctuations.",
          why: "Unpredictable margins erode investor confidence and runway.",
          how: "Stabilize COGS, negotiate fixed pricing, reduce variable cost exposure.",
          next: "Run stress scenario to quantify margin floor.",
        },
      },
      {
        id: "revenue-concentration",
        title: "Revenue Concentration",
        subtitle: "Top-heavy customer dependency",
        tone: "strategy" as const,
        uv: { u: 0.30, v: 0.48 },
        tooltip: {
          what: "Revenue is concentrated in a small number of accounts.",
          why: "Single-customer loss creates outsized ARR impact.",
          how: "Diversify pipeline, accelerate mid-market expansion.",
          next: "Review concentration metrics in Baseline KPI strip.",
        },
      },
      {
        id: "runway-strength",
        title: "Runway Strength",
        subtitle: "Capital position supports strategy",
        tone: "strength" as const,
        uv: { u: 0.62, v: 0.30 },
        tooltip: {
          what: "Current cash position provides adequate runway buffer.",
          why: "Sufficient runway enables strategic investment without dilution.",
          how: "Maintain burn discipline to preserve optionality.",
        },
      },
      {
        id: "capital-dependency",
        title: "Capital Dependency",
        subtitle: "External capital timing window",
        tone: "info" as const,
        uv: { u: 0.58, v: 0.64 },
        tooltip: {
          what: "Business model requires capital infusion within planning horizon.",
          why: "Timing and terms of next raise determine strategic flexibility.",
          how: "Build fundraising pipeline 6+ months ahead of need.",
          next: "Model capital scenarios in Studio.",
        },
      },
    ],
    [],
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.leftBrand}>
          <div className={styles.brand}>STRATFIT — BASELINE</div>
        </div>

        <div className={styles.centerTitle}>
          <div className={styles.title}>Deterministic Structural Baseline</div>
          <div className={styles.subtitle}>No intervention applied.</div>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.meta}>10:24 AM&nbsp;&nbsp;|&nbsp;&nbsp;ACME CORP&nbsp;&nbsp;|&nbsp;&nbsp;USD</div>
          <ProbabilityBadge probability={0.70} />
          <button
            type="button"
            className={`${styles.toggle} ${heatmapOn ? styles.toggleOn : ""}`}
            onClick={() => setHeatmapOn((v) => !v)}
            aria-pressed={heatmapOn}
          >
            HEAT MAP: {heatmapOn ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${envelopeOn ? styles.toggleOn : ""}`}
            onClick={() => setEnvelopeOn((v) => !v)}
            aria-pressed={envelopeOn}
          >
            ENVELOPE: {envelopeOn ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${demoOn ? styles.toggleOn : ""}`}
            onClick={() => setDemoOn((v) => !v)}
            aria-pressed={demoOn}
          >
            WATCH DEMO: {demoOn ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${annotationsOn ? styles.toggleOn : ""}`}
            onClick={() => setAnnotationsOn((v) => !v)}
            aria-pressed={annotationsOn}
          >
            ANNOTATIONS: {annotationsOn ? "ON" : "OFF"}
          </button>
          {rpfEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${rpfOn ? styles.toggleOn : ""}`}
              onClick={() => setRpfOn((v) => !v)}
              aria-pressed={rpfOn}
            >
              RISK FIELD: {rpfOn ? "ON" : "OFF"}
            </button>
          )}
          {cfEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${cfOn ? styles.toggleOn : ""}`}
              onClick={() => setCfOn((v) => !v)}
              aria-pressed={cfOn}
            >
              CONFIDENCE: {cfOn ? "ON" : "OFF"}
            </button>
          )}
          {slmEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${slmOn ? styles.toggleOn : ""}`}
              onClick={() => setSlmOn((v) => !v)}
              aria-pressed={slmOn}
            >
              MARKERS: {slmOn ? "ON" : "OFF"}
            </button>
          )}
          {ipeEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${ipeOn ? styles.toggleOn : ""}`}
              onClick={() => setIpeOn((v) => !v)}
              aria-pressed={ipeOn}
            >
              PREVIEW: {ipeOn ? "ON" : "OFF"}
            </button>
          )}
          {tflEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${tflOn ? styles.toggleOn : ""}`}
              onClick={() => setTflOn((v) => !v)}
              aria-pressed={tflOn}
            >
              FLOW: {tflOn ? "ON" : "OFF"}
            </button>
          )}
          {sdlEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${sdlOn ? styles.toggleOn : ""}`}
              onClick={() => setSdlOn((v) => !v)}
              aria-pressed={sdlOn}
            >
              DIVERGE: {sdlOn ? "ON" : "OFF"}
            </button>
          )}
          {dhlEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${dhlOn ? styles.toggleOn : ""}`}
              onClick={() => setDhlOn((v) => !v)}
              aria-pressed={dhlOn}
            >
              HEAT: {dhlOn ? "ON" : "OFF"}
            </button>
          )}
          {srlEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${srlOn ? styles.toggleOn : ""}`}
              onClick={() => setSrlOn((v) => !v)}
              aria-pressed={srlOn}
            >
              RESONANCE: {srlOn ? "ON" : "OFF"}
            </button>
          )}
          {stmEnabled && (
            <button
              type="button"
              className={`${styles.toggle} ${stmOn ? styles.toggleOn : ""}`}
              onClick={() => setStmOn((v) => !v)}
              aria-pressed={stmOn}
            >
              TOPO: {stmOn ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <StructuralMetricsPanel activeMetricId={activeMetricId} onHover={setActiveMetricId} />

          <div className={styles.journeyRail}>
            <BaselineStoryRail />
          </div>
        </div>

        <div className={`${styles.mountain} sf-mountain-backplate`}>
          <TerrainWithFallback>
            <TerrainStage>
              {rpfEnabled && <RiskPressureField riskValues={baselineRiskCurve} enabled={rpfOn} />}
              {cfEnabled && <ConfidenceField confidenceValues={baselineConfidenceCurve} enabled={cfOn} />}
              {slmEnabled && <StrategicLeverageMarkers riskValues={baselineRiskCurve} enabled={slmOn} />}
              {ipeEnabled && <InterventionPreview riskValues={baselineRiskCurve} enabled={ipeOn && slmOn} />}
              {tflEnabled && <TemporalFlow velocityValues={baselineVelocityCurve} enabled={tflOn} />}
              {sdlEnabled && <ScenarioDivergence riskValues={baselineRiskCurve} enabled={sdlOn} />}
              {dhlEnabled && <DecisionHeat heatValues={baselineHeatCurve} enabled={dhlOn} />}
              {srlEnabled && <StructuralResonance resonanceValues={baselineResonanceCurve} enabled={srlOn} />}
              {stmEnabled && <StructuralTopography structureValues={baselineStructureCurve} enabled={stmOn} />}
              {shlEnabled && <SemanticHarmonizer />}
              {slmEnabled && <MarkerPedestals enabled={slmOn} />}
              <BaselineTimelineTicks />
              <PathAnnotations annotations={annotations} visible={annotationsOn} />
            </TerrainStage>
          </TerrainWithFallback>

          {/* Executive Decision Overlay (outside Canvas) */}
          <ExecutiveDecisionOverlay />

          {/* AI Commentary Panel (outside Canvas) */}
          <AICommentaryPanel />

          {/* Demo step overlay */}
          {activeDemoStep && (
            <div style={{
              position: "absolute",
              left: "50%",
              top: 110,
              transform: "translateX(-50%)",
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(34,211,238,0.25)",
              background: "rgba(15,23,42,0.75)",
              color: "#e2e8f0",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              backdropFilter: "blur(10px)",
              pointerEvents: "none",
              zIndex: 50,
              maxWidth: 520,
              textAlign: "center",
            }}>
              {activeDemoStep.message}
            </div>
          )}
        </div>

        <div className={styles.rightPanel}>
          <BaselineIntelligencePanel />
        </div>
      </div>

      {/* NO TIMELINE here by design */}
    </div>
  );
}
