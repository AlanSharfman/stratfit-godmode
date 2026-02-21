// src/terrain/TerrainStage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Position Stage (HYPER-PREMIUM TERRAIN VISUALIZATION)
// Single Canvas host: terrain, trajectory, markers, background mountains,
// bloom post-processing, cinematic camera, volumetric depth fog.
// ═══════════════════════════════════════════════════════════════════════════

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AdaptiveDpr } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import BackgroundMountains from "@/terrain/BackgroundMountains";
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
      dpr={[1, 1.5]}
      camera={{
        position: [0, 280, 520],
        fov: 30,
        near: 0.1,
        far: 6000,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      shadows
      onCreated={({ camera, gl, scene }) => {
        // Sovereign Overlook — wide-angle cinematic God view
        camera.position.set(0, 280, 520);
        camera.lookAt(0, -15, -60);
        camera.updateProjectionMatrix();

        // Deep abyss background
        gl.setClearColor("#050A10", 1);

        // Volumetric depth fog — gentle for panoramic landscape
        scene.fog = new THREE.FogExp2("#050A10", 0.0006);
      }}
    >
      <AdaptiveDpr pixelated />

      {/* Sovereign orbit — slow Hero Ease auto-rotation for cinematic breathing */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.06}
        minPolarAngle={0.80}
        maxPolarAngle={1.20}
        rotateSpeed={0.30}
        target={[0, -15, -60]}
      />

      {/* Deep abyss background */}
      <color attach="background" args={["#050A10"]} />

      {/* ── Premium Lighting Rig ── */}
      {/* Key light — cold blue-white from above-right */}
      <directionalLight
        position={[150, 220, 100]}
        intensity={1.2}
        color="#C8E6FF"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      {/* Fill light — subtle cool ambient */}
      <ambientLight intensity={0.35} color="#8BB8D0" />
      {/* Rim light — back-right for edge definition */}
      <directionalLight position={[-100, 80, -200]} intensity={0.5} color="#0077B6" />
      {/* Accent light — bottom-left subtle fill for depth */}
      <pointLight position={[-200, -20, 100]} intensity={0.3} color="#005A8C" distance={800} decay={2} />

      {/* Background mountain ranges — distant rolling peaks fading into fog */}
      <BackgroundMountains />

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

      {/* ── Post-processing: bloom for neon glow ── */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={1.5}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
