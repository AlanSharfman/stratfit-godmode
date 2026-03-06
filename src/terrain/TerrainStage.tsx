// src/terrain/TerrainStage.tsx
// STRATFIT — Terrain Stage (God Mode)
// Single Canvas host for terrain rendering.
// Progressive terrain for Position, seed-based for Compare/other pages.

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import type { TerrainColorVariant } from "@/terrain/terrainMaterials";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import type { TimeGranularity } from "@/terrain/TimelineTicks";
import { baselineSeedString } from "@/terrain/seed";
import TimelineRuler from "@/terrain/TimelineRuler";
import HorizonBand from "@/terrain/HorizonBand";
import type { MetricsInput } from "@/terrain/buildTerrain";
import { useTerrainControls } from "@/terrain/useTerrainControls";
import TerrainHeatmapLayer from "@/terrain/layers/TerrainHeatmapLayer";
import TerrainZoneHighlight from "@/terrain/layers/TerrainZoneHighlight";
import ProgressiveTerrainSurface from "@/terrain/ProgressiveTerrainSurface";
import type { ProgressiveTerrainHandle } from "@/terrain/ProgressiveTerrainSurface";
import type { TerrainTuningParams } from "@/terrain/terrainTuning";
import HealthRidgePath from "@/terrain/HealthRidgePath";
import WaterLinePlane from "@/terrain/WaterLinePlane";
import ValleyFogLayer from "@/terrain/ValleyFogLayer";
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping";
import type { PositionKpis } from "@/pages/position/overlays/positionState";
import type { CascadeImpulse } from "@/terrain/ProgressiveTerrainSurface";
import DependencyLines from "@/terrain/DependencyLines";
import GhostTerrainLayer from "@/terrain/GhostTerrainLayer";
import TerrainKpiMarkers from "@/terrain/TerrainKpiMarkers";
import TerrainCompass from "@/terrain/TerrainCompass";
import TerrainIntelligence from "@/terrain/TerrainIntelligence";
import RiskWeatherSystem from "@/terrain/riskWeather/RiskWeatherSystem";
import OpportunitySignalLayer from "@/terrain/opportunities/OpportunitySignalLayer";
import TerrainHoverIntelligence from "@/terrain/TerrainHoverIntelligence";
import StrategicPath from "@/terrain/StrategicPath";
import ConfidenceEnvelope from "@/terrain/ConfidenceEnvelope";
import { buildConfidenceBands } from "@/terrain/buildConfidenceBands";
import type { TimeSlice } from "@/state/scenarioTimelineStore";
import { POSITION_PRESET, GOD_VIEW_CONTROLS } from "@/scene/camera/terrainCameraPresets";
import CameraDriftSystem from "@/terrain/CameraDriftSystem";
import type { DriftMode } from "@/scene/camera/cameraDriftConfig";
import TerrainDeltaOverlay from "@/terrain/TerrainDeltaOverlay";
import CameraSafetyGuard from "@/terrain/CameraSafetyGuard";


type TerrainStageProps = {
  granularity?: TimeGranularity
  terrainMetrics?: MetricsInput
  lockCamera?: boolean
  colorVariant?: TerrainColorVariant
  heatmapEnabled?: boolean
  focusedKpi?: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  zoneKpis?: PositionKpis | null
  minAzimuthAngle?: number
  maxAzimuthAngle?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  rotateSpeed?: number
  renderWhenReady?: (terrainRef: React.RefObject<TerrainSurfaceHandle>) => ReactNode
  hideMarkers?: boolean
  progressive?: boolean
  revealedKpis?: Set<KpiKey>
  autoRotateSpeed?: number
  cameraPreset?: { pos: [number, number, number]; target: [number, number, number]; fov: number }
  cascadeImpulse?: CascadeImpulse | null
  showDependencyLines?: boolean
  ghostKpis?: PositionKpis | null
  showKpiMarkers?: boolean
  tuning?: TerrainTuningParams | null
  /** Timeline slices for the strategic path trajectory */
  strategicPathSlices?: TimeSlice[] | null
  /** Camera drift mode: "micro" (subtle), "cinematic" (boardroom), or "off" */
  driftMode?: DriftMode
  /** Baseline KPIs for delta overlay (green/red terrain diff) */
  deltaBaselineKpis?: PositionKpis | null
  /** When true, removes HorizonBand so the HTML background shows through the canvas */
  transparentBackground?: boolean
  /** When true, uses cinematic key-light-dominant lighting for premium terrain rendering */
  cinematicLighting?: boolean
  children?: ReactNode
}

