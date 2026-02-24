import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGodModeStore } from "@/core/store/useGodModeStore";
import { useEngineActivityStore } from "@/state/engineActivityStore";
// Using getTerrainHeight (wraps sampleTerrainHeight with BASELINE_SEED + STM)
import { getTerrainHeight } from "@/terrain/terrainHeightSampler";

/**
 * STRATFIT — Lava Divergence Layer (V3)
 * Terrain-conforming emissive "melt skin" driven by divergence pressure.
 *
 * Determinism:
 * - Geometry is derived ONLY from terrain sampler.
 * - No randomness. No time-based noise.
 *
 * Performance:
 * - Coarse grid mesh (default 90x90). Adjust if needed.
 *
 * Safety:
 * - Presentational only. No store writes.
 * - Respects GodMode showPressure toggle.
 */

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function stagePulseAmp(stage: string) {
  switch (stage) {
    case "SAMPLING":     return 0.55;
    case "AGGREGATING":  return 0.40;
    case "CONVERGING":   return 0.45;
    default:             return 0.0;
  }
}

export default function LavaDivergenceLayer(props: {
  intensity: number; // 0..1
  size?: number;
  segments?: number;
  yOffset?: number;
}) {
  const enabled = useGodModeStore((s) => s.enabled && s.showPressure);
  const engineIsRunning = useEngineActivityStore((s) => s.isRunning);
  const engineStage = useEngineActivityStore((s) => s.stage);

  const intensity = clamp01(props.intensity);
  const size = props.size ?? 160;
  const segments = props.segments ?? 90;
  const yOffset = props.yOffset ?? 0.08;

  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry | null>(null);

  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.70, 0.05, 0.03),
      emissive: new THREE.Color(1.0, 0.12, 0.03),
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.02,
      roughness: 0.55,
      metalness: 0.0,
      depthWrite: false,
    });
    return m;
  }, []);

  // Build conforming geometry once (or when size/segments/yOffset changes).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const h = getTerrainHeight(v.x, v.z);
      pos.setY(i, h + yOffset);
    }

    pos.needsUpdate = true;
    geom.computeVertexNormals();

    mesh.geometry.dispose?.();
    mesh.geometry = geom;
    geomRef.current = geom;

    return () => {
      if (geomRef.current) {
        geomRef.current.dispose();
        geomRef.current = null;
      }
    };
  }, [size, segments, yOffset]);

  // Drive material from intensity + engine pulse (no store writes)
  useFrame(({ clock }) => {
    if (!enabled) return;

    const baseOpacity = 0.01 + intensity * 0.28;
    const baseEmissive = 0.18 + intensity * 1.95;

    let pulse = 0;
    if (engineIsRunning) {
      const amp = stagePulseAmp(engineStage);
      const t = clock.getElapsedTime();
      const wave = (Math.sin(t * 4.2) + 1) * 0.5; // 0..1
      pulse = amp * 0.35 * wave;
    }

    mat.opacity = clamp01(baseOpacity + pulse * 0.06);
    mat.emissiveIntensity = clamp01(baseEmissive + pulse * 0.55);
  });

  if (!enabled) return null;
  if (intensity <= 0.001) return null;

  return <mesh ref={meshRef} material={mat} frustumCulled={false} />;
}
