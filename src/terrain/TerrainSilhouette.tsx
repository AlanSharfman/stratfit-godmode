// src/terrain/TerrainSilhouette.tsx
// STRATFIT — Distant mountain silhouettes for scene depth.
// Three dark profiles positioned far behind the terrain give the landscape
// layered depth without any rock-texture or game-like styling.
// Depth-fogged automatically by the scene's fogExp2 uniform.

import { useMemo } from "react"
import * as THREE from "three"

function makeSilhouetteGeo(pts: [number, number][]): THREE.ShapeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
  shape.closePath()
  return new THREE.ShapeGeometry(shape, 1)
}

export default function TerrainSilhouette() {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x08111c,
        transparent: true,
        opacity: 0.50,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    [],
  )

  // Far-left peak range — dominant silhouette
  const geoA = useMemo(
    () =>
      makeSilhouetteGeo([
        [-290, -20],
        [-220, 48],
        [-155, 82],
        [-80, 108],
        [-10, 90],
        [60, 115],
        [140, 88],
        [200, 58],
        [270, 20],
        [290, -20],
      ]),
    [],
  )

  // Centre-right — slightly closer, medium scale
  const geoB = useMemo(
    () =>
      makeSilhouetteGeo([
        [-200, -20],
        [-140, 35],
        [-70, 62],
        [20, 78],
        [95, 60],
        [160, 38],
        [200, -20],
      ]),
    [],
  )

  // Far-right — smallest, most distant feel
  const geoC = useMemo(
    () =>
      makeSilhouetteGeo([
        [-110, -20],
        [-60, 22],
        [5, 42],
        [70, 38],
        [115, 18],
        [110, -20],
      ]),
    [],
  )

  return (
    <>
      {/* Primary far range — behind main terrain */}
      <mesh geometry={geoA} material={mat} position={[0, -30, -680]} />
      {/* Secondary range — offset right, slightly further */}
      <mesh geometry={geoB} material={mat} position={[60, -22, -790]} />
      {/* Tertiary — far-left, deepest layer */}
      <mesh geometry={geoC} material={mat} position={[-140, -18, -900]} />
    </>
  )
}