function EnvelopeFromSlices({
  terrainRef,
  slices,
}: {
  terrainRef: React.RefObject<ProgressiveTerrainHandle | null>
  slices: TimeSlice[]
}) {
  const bands = useMemo(() => buildConfidenceBands(slices), [slices])
  return (
    <ConfidenceEnvelope
      terrainRef={terrainRef}
      p25Slices={bands.p25}
      p75Slices={bands.p75}
    />
  )
}

export default function TerrainStage({
  granularity,
  terrainMetrics,
  lockCamera = false,
  colorVariant,
  heatmapEnabled = false,
  focusedKpi = null,
  onFocusKpi,
  onClickKpi,
  onFocusedMarkerScreen,
  zoneKpis = null,
  minAzimuthAngle = -Infinity,
  maxAzimuthAngle = Infinity,
  minPolarAngle: minPolar = GOD_VIEW_CONTROLS.minPolarAngle,
  maxPolarAngle: maxPolar = GOD_VIEW_CONTROLS.maxPolarAngle,
  rotateSpeed = GOD_VIEW_CONTROLS.rotateSpeed,
  renderWhenReady,
  hideMarkers = false,
  progressive = false,
  revealedKpis,
  autoRotateSpeed = 0,
  cameraPreset,
  cascadeImpulse,
  showDependencyLines = false,
  ghostKpis = null,
  showKpiMarkers = true,
  tuning = null,
  strategicPathSlices = null,
  driftMode = "off",
  deltaBaselineKpis = null,
  transparentBackground = false,
  cinematicLighting = false,
  children,
}: TerrainStageProps) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const progressiveRef = useRef<ProgressiveTerrainHandle>(null!);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [terrainReady, setTerrainReady] = useState(false);
  const effectivePreset = cameraPreset ?? POSITION_PRESET;

  const { baseline } = useSystemBaseline();
  const setControls = useTerrainControls((s) => s.setControls);

  const onControlsRef = useCallback((instance: OrbitControlsImpl | null) => {
    (controlsRef as React.MutableRefObject<OrbitControlsImpl | null>).current = instance;
    setControls(instance);
  }, [setControls]);


  useEffect(() => {
    if (terrainReady) return;
    let cancelled = false;
    let raf: number;
    function check() {
      if (cancelled) return;
      if (terrainRef.current || progressiveRef.current) {
        setTerrainReady(true);
        return;
      }
      raf = requestAnimationFrame(check);
    }
    check();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [terrainReady]);

  return (
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      dpr={[1, 2]}
      camera={{ position: effectivePreset.pos as unknown as [number, number, number], fov: effectivePreset.fov, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: true }}
      shadows
      onCreated={({ camera, gl }) => {
        if (!lockCamera) {
          camera.position.set(...effectivePreset.pos);
          camera.lookAt(...effectivePreset.target);
          camera.updateProjectionMatrix();
        }
        gl.setClearColor("#060b16", 0);
        gl.toneMappingExposure = 1.4;
      }}
    >
      <OrbitControls
        ref={onControlsRef}
        makeDefault
        enableRotate={!lockCamera}
        enablePan={false}
        enableZoom={!lockCamera}
        enableDamping
        dampingFactor={GOD_VIEW_CONTROLS.dampingFactor}
        minPolarAngle={minPolar}
        maxPolarAngle={maxPolar}
        minAzimuthAngle={minAzimuthAngle}
        maxAzimuthAngle={maxAzimuthAngle}
        rotateSpeed={rotateSpeed}
        minDistance={GOD_VIEW_CONTROLS.minDistance}
        maxDistance={GOD_VIEW_CONTROLS.maxDistance}
        target={effectivePreset.target}
        autoRotate={autoRotateSpeed > 0}
        autoRotateSpeed={autoRotateSpeed}
      />

      {driftMode !== "off" && !lockCamera && (
        <CameraDriftSystem controlsRef={controlsRef} mode={driftMode} />
      )}

      <CameraSafetyGuard controlsRef={controlsRef} limits={GOD_VIEW_CONTROLS} />

      {/* fog disabled — mountain background shows through transparent canvas */}

      {cinematicLighting ? (
        <>
          <ambientLight intensity={0.16} color="#061828" />
          <directionalLight position={[180, 380, 140]} intensity={2.2} color="#4fc3f7" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.5} shadow-camera-far={600} shadow-camera-left={-250} shadow-camera-right={250} shadow-camera-top={250} shadow-camera-bottom={-250} shadow-bias={-0.0004} />
          <directionalLight position={[-130, 220, -50]} intensity={0.22} color="#2690b8" />
          <directionalLight position={[0, 60, 260]} intensity={0.14} color="#4a98b8" />
          <directionalLight position={[-200, 20, -140]} intensity={0.08} color="#2e7898" />
          <hemisphereLight args={["#2e90b0", "#010610", 0.24]} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.7} color="#0a1a2f" />
          <directionalLight position={[200, 300, 200]} intensity={1.4} color="#6bdcff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-near={0.5} shadow-camera-far={500} shadow-camera-left={-200} shadow-camera-right={200} shadow-camera-top={200} shadow-camera-bottom={-200} />
          <directionalLight position={[-100, 180, -80]} intensity={0.65} color="#6ef0ff" />
          <directionalLight position={[0, 100, 220]} intensity={0.40} color="#a0d8ff" />
          <directionalLight position={[-200, 40, -100]} intensity={0.28} color="#7dd3fc" />
          <hemisphereLight args={["#66e3ff", "#050b14", 0.6]} />
        </>
      )}

      {!transparentBackground && <HorizonBand />}
      <TerrainCompass />

      <Suspense fallback={null}>
        {progressive && revealedKpis ? (
          <>
            <ProgressiveTerrainSurface
              ref={progressiveRef}
              revealedKpis={revealedKpis}
              kpis={zoneKpis}
              focusedKpi={focusedKpi}
              cascadeImpulse={cascadeImpulse}
              tuning={tuning}
            />
            {showDependencyLines && (
              <DependencyLines
                focusedKpi={focusedKpi}
                kpis={zoneKpis}
                terrainRef={progressiveRef}
              />
            )}
            <HealthRidgePath
              terrainRef={progressiveRef}
              revealedKpis={revealedKpis}
              kpis={zoneKpis}
            />
            {strategicPathSlices && strategicPathSlices.length >= 2 && (
              <>
                <StrategicPath
                  terrainRef={progressiveRef}
                  slices={strategicPathSlices}
                />
                <EnvelopeFromSlices
                  terrainRef={progressiveRef}
                  slices={strategicPathSlices}
                />
              </>
            )}
            <WaterLinePlane visible={revealedKpis.size > 0} />
            <ValleyFogLayer
              revealedKpis={revealedKpis}
              kpis={zoneKpis}
            />
            <RiskWeatherSystem kpis={zoneKpis} />
            {ghostKpis && (
              <GhostTerrainLayer
                revealedKpis={revealedKpis}
                kpis={ghostKpis}
              />
            )}
            {deltaBaselineKpis && zoneKpis && (
              <TerrainDeltaOverlay
                revealedKpis={revealedKpis}
                baselineKpis={deltaBaselineKpis}
                scenarioKpis={zoneKpis}
              />
            )}
            <TerrainIntelligence terrainRef={progressiveRef} />
            <TerrainKpiMarkers
              terrainRef={progressiveRef}
              focusedKpi={focusedKpi}
              onFocusKpi={onFocusKpi}
              onClickKpi={onClickKpi}
              onFocusedMarkerScreen={onFocusedMarkerScreen}
              kpis={zoneKpis}
              revealedKpis={revealedKpis ?? new Set()}
              visible={showKpiMarkers}
            />
            <OpportunitySignalLayer
              kpis={zoneKpis}
              terrainRef={progressiveRef}
            />
            <TerrainHoverIntelligence
              terrainRef={progressiveRef}
              kpis={zoneKpis}
            />
          </>
        ) : (
          <>
            <TerrainSurface ref={terrainRef} terrainMetrics={terrainMetrics} colorVariant={colorVariant} />
            <TerrainHeatmapLayer enabled={heatmapEnabled} terrainMetrics={terrainMetrics} />
            <TerrainZoneHighlight focusedKpi={focusedKpi} kpis={zoneKpis} terrainMetrics={terrainMetrics} />
          </>
        )}
        {terrainReady && (
          <>
            <TimelineRuler terrainRef={progressive ? progressiveRef as unknown as React.RefObject<TerrainSurfaceHandle> : terrainRef} />
            {renderWhenReady?.(progressive ? progressiveRef as unknown as React.RefObject<TerrainSurfaceHandle> : terrainRef)}
          </>
        )}
      </Suspense>

      {children}
    </Canvas>
  );
}
