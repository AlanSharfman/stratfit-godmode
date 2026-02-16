import React, { useEffect, useMemo, useState } from "react";
import TerrainStage from "@/terrain/TerrainStage";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";

import StructuralMetricsPanel from "@/components/baseline/StructuralMetricsPanel";
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel";
import InitiateOutcomeCards from "@/components/baseline/InitiateOutcomeCards";

import DiagnosticsDrawer from "@/components/diagnostics/DiagnosticsDrawer";

import type { MetricId } from "@/types/baseline";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";

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

import { setStmStructureCurve, setStmTopoScale, setStmTopoWidth } from "@/render/stm/stmRuntime";

import { BASELINE_DEMO_SCRIPT } from "@/core/demo/demoScript";
import { useDemoController } from "@/core/demo/useDemoController";

import { ExecutiveDecisionOverlay, AICommentaryPanel } from "@/components/insights";

import GodModePanel from "@/components/godmode/GodModePanel";
import CinematicToggle from "@/components/cinematic/CinematicToggle";
import "@/styles/godmode.css";
import "@/styles/cinematic.css";

import styles from "./BaselinePage.module.css";
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

    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
    const [activeMetricId, setActiveMetricId] = useState<MetricId | null>(null);

    const { baseline: systemBaseline } = useSystemBaseline();

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
        () => generateBaselineResonanceCurve(
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

    useEffect(() => {
        setStmStructureCurve(baselineStructureCurve);
        setStmTopoScale(24.0);
        setStmTopoWidth(70.0);
    }, [baselineStructureCurve]);

    const activeDemoStep = useDemoController(BASELINE_DEMO_SCRIPT, demoOn);

    const annotations: PathAnnotation[] = useMemo(() => {
        return [
            { id: "runway", position: new THREE.Vector3(0, 0.65, 6), label: "Runway compression begins" },
            { id: "margin", position: new THREE.Vector3(-4, 0.85, 0), label: "Margin volatility dominates" },
            { id: "capital", position: new THREE.Vector3(5, 0.75, -4), label: "Capital dependency peaks" },
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
                    <div className={styles.meta}>10:24 AM&nbsp;&nbsp;|&nbsp;&nbsp;ACME CORP&nbsp;&nbsp;|&nbsp;&nbsp;USD</div>
                    <ProbabilityBadge probability={0.70} />
                    <button
                        type="button"
                        className={`${styles.toggle} ${diagnosticsOpen ? styles.toggleOn : ""}`}
                        onClick={() => setDiagnosticsOpen((v) => !v)}
                        aria-pressed={diagnosticsOpen}
                    >
                        DIAGNOSTICS
                    </button>
                </div>
            </div>

            <DiagnosticsDrawer
                open={diagnosticsOpen}
                onClose={() => setDiagnosticsOpen(false)}
                groups={[
                    {
                        heading: "Narrative",
                        items: [
                            { id: "heatmap", label: "Heat Map", value: heatmapOn, onChange: setHeatmapOn },
                            { id: "envelope", label: "Envelope", value: envelopeOn, onChange: setEnvelopeOn },
                            { id: "demo", label: "Watch Demo", value: demoOn, onChange: setDemoOn },
                            { id: "annotations", label: "Annotations", value: annotationsOn, onChange: setAnnotationsOn },
                        ],
                    },
                    {
                        heading: "Fields",
                        items: [
                            { id: "rpf", label: "Risk Field", value: rpfOn, onChange: setRpfOn, visible: rpfEnabled },
                            { id: "cf", label: "Confidence", value: cfOn, onChange: setCfOn, visible: cfEnabled },
                            { id: "slm", label: "Markers", value: slmOn, onChange: setSlmOn, visible: slmEnabled },
                            { id: "ipe", label: "Preview", value: ipeOn, onChange: setIpeOn, visible: ipeEnabled },
                            { id: "tfl", label: "Flow", value: tflOn, onChange: setTflOn, visible: tflEnabled },
                            { id: "sdl", label: "Diverge", value: sdlOn, onChange: setSdlOn, visible: sdlEnabled },
                        ],
                    },
                    {
                        heading: "Topography",
                        items: [
                            { id: "dhl", label: "Heat", value: dhlOn, onChange: setDhlOn, visible: dhlEnabled },
                            { id: "srl", label: "Resonance", value: srlOn, onChange: setSrlOn, visible: srlEnabled },
                            { id: "stm", label: "Topo", value: stmOn, onChange: setStmOn, visible: stmEnabled },
                        ],
                    },
                ]}
            />

            <div className={styles.main}>
                <div className={styles.leftPanel}>
                    <InitiateOutcomeCards riskCurve={baselineRiskCurve} confidenceCurve={baselineConfidenceCurve} />
                    <div className={styles.leftSectionSpacer} />
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

                    <ExecutiveDecisionOverlay />
                    <CinematicToggle />
                    <GodModePanel />

                    {activeDemoStep && <div className={styles.demoToast}>{activeDemoStep.message}</div>}
                </div>

                <div className={styles.rightPanel}>
                    <BaselineIntelligencePanel />
                    <div className={styles.aiRail}>
                        <AICommentaryPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}
