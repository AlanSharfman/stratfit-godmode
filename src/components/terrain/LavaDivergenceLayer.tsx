import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * STRATFIT — Lava Divergence Layer (V2)
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
 * - Presentational only. No store reads. No store writes.
 *
 * REQUIRED:
 * - Replace the sampler import below to match your codebase.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TODO: SET THIS IMPORT TO YOUR TERRAIN HEIGHT SAMPLER
// Examples you already use elsewhere:
//   import { sampleTerrainHeight } from "@/terrain/buildTerrain";
//   import { getHeightAt } from "@/terrain/buildTerrain";
// ─────────────────────────────────────────────────────────────────────────────
// Using getTerrainHeight (wraps sampleTerrainHeight with BASELINE_SEED + STM)
import { getTerrainHeight } from "@/terrain/terrainHeightSampler";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function LavaDivergenceLayer(props: {
  intensity: number; // 0..1
  // spatial config
  size?: number;       // world units (plane width/height)
  segments?: number;   // grid resolution
  yOffset?: number;    // height offset above terrain
}) {
  const intensity = clamp01(props.intensity);
  const size = props.size ?? 140;
  const segments = props.segments ?? 90;
  const yOffset = props.yOffset ?? 0.08;

  const meshRef = useRef<THREE.Mesh>(null);
  const geomRef = useRef<THREE.PlaneGeometry | null>(null);

  const material = useMemo(() => {
    // Deterministic material mapping from intensity only.
    // Keep conservative so it reads "pressure" not "arcade lava".
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.70, 0.05, 0.03),
      emissive: new THREE.Color(1.0, 0.12, 0.03),
      emissiveIntensity: 0.20 + intensity * 1.85,
      transparent: true,
      opacity: 0.015 + intensity * 0.26,
      roughness: 0.50,
      metalness: 0.0,
      depthWrite: false,
    });
  }, [intensity]);

  // Build the geometry once (mount), then set vertex heights from terrain.
  // NOTE: we do NOT rebuild per render; we mutate vertex buffer once in effect.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Create a plane centered at origin, rotated flat on XZ.
    // We will sample height at each vertex world (x,z).
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);

      // v.x and v.z are in world-space for this mesh (centered at 0,0).
      // Sample terrain height deterministically.
      const h = getTerrainHeight(v.x, v.z);

      // Lift the lava slightly above terrain to avoid z-fighting.
      pos.setY(i, h + yOffset);
    }

    pos.needsUpdate = true;
    geom.computeVertexNormals();

    // Attach geometry
    mesh.geometry.dispose?.();
    mesh.geometry = geom;
    geomRef.current = geom;

    return () => {
      // Cleanup
      if (geomRef.current) {
        geomRef.current.dispose();
        geomRef.current = null;
      }
    };
    // size/segments/yOffset define geometry; change => rebuild.
  }, [size, segments, yOffset]);

  return (
    <mesh ref={meshRef} material={material} frustumCulled={false}>
      {/* geometry injected in useEffect */}
    </mesh>
  );
}
