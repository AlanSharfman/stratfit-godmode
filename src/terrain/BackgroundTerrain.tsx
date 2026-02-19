// src/terrain/BackgroundTerrain.tsx
// STRATFIT — Cinematic background terrain silhouette.
// Low-poly, fog-affected, non-interactive.
// Positioned behind primary terrain to add depth.

import React, { useMemo } from "react"
import * as THREE from "three"
import { createSeed } from "./seed"
import { useEffect } from "react"

const SEED = createSeed("background")

function buildBackgroundGeometry() {
  const segments = 48
  const width = 900
  const depth = 600
  const geo = new THREE.PlaneGeometry(width, depth, segments, segments)
  const pos = geo.attributes.position as THREE.BufferAttribute

  const rand = (x: number, z: number) => {
    const v = Math.sin(x * 0.03 + SEED * 0.0007) * 3.2
      + Math.cos(z * 0.025 + SEED * 0.0005) * 2.8
      + Math.sin((x + z) * 0.018) * 3.6
    return v
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getY(i) // pre-rotation Y is world Z
    pos.setZ(i, rand(x, z))
  }

  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

export default function BackgroundTerrain() {
  const geometry = useMemo(() => buildBackgroundGeometry(), [])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -22, -180]}
      renderOrder={-1}
      frustumCulled={false}
      receiveShadow={false}
    >
      <meshStandardMaterial
        color={0x071018}
        emissive={0x040c14}
        emissiveIntensity={0.22}
        transparent
        opacity={0.52}
        roughness={1}
        metalness={0}
        depthWrite={false}
        depthTest
        fog
      />
    </mesh>
  )
}
