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
import P50Path from "@/paths/P50Path";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import BaselineTimelineTicks from "@/terrain/BaselineTimelineTicks";
import type { TimeGranularity } from "@/terrain/TimelineTicks";
import { baselineSeedString } from "@/terrain/seed";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";
import HorizonBand from "@/terrain/HorizonBand";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import { useTerrainControls } from "@/terrain/useTerrainControls";

// Canonical camera target — must be consistent across all camera setups
const TERRAIN_LOOK_AT: [number, number, number] = [0, 14, 0];

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
  children?: ReactNode
}

export default function TerrainStage({
  granularity,
  terrainMetrics,
  lockCamera = false,
  pathsEnabled,
  signals,
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

  const [fogColor, setFogColor] = useState("#050A10");
  useEffect(() => {
    // Use the global "charcoal" void token when available.
    setFogColor(readCssVar("--color-bg-void", readCssVar("--navy-950", "#050A10")));
  }, []);

  // ── Render flags ──
  const { showMarkers, showFlow, showPaths } = useRenderFlagsStore();
  const pathsOn = typeof pathsEnabled === "boolean" ? pathsEnabled : showPaths;

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
      camera={{ position: [0, 155, 460], fov: 46, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera, gl }) => {
        // Only set defaults when not locked — locked pages inject a CameraCompositionRig.
        if (!lockCamera) {
          camera.position.set(0, 155, 460);
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
        minPolarAngle={0.758}
        maxPolarAngle={1.456}
        rotateSpeed={0.8}
        minDistance={220}
        maxDistance={700}
        target={TERRAIN_LOOK_AT}
      />

      {/* Fog stays deterministic; background comes from DOM gradient behind the canvas. */}
      <fog attach="fog" args={[fogColor, 420, 2400]} />

      {/* ═══════════════════════════════════════════════════════════════
          DEFAULT LIGHTING — LOCKED
          ─────────────────────────────────────────────────────────────
          Ambient:    1.55
          Key:        2.10  pos [120,180,120]  color #DFFAEE
          Fill:       0.85  pos [-80,120,-60]  color #6ef0ff
          Fog:        #050A10  near 420  far 2400
          Exposure:   1.0
          ─────────────────────────────────────────────────────────────
          DO NOT MODIFY without explicit user approval.
          DO NOT touch terrainMaterials.ts when adjusting these.
          ═══════════════════════════════════════════════════════════════ */}
      <ambientLight intensity={1.55} />
      <directionalLight position={[120, 180, 120]} intensity={2.10} color="#DFFAEE" />
      <directionalLight position={[-80, 120, -60]} intensity={0.85} color="#6ef0ff" />

      <HorizonBand />

      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} terrainMetrics={terrainMetrics} />
        {terrainReady && (
          <>
            {pathsOn && (
              <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} />
            )}
            {/* Canonical ticks (BaselineTimelineTicks) — only when paths are enabled */}
            {pathsOn && (
              <BaselineTimelineTicks visible terrainRef={terrainRef} />
            )}
            <LiquidityFlowLayer terrainRef={terrainRef} enabled={showFlow} />
          </>
        )}
      </Suspense>

      {children}
    </Canvas>
  );
}
