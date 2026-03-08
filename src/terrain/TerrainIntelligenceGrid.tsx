// src/terrain/TerrainIntelligenceGrid.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Analytical Intelligence Grid Overlay
//
// Renders a sparse structural grid that conforms to the terrain surface.
// Replaces the dense triangle wireframe with clean row/column lines that
// communicate analytical structure without dominating the scene.
//
// Visual intent:
//   • Thin cyan/ice-blue lines at ~10-unit grid intervals
//   • Low opacity — presence without noise
//   • No diagonal lines — pure row/column grid
//   • Conforms exactly to terrain height (no z-fighting)
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useEffect } from "react"
import * as THREE from "three"
import { TERRAIN_CONSTANTS, TERRAIN_WORLD_SCALE } from "@/terrain/terrainConstants"
import { SEGMENTS } from "@/terrain/terrainHeightfield"

// Grid spacing: every Nth vertex. At SEGMENTS=128, step=4 → 33 lines per axis.
// Denser than step=8 to restore STRATFIT structural intelligence character.
const GRID_STEP = 4

// Lift slightly above terrain surface to prevent z-fighting.
const GRID_LIFT = 0.5

interface Props {
  heightfield: Float32Array | null
}

export default function TerrainIntelligenceGrid({ heightfield }: Props) {
  const geometry = useMemo(() => {
    if (!heightfield) return null

    const { width, depth } = TERRAIN_CONSTANTS
    const vpr = SEGMENTS + 1
    const positions: number[] = []

    // Get local-space position of a terrain vertex (PlaneGeometry local coords).
    // x: -width/2 → +width/2,  y: +depth/2 → -depth/2,  z: heightfield + lift
    const vertex = (col: number, row: number): [number, number, number] => [
      (col / SEGMENTS) * width - width / 2,
      depth / 2 - (row / SEGMENTS) * depth,
      heightfield[row * vpr + col] + GRID_LIFT,
    ]

    // Row grid lines — constant row, varying column
    for (let row = 0; row <= SEGMENTS; row += GRID_STEP) {
      for (let col = 0; col < SEGMENTS; col++) {
        const [x0, y0, z0] = vertex(col, row)
        const [x1, y1, z1] = vertex(col + 1, row)
        positions.push(x0, y0, z0, x1, y1, z1)
      }
    }

    // Column grid lines — constant column, varying row
    for (let col = 0; col <= SEGMENTS; col += GRID_STEP) {
      for (let row = 0; row < SEGMENTS; row++) {
        const [x0, y0, z0] = vertex(col, row)
        const [x1, y1, z1] = vertex(col, row + 1)
        positions.push(x0, y0, z0, x1, y1, z1)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [heightfield])

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,   // sky-400 — sharper, more luminous than 22d3ee
        opacity: 0.22,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => () => { geometry?.dispose() }, [geometry])
  useEffect(() => () => { material.dispose() }, [material])

  if (!geometry) return null

  return (
    <lineSegments
      geometry={geometry}
      material={material}
      renderOrder={2}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, TERRAIN_CONSTANTS.yOffset, 0]}
      scale={[TERRAIN_WORLD_SCALE.x, TERRAIN_WORLD_SCALE.y, TERRAIN_WORLD_SCALE.z]}
      frustumCulled={false}
    />
  )
}
