// src/components/compare/GhostTerrainSurface.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Ghost Terrain Surface (Compare Overlay)
//
// Lightweight R3F mesh that renders a translucent terrain surface inside
// an existing Canvas. Used by Ghost overlay mode to show secondary
// scenarios as tinted, transparent overlays on the primary terrain.
//
// DOES NOT create its own Canvas or OrbitControls.
// DOES NOT modify ScenarioMountainImpl, TerrainSurface, or terrainMaterials.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed"
import { buildTerrainWithMetrics } from "@/terrain/buildTerrain"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

export interface GhostTerrainSurfaceProps {
  terrainMetrics?: TerrainMetrics
  /** Ghost opacity: 0–1 */
  opacity: number
  /** Tint color as hex */
  tintColor: number
  /** Emissive tint as hex */
  emissiveColor: number
}

/**
 * Create a transparent terrain material with a tint.
 * Completely standalone — does NOT touch terrainMaterials.ts.
 */
function createGhostMaterial(
  tintColor: number,
  emissiveColor: number,
  opacity: number,
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: tintColor,
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: 0.35,
    transparent: true,
    opacity,
    roughness: 0.7,
    metalness: 0.08,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  })

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvHeight = position.z;",
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vHeight;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float _hao = clamp((vHeight + 8.0) / 200.0, 0.0, 1.0);
diffuseColor.rgb *= mix(0.6, 1.2, _hao);`,
      )
  }

  return mat
}

export default function GhostTerrainSurface({
  terrainMetrics,
  opacity,
  tintColor,
  emissiveColor,
}: GhostTerrainSurfaceProps) {
  const { baseline } = useSystemBaseline()
  const baselineAny = baseline as any

  const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
  const seed = useMemo(() => createSeed(seedStr), [seedStr])
  const relief = useMemo(() => baselineReliefScalar(baselineAny), [baselineAny])

  const geometry = useMemo(() => {
    return buildTerrainWithMetrics(260, seed, relief, terrainMetrics)
  }, [seed, relief, terrainMetrics])

  useEffect(() => {
    return () => { geometry.dispose() }
  }, [geometry])

  const material = useMemo(
    () => createGhostMaterial(tintColor, emissiveColor, opacity),
    [tintColor, emissiveColor, opacity],
  )

  useEffect(() => {
    return () => { material.dispose() }
  }, [material])

  return (
    <mesh
      geometry={geometry}
      renderOrder={5}
      name="ghost-terrain-surface"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -6, 0]}
      scale={[3.0, 2.8, 2.6]}
      frustumCulled={false}
    >
      <primitive object={material} attach="material" />
    </mesh>
  )
}
