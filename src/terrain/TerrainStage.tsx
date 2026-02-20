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
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import P50Path from "@/paths/P50Path";
import TimelineTicks, { type TimeGranularity } from "@/position/TimelineTicks";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { baselineSeedString } from "@/terrain/seed";
import MarkerLayer from "@/components/terrain/markers/MarkerLayer";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";
import HorizonBand from "@/components/position/HorizonBand";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";

type TerrainStageProps = {
  granularity?: TimeGranularity
}

export default function TerrainStage({ granularity }: TerrainStageProps) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const [terrainReady, setTerrainReady] = useState(false);
  const { baseline } = useSystemBaseline();
  const rebuildKey = baselineSeedString(baseline as any);
  const horizonMonths = (baseline as any)?.posture?.horizonMonths ?? 36;

  // ── Render flags ──
  const { showMarkers, showFlow, showPaths } = useRenderFlagsStore();
  // TODO: wire showGrid → TerrainSurface grid prop when available
  // TODO: wire showRiskField → RiskFieldLayer when implemented
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
      shadows
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      dpr={[1, 2]}
      camera={{ position: [0, 320, 550], fov: 40, near: 1, far: 5000 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ camera, gl, scene }) => {
        camera.position.set(0, 320, 550);
        camera.lookAt(0, -20, 0);
        camera.updateProjectionMatrix();

        gl.setClearColor("#02050A", 1);
        scene.fog = new THREE.Fog("#02050A", 300, 1200);
      }}
    >
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minAzimuthAngle={-Math.PI / 5}
        maxAzimuthAngle={ Math.PI / 5}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.8}
        rotateSpeed={0.55}
        target={[0, -20, 0]}
      />

      <color attach="background" args={["#02050A"]} />
      <fog attach="fog" args={["#02050A", 300, 1200]} />

      {/* 3-Point Cinematic Lighting Rig */}
      <ambientLight intensity={0.02} />

      {/* KEY: Harsh raking side-light with deep shadow maps */}
      <directionalLight
        position={[-500, 250, 200]}
        intensity={4.0}
        color="#E0F2FE"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-600}
        shadow-camera-right={600}
        shadow-camera-top={600}
        shadow-camera-bottom={-600}
        shadow-camera-near={1}
        shadow-camera-far={2000}
        shadow-bias={-0.0001}
      />

      {/* RIM: Stable directional backlight — no cone flicker */}
      <directionalLight
        position={[0, 80, -500]}
        intensity={1.5}
        color="#0A4060"
      />

      <HorizonBand />

      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} />
        {terrainReady && (
          <>
            {showPaths && (
              <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} />
            )}
            <TimelineTicks terrainRef={terrainRef} granularity={granularity} horizonMonths={horizonMonths} rebuildKey={rebuildKey} />
            <LiquidityFlowLayer terrainRef={terrainRef} enabled={showFlow} />
            <MarkerLayer terrainRef={terrainRef} enabled={showMarkers} />
          </>
        )}
      </Suspense>

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={1.2} mipmapBlur intensity={2.0} />
      </EffectComposer>
    </Canvas>
  );
}
