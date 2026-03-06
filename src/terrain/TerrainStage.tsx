// src/terrain/TerrainStage.tsx
// STRATFIT — Terrain Stage (God Mode)
// Single Canvas host for terrain rendering.
// Progressive terrain for Position, seed-based for Compare/other pages.

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import { POSITION_PRESET, GOD_VIEW_CONTROLS } from "@/scene/camera/terrainCameraPresets";


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
  children?: ReactNode
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

  const [fogColor] = useState("#263A52");

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
      onCreated={({ camera, gl }) => {
        if (!lockCamera) {
          camera.position.set(...effectivePreset.pos);
          camera.lookAt(...effectivePreset.target);
          camera.updateProjectionMatrix();
        }
        gl.setClearColor("#0C1A2E", 1);
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

      <fogExp2 attach="fog" args={[fogColor, 0.002]} />

      <ambientLight intensity={0.75} />
      <directionalLight position={[150, 220, 100]} intensity={1.80} color="#E8FAFE" castShadow={false} />
      <directionalLight position={[-100, 160, -80]} intensity={0.90} color="#6ef0ff" />
      <directionalLight position={[0, 80, 200]} intensity={0.55} color="#a0d8ff" />
      <directionalLight position={[-200, 30, -100]} intensity={0.38} color="#7dd3fc" />
      <hemisphereLight args={["#3a5880", "#1c2a40", 0.70]} />

      <HorizonBand />
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
            <WaterLinePlane visible={revealedKpis.size > 0} />
            <ValleyFogLayer
              revealedKpis={revealedKpis}
              kpis={zoneKpis}
            />
            {ghostKpis && (
              <GhostTerrainLayer
                revealedKpis={revealedKpis}
                kpis={ghostKpis}
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
