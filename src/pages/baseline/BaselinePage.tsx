import React, { useEffect, useMemo, useState } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
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
import FinancialTrajectoryFan from "@/components/mountain/overlays/FinancialTrajectoryFan";
import ProbabilisticEnvelopeShell from "@/components/mountain/overlays/ProbabilisticEnvelopeShell";
import StressContours from "@/components/mountain/overlays/StressContours";
import CapitalThresholdPlane from "@/components/mountain/overlays/CapitalThresholdPlane";
import ContextRiver from "@/components/mountain/overlays/ContextRiver";
import ContextTrees from "@/components/mountain/overlays/ContextTrees";
import TerrainPathSystem from "@/components/terrain/TerrainPathSystem";
import DemoTourDirector from "@/demo/DemoTourDirector";
import { TrajectoryEngine } from "@/engine/trajectory";
import { ExecutiveDecisionOverlay, AICommentaryPanel } from "@/components/insights";
import styles from "./BaselinePage.module.css";

export default function BaselinePage() {
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [envelopeOn, setEnvelopeOn] = useState(false);
  const [annotationsOn, setAnnotationsOn] = useState(false);
  const [demoOn, setDemoOn] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState<MetricId | null>(null);
  const [terrainMesh, setTerrainMesh] = useState<import("three").Mesh | null>(null);

  const envelopeVisible = envelopeOn;

  const activeMarkerId = useMarkerLinkStore((s) => s.activeId);
  const setActiveMarker = useMarkerLinkStore((s) => s.setActive);
  const setHoverMarker = useMarkerLinkStore((s) => s.setHover);

  const connections = useMemo(() => BASELINE_METRIC_CONNECTIONS, []);

  // ── Risk points for heatmap + fill overlays ──
  const riskPoints = useMemo(
    () => [
      { x: -1.2, z: 0.2, intensity: 0.75 },  // burn acceleration
      { x: 1.1, z: -0.1, intensity: 0.45 },   // margin volatility
      { x: 2.6, z: 0.8, intensity: 0.30 },    // capital dependency
    ],
    [],
  );

  // NOTE: We intentionally removed the particle "speck" envelope from Baseline
  // because it read ugly/noisy. ENVELOPE now uses a subtle shell + fan tubes.

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

    const riskAt = (x: number, y: number) => {
      let f = 0;
      for (const rp of riskPoints) {
        const dx = x - rp.x;
        const dy = y - rp.z; // rp.z is treated as terrain plane Y (depth)
        const d = Math.sqrt(dx * dx + dy * dy);
        const g = Math.exp(-d * 0.85) * rp.intensity;
        f = Math.max(f, g);
      }
      return Math.max(0, Math.min(1, f));
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

    // Context waterfall: distinct ribbon on the right side of the picture
    const river: [number, number, number][] = [];
    const riverSamples = 120;
    for (let i = 0; i <= riverSamples; i++) {
      const t = i / riverSamples;
      const y = dHalf - t * depth; // runs "down" the terrain depth axis
      const x = wHalf * 0.55 + Math.sin(t * Math.PI * 1.35) * 0.9;
      const h = sampleHeight(x, y);

      // Lift above the surface near the top so it reads as falling water
      const lift = 0.65 * (1.0 - t) * (1.0 - t) + 0.10;
      river.push([x, y, h + lift]);
    }

    // Stress contour lines: approximate risk slicing around risk points.
    const thresholds = [0.28, 0.45, 0.62];
    const circleSeg = 96;
    const contours: [number, number, number][][] = [];

    for (const rp of riskPoints) {
      for (const thr of thresholds) {
        // field ≈ exp(-d*0.85)*intensity ; solve for d
        const denom = Math.max(0.001, rp.intensity);
        const ratio = Math.max(0.001, Math.min(0.999, thr / denom));
        const d = -Math.log(ratio) / 0.85;
        if (!Number.isFinite(d) || d <= 0) continue;

        const line: [number, number, number][] = [];
        for (let i = 0; i <= circleSeg; i++) {
          const a = (i / circleSeg) * Math.PI * 2;
          const x = rp.x + Math.cos(a) * d;
          const y = rp.z + Math.sin(a) * d;
          const h = sampleHeight(x, y);
          line.push([x, y, h + 0.12]);
        }
        contours.push(line);
      }
    }

    return { baselineTrailPoints: pts, riverPoints: river, contourLines: contours, sampleHeightFn: sampleHeight };
  }, [terrainGeometry, riskPoints]);

  const baselinePathXZ = useMemo(
    () => baselineTrailPoints.map(([x, y]) => ({ x, z: y })),
    [baselineTrailPoints]
  );

  // ── Shockwave trigger (intervention pulse) ──
  const [shockId, setShockId] = useState(0);
  const [shockCenter, setShockCenter] = useState<[number, number, number]>([0, 0, 0]);

  // ── Shockwave trigger (intervention pulse) ──
  // (Not wired to UI yet; keep for future apply-intervention events)

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
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <StructuralMetricsPanel activeMetricId={activeMetricId} onHover={setActiveMetricId} />
        </div>

        <div className={`${styles.mountain} sf-mountain-backplate`}>
          <TerrainWithFallback>
            <ScenarioMountain
              scenario="base"
              mode="baseline"
              baselineAutoRotate
              baselineAutoRotatePaused
              baselineAllow360Rotate
              baselineHighVisibility
              transparentContainer
              transparentScene
              onTerrainMeshReady={setTerrainMesh}
              controlsAutoRotate={false}
              controlsEnabled={!demoOn}
              overlay={
                <>
                  {annotationsOn && (
                    <>
                      <TerrainAnchorOverlay
                        mode="baseline"
                        connections={connections}
                        activeFromId={activeMetricId}
                        terrainMesh={terrainMesh}
                        heatmapOn={heatmapOn}
                      />
                      <MountainMarkers
                        markers={markers}
                        terrainMesh={terrainMesh}
                        selectedId={activeMarkerId}
                        onHover={setHoverMarker}
                        onSelect={(id) => {
                          setHoverMarker(null);
                          setActiveMarker(activeMarkerId === id ? null : id);
                        }}
                      />
                    </>
                  )}

                  {/* Geometry-aligned overlays need the same transform as Terrain's internal group */}
                  <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>

                    {/* ── Demo Tour Director (camera + overlay) ── */}
                    {demoOn && (
                      <DemoTourDirector
                        enabled={demoOn}
                        onFinished={() => setDemoOn(false)}
                      />
                    )}

                    {/* ── Context (subtle): river + sparse trees ── */}
                    {riverPoints.length > 1 && (
                      <ContextRiver points={riverPoints} width={0.62} opacity={0.26} lift={0.10} />
                    )}
                    {terrainGeometry && (
                      <ContextTrees
                        terrainGeometry={terrainGeometry}
                        avoidPolyline={baselineTrailPoints}
                        avoidRadius={1.55}
                      />
                    )}

                    {/* ── Probability Envelope Shell (subtle inflated hull) ── */}
                    {envelopeVisible && terrainGeometry && (
                      <ProbabilisticEnvelopeShell geometry={terrainGeometry} />
                    )}

                    {/* ── Risk Heatmap Overlay (toggleable) ── */}
                    {terrainGeometry && (
                      <TerrainRiskHeatmapOverlay
                        geometry={terrainGeometry}
                        enabled={heatmapOn}
                        riskPoints={riskPoints}
                        opacity={0.28}
                        banding
                        proof={false}
                      />
                    )}

                    {/* ── Terrain-following ribbon path (surface conforming + segmented dashes) ── */}
                    {baselineTrailPoints.length > 2 && sampleHeightFn && (
                      <TerrainPathSystem
                        getHeightAt={sampleHeightFn}
                        points={baselinePathXZ}
                        swapYZ
                        halfWidth={0.55}
                        cutDepth={0.10}
                        bankHeight={0.05}
                        lift={0.06}
                        autoBank
                        autoBankStrength={0.75}
                        maxBankAngleDeg={8}
                        edgeLines
                      />
                    )}

                    {/* ── Probabilistic fan (ghost tubes) ── */}
                    {envelopeVisible && baselineTrailPoints.length > 2 && (
                      <FinancialTrajectoryFan basePath={baselineTrailPoints} spread={0.4} count={15} />
                    )}

                    {/* ── Business Trajectory Engine (terrain-projected path) ── */}
                    <TrajectoryEngine />

                    {/* ── Stress contours (risk slicing approximation) ── */}
                    {contourLines.length > 0 && (
                      <StressContours contourLines={contourLines} />
                    )}
                  </group>

                  {/* ── Capital threshold plane (meaningful floor) ── */}
                  <group position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
                    <CapitalThresholdPlane />
                  </group>

                  {/* ── Intervention Shockwave ── */}
                  <InterventionShockwave
                    triggerId={shockId}
                    center={shockCenter}
                    magnitude={0.65}
                    duration={2.0}
                  />
                </>
              }
            />
          </TerrainWithFallback>

          {/* Executive Decision Overlay (outside Canvas) */}
          <ExecutiveDecisionOverlay />

          {/* AI Commentary Panel (outside Canvas) */}
          <AICommentaryPanel />
        </div>

        <div className={styles.rightPanel}>
          <BaselineIntelligencePanel />
        </div>
      </div>

      {/* NO TIMELINE here by design */}
    </div>
  );
}
