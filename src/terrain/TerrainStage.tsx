// src/terrain/TerrainStage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Position Stage (REALITY VISUALIZATION)
// Navigation Contract: src/contracts/navigationContract.ts
//
// ROLE: Single Canvas host for terrain, P50 trajectory, markers, timeline,
//       and liquidity particles (when enabled).
//
// GOD MODE EXTENSION POINT:
//   Supports safe in-canvas injection via {children}.
//
// RULES (UNCHANGED):
//   - No Objectives dependency — terrain shape is Initiate-derived only.
//   - No simulation logic.
//   - No baseline writes.
//   - Water/liquidity particles are a Position layer.
// ═══════════════════════════════════════════════════════════════════════════

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import type { TerrainColorVariant } from "@/terrain/terrainMaterials";
import P50Path from "@/paths/P50Path";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import BaselineTimelineTicks from "@/terrain/BaselineTimelineTicks";
import type { TimeGranularity } from "@/terrain/TimelineTicks";
import { baselineSeedString } from "@/terrain/seed";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";
import TerrainSignalsLayer from "@/components/terrain/signals/TerrainSignalsLayer";
import StrategicMarkers from "@/terrain/StrategicMarkers";
import HorizonBand from "@/terrain/HorizonBand";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import { useTerrainControls } from "@/terrain/useTerrainControls";
import { useDebugFlags, useDebugSignals } from "@/debug/debugSignals";
import { useOverlayVisibility } from "@/domain/ui/overlayVisibility";
import TerrainFocusGlow from "@/components/terrain/intelligence/TerrainFocusGlow";
import TerrainHeatmapLayer from "@/terrain/layers/TerrainHeatmapLayer";
import TerrainLaserTarget from "@/components/intelligence/TerrainLaserTarget";
import TerrainTargetPulse from "@/components/intelligence/TerrainTargetPulse";
import TerrainTargetLabel from "@/components/intelligence/TerrainTargetLabel";
import TerrainTargetSpotlight from "@/components/intelligence/TerrainTargetSpotlight";
import IntelligenceCameraFocus from "@/components/intelligence/IntelligenceCameraFocus";
import { eventToFocusPosition } from "@/domain/intelligence/eventFocus";
import { computeSignalIntensity } from "@/components/terrain/signals/signalStyle";
import { POSITION_PRESET } from "@/scene/camera/terrainCameraPresets";

// Canonical camera target — from terrainCameraPresets single source of truth
const TERRAIN_LOOK_AT: [number, number, number] = POSITION_PRESET.target;

function readCssVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

type TerrainStageProps = {
  granularity?: TimeGranularity
  terrainMetrics?: TerrainMetrics
  /** When true, no OrbitControls are mounted — camera is fully programmatic. */
  lockCamera?: boolean
  /**
   * Optional per-mount override for path visibility.
   * If undefined, uses renderFlagsStore.showPaths (default behaviour).
   */
  pathsEnabled?: boolean
  signals?: Array<{
    key: string
    label: string
    tone: "strong" | "watch" | "risk"
    detail: string
    metricLine: string
  }>
  /** Override events for TerrainSignalsLayer — used by Compare mode */
  overrideEvents?: import("@/domain/events/terrainEventTypes").TerrainEvent[]
  /** Primary event to highlight with a terrain glow (A10.1) */
  focusedEvent?: import("@/domain/events/terrainEventTypes").TerrainEvent | null
  /** Color variant for terrain surface (default | green | frost) */
  colorVariant?: TerrainColorVariant
  /** Enable red→green heatmap overlay on terrain */
  heatmapEnabled?: boolean
  /** Azimuth (horizontal orbit) limits in radians. Defaults: unconstrained. */
  minAzimuthAngle?: number
  maxAzimuthAngle?: number
  /** Polar (vertical orbit) limits in radians. Default: 0.758 – 1.456. */
  minPolarAngle?: number
  maxPolarAngle?: number
  /** Mouse-drag orbit speed multiplier. Default: 0.8. */
  rotateSpeed?: number
  children?: ReactNode
}

