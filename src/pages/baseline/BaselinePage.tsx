import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import TerrainStage from "@/terrain/TerrainStage";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";

import StructuralMetricsPanel from "@/components/baseline/StructuralMetricsPanel";
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel";

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

import PathAnnotations, { type PathAnnotation } from "@/components/terrain/PathAnnotations";
import ProbabilityBadge from "@/components/probability/ProbabilityBadge";
import { BASELINE_DEMO_SCRIPT } from "@/core/demo/demoScript";
import { useDemoController } from "@/core/demo/useDemoController";

import { generateBaselineRiskCurve } from "@/render/rpf/generateBaselineRisk";
import { generateBaselineConfidenceCurve } from "@/render/cf/generateBaselineConfidence";
import { generateBaselineVelocityCurve } from "@/render/tfl/generateBaselineVelocity";
import { generateBaselineHeatCurve } from "@/render/dhl/createHeatTexture";
import { generateBaselineResonanceCurve } from "@/render/srl/createResonanceTexture";
import { generateBaselineStructureCurve } from "@/render/stm/createStructureTexture";

import {
  rpfEnabled,
  cfEnabled,
  slmEnabled,
  ipeEnabled,
  tflEnabled,
  sdlEnabled,
  dhlEnabled,
  srlEnabled,
  shlEnabled,
  stmEnabled,
} from "@/config/featureFlags";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { useAnchorRegistry } from "@/spatial/AnchorRegistry";
import { setStmStructureCurve, setStmTopoScale, setStmTopoWidth } from "@/render/stm/stmRuntime";

import { ExecutiveDecisionOverlay, AICommentaryPanel } from "@/components/insights";

import type { MetricId } from "@/types/baseline";
import styles from "./BaselinePage.module.css";

export default function BaselinePage() {
  const [heatmapOn, setHeatmapOn] = useState(false); // reserved for later (no-op currently)
  const [envelopeOn, setEnvelopeOn] = useState(false); // reserved for later (no-op currently)
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

  // Phase 4: Register minimum spatial anchors (stable, non-rendering)
  useEffect(() => {
    const reg = useAnchorRegistry.getState();
    reg.upsertAnchor("origin", { x: 0, y: 0, z: 0 }, 1, "Origin");
    reg.upsertAnchor("timelineStart", { x: 0, y: 0, z: 0.1 }, 1, "Timeline Start");
    reg.upsertAnchor("timelineEnd", { x: 1, y: 0, z: 0.1 }, 1, "Timeline End");
    reg.upsertAnchor("p50_mid", { x: 0.5, y: 0, z: 0.4 }, 2, "P50 Mid");
  }, []);

  // ── Read actual BaselineV1 from SystemBaselineProvider ──
  const { baseline: systemBaseline } = useSystemBaseline();

  // ── Deterministic curves (derived from real baseline) ──
  const baselineRiskCurve = useMemo(
    () => generateBaselineRiskCurve(256, systemBaseline),
    [systemBaseline],
  );

  const baselineConfidenceCurve = useMemo(
    () => generateBaselineConfidenceCurve(baselineRiskCurve),
    [baselineRiskCurve],
  );

  const baselineVelocityCurve = useMemo(
    () => generateBaselineVelocityCurve(baselineRiskCurve, 256),
    [baselineRiskCurve],
  );

  const baselineHeatCurve = useMemo(
    () => generateBaselineHeatCurve(baselineRiskCurve, 256),
    [baselineRiskCurve],
  );

  const baselineResonanceCurve = useMemo(
    () =>
      generateBaselineResonanceCurve(
        baselineRiskCurve,
        baselineHeatCurve,
        baselineConfidenceCurve,
        256,
      ),
    [baselineRiskCurve, baselineHeatCurve, baselineConfidenceCurve],
  );

  const baselineStructureCurve = useMemo(
    () => generateBaselineStructureCurve(baselineConfidenceCurve, baselineRiskCurve, 256),
    [baselineConfidenceCurve, baselineRiskCurve],
  );

  // Eager STM runtime: P50Path / markers can sample immediately (pre-StructuralTopography effect)
  useEffect(() => {
    setStmStructureCurve(baselineStructureCurve);
    setStmTopoScale(8.0);
    setStmTopoWidth(70.0);
  }, [baselineStructureCurve]);

  // Demo controller + annotations
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
          <div className={styles.meta}>
            10:24 AM&nbsp;&nbsp;|&nbsp;&nbsp;ACME CORP&nbsp;&nbsp;|&nbsp;&nbsp;USD
          </div>

          {/* Hard-coded until systemBaseline exposes survival probability */}
          <ProbabilityBadge probability={0.7} />

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
            <div
              style={{
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
              }}
            >
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
