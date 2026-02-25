// src/terrain/TerrainStage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Position Stage (REALITY VISUALIZATION)
// Navigation Contract: src/contracts/navigationContract.ts
//
// ROLE: Single Canvas host for terrain, P50 trajectory, markers, timeline,
//       and liquidity particles (when enabled).
// READS: Initiate snapshot ONLY (via SystemBaselineProvider). (Rule 1)
// RULES:
//   - No Objectives dependency — terrain shape is Initiate-derived only.
//   - No simulation logic (Rule 3).
//   - No baseline writes (Rule 4).
//   - Water/liquidity particles are a Position layer (Rule 6).
// ═══════════════════════════════════════════════════════════════════════════
// Phase 2/1: camera + far-plane + fog stabilization (deterministic)
// Phase 2.2: granularity prop wired from PositionPage toggle

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import P50Path from "@/paths/P50Path";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import BaselineTimelineTicks from "@/terrain/BaselineTimelineTicks";
import type { TimeGranularity } from "@/terrain/TimelineTicks";
import { baselineSeedString } from "@/terrain/seed";
import MarkerLayer from "@/components/terrain/markers/MarkerLayer";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";
import HorizonBand from "@/terrain/HorizonBand";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";
import DemoTourDirector from "@/demo/DemoTourDirector";

type TerrainStageProps = {
  granularity?: TimeGranularity
  terrainMetrics?: TerrainMetrics
}

export default function TerrainStage({ granularity, terrainMetrics }: TerrainStageProps) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const [terrainReady, setTerrainReady] = useState(false);
  const { baseline } = useSystemBaseline();
  const rebuildKey = baselineSeedString(baseline as any);

  // ── Render flags ──
  const { showMarkers, showFlow, showPaths, watchDemo } = useRenderFlagsStore();
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
      camera={{ position: [0, 143, 286], fov: 42, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ camera, gl, scene }) => {
        // Deterministic camera lock (prevents "close-up blob / drift")
        camera.position.set(0, 143, 286);
        camera.lookAt(0, -70, 0);
        camera.updateProjectionMatrix();

        // Deterministic clear + fog baseline
        gl.setClearColor("#050A10", 1);
        scene.fog = new THREE.Fog("#050A10", 320, 2200);
      }}
    >
      {/* Orbit controls ONLY when not watching demo */}
      {!watchDemo && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={1.107}
          maxPolarAngle={1.107}
          rotateSpeed={0.55}
          target={[0, -70, 0]}
        />
      )}

      {/* Demo Tour Director (camera + overlay) mounts INSIDE Canvas */}
      {watchDemo && terrainReady && (
        <DemoTourDirector enabled terrainRef={terrainRef} />
      )}

      {/* Deterministic background + fog (redundant by design; guards against overrides) */}
      <color attach="background" args={["#050A10"]} />
      <fog attach="fog" args={["#050A10", 320, 2200]} />

      {/* Lights: slightly lifted for marker + tick readability */}
      <ambientLight intensity={1.10} />
      <directionalLight position={[120, 180, 120]} intensity={1.60} color="#CFEFFF" />
      <directionalLight position={[-80, 120, -60]} intensity={0.55} color="#5ee7ff" />

      <HorizonBand />

      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} terrainMetrics={terrainMetrics} />
        {terrainReady && (
          <>
            {showPaths && (
              <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} />
            )}
            {/* Canonical ticks (BaselineTimelineTicks) — terrainRef for surface-aligned Y */}
            <BaselineTimelineTicks visible terrainRef={terrainRef} />
            <LiquidityFlowLayer terrainRef={terrainRef} enabled={showFlow} />
            <MarkerLayer terrainRef={terrainRef} enabled={showMarkers} />
          </>
        )}
      </Suspense>
    </Canvas>
  );
}