export default function TerrainStage({
  granularity,
  terrainMetrics,
  lockCamera = false,
  pathsEnabled,
  signals,
  overrideEvents,
  focusedEvent,
  colorVariant,
  heatmapEnabled = false,
  minAzimuthAngle = -Infinity,
  maxAzimuthAngle = Infinity,
  minPolarAngle: minPolar = 0.758,
  maxPolarAngle: maxPolar = 1.456,
  rotateSpeed = 0.8,
  children,
}: TerrainStageProps) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [terrainReady, setTerrainReady] = useState(false);
  const { baseline } = useSystemBaseline();
  const rebuildKey = baselineSeedString(baseline as any);
  const setControls = useTerrainControls((s) => s.setControls);

  // Register / unregister OrbitControls in the terrain controls store
  const onControlsRef = useCallback((instance: OrbitControlsImpl | null) => {
    (controlsRef as React.MutableRefObject<OrbitControlsImpl | null>).current = instance;
    setControls(instance);
  }, [setControls]);

  const [fogColor, setFogColor] = useState("#020814");
  useEffect(() => {
    // Use the global "charcoal" void token when available.
    setFogColor(readCssVar("--color-bg-void", readCssVar("--navy-950", "#020814")));
  }, []);

  // ── Render flags ──
  const { showMarkers } = useRenderFlagsStore();

  // ── Overlay visibility (canonical) — URL overrides take priority ──
  const vis = useOverlayVisibility();
  // If pathsEnabled prop is explicitly set (and no URL override), respect it.
  // overlayVisibility already handles ?overlays= and ?debugHud= force.
  const pathsOn = typeof pathsEnabled === "boolean" ? (vis.pathsOn || pathsEnabled) : vis.pathsOn;
  const timelineOn = typeof pathsEnabled === "boolean" ? (vis.timelineOn || pathsEnabled) : vis.timelineOn;
  const liquidityOn = vis.liquidityOn;

  // ── Publish debug signals (zero-cost when debugHud is off) ──
  const { debugHud } = useDebugFlags();
  const setDebugTerrainReady = useDebugSignals((s) => s.setTerrainReady);
  const setDebugPathsOn = useDebugSignals((s) => s.setPathsOn);
  const setOverlayFlags = useDebugSignals((s) => s.setOverlayFlags);
  useEffect(() => {
    if (debugHud) {
      setDebugTerrainReady(terrainReady);
      setDebugPathsOn(pathsOn);
      setOverlayFlags({ timelineOn, liquidityOn, eventsOn: vis.eventsOn });
    }
  }, [debugHud, terrainReady, pathsOn, timelineOn, liquidityOn, vis.eventsOn, setDebugTerrainReady, setDebugPathsOn, setOverlayFlags]);

  useEffect(() => {
    if (terrainReady) return;
    let cancelled = false;
    let raf: number;
    function check() {
      if (cancelled) return;
      if (terrainRef.current) {
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
      camera={{ position: POSITION_PRESET.pos as unknown as [number, number, number], fov: POSITION_PRESET.fov, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera, gl }) => {
        // Only set defaults when not locked — locked pages inject a CameraCompositionRig.
        if (!lockCamera) {
          camera.position.set(...POSITION_PRESET.pos);
          camera.lookAt(...TERRAIN_LOOK_AT);
          camera.updateProjectionMatrix();
        }

        // Transparent clear — Position page supplies charcoal gradient behind Canvas.
        gl.setClearColor(fogColor, 0);

        // Tone mapping — default
        gl.toneMappingExposure = 1.0;
      }}
    >
      {/* OrbitControls — always mounted so TerrainNavWidget can steer programmatically.
           When lockCamera is true, all user input (mouse drag/scroll) is disabled. */}
      <OrbitControls
        ref={onControlsRef}
        makeDefault
        enableRotate={!lockCamera}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.12}
        minPolarAngle={minPolar}
        maxPolarAngle={maxPolar}
        minAzimuthAngle={minAzimuthAngle}
        maxAzimuthAngle={maxAzimuthAngle}
        rotateSpeed={rotateSpeed}
        minDistance={220}
        maxDistance={700}
        target={TERRAIN_LOOK_AT}
      />

      {/* Fog stays deterministic; background comes from DOM gradient behind the canvas. */}
      <fog attach="fog" args={[fogColor, 420, 2400]} />

      {/* ═══════════════════════════════════════════════════════════════
          DEFAULT LIGHTING — SHADOW-CONTRAST TUNED
          ───────────────────────────────────────────────────────────
          Ambient:    0.35  (reduced to reveal ridge shadows)
          Key:        1.40  pos [120,180,120]  color #DFFAEE
          Rim:        0.55  pos [-80,120,-60]  color #6ef0ff
          Fog:        #020814  near 420  far 2400
          Exposure:   1.0
          ───────────────────────────────────────────────────────────
          DO NOT MODIFY without explicit user approval.
          DO NOT touch terrainMaterials.ts when adjusting these.
          ═══════════════════════════════════════════════════════════ */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[120, 180, 120]} intensity={1.40} color="#DFFAEE" />
      <directionalLight position={[-80, 120, -60]} intensity={0.55} color="#6ef0ff" />

      <HorizonBand />

      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} terrainMetrics={terrainMetrics} colorVariant={colorVariant} />
        <TerrainHeatmapLayer enabled={heatmapEnabled} terrainMetrics={terrainMetrics} />
        {terrainReady && (
          <>
            {/* A12: Always mount P50Path — emphasis via visible prop, never unmount */}
            <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} visible={pathsOn} />
            {/* Canonical ticks (BaselineTimelineTicks) — follows timelineOn */}
            <BaselineTimelineTicks visible={timelineOn} terrainRef={terrainRef} />
            <LiquidityFlowLayer terrainRef={terrainRef} enabled={liquidityOn} />
            <TerrainSignalsLayer terrainRef={terrainRef} overrideEvents={overrideEvents} />
            {showMarkers && <StrategicMarkers terrainRef={terrainRef} />}
            {/* A10.1 — Focus glow for primary intelligence event */}
            {focusedEvent && (
              <TerrainFocusGlow
                position={(() => {
                  const p = eventToFocusPosition(focusedEvent)
                  const terrain = terrainRef.current
                  const y = terrain ? terrain.getHeightAt(p.x, p.z) + 1.0 : p.y + 1.0
                  return { x: p.x, y, z: p.z }
                })()}
                intensity={computeSignalIntensity(focusedEvent.severity, focusedEvent.probabilityImpact)}
                isActive={true}
              />
            )}
            {/* Intelligence Targeting System — laser, pulse, label, spotlight, camera */}
            <TerrainLaserTarget terrainRef={terrainRef} />
            <TerrainTargetPulse terrainRef={terrainRef} />
            <TerrainTargetLabel terrainRef={terrainRef} />
            <TerrainTargetSpotlight terrainRef={terrainRef} />
            <IntelligenceCameraFocus terrainRef={terrainRef} />
          </>
        )}
      </Suspense>

      {children}
    </Canvas>
  );
}
