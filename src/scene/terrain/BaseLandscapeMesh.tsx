// scene/terrain/BaseLandscapeMesh.tsx
// STRATFIT — Static Procedural Landscape Mesh
//
// Renders the environmental terrain generated purely from noise.
// This mesh is STATIC after initialization — no animation, no business data.
// It provides the base elevation that the strategic mountain sits on top of.

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import { buildLandscapeHeightfield } from "@/engine/terrain/generateLandscapeHeight"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

const SEGMENTS = 200

export type BaseLandscapeHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  mesh: THREE.Mesh | null
  heightfield: Float32Array
}

interface Props {
  seed: number
}

const BaseLandscapeMesh = forwardRef<BaseLandscapeHandle, Props>(
  function BaseLandscapeMesh({ seed }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)
    const showGrid = useRenderFlagsStore((s) => s.showGrid)

    const heightfield = useMemo(
      () => buildLandscapeHeightfield(seed, SEGMENTS),
      [seed],
    )

    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, heightfield[i])
      }
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      return geo
    }, [heightfield])

    const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
    const wireMat = useMemo(() => createTerrainWireMaterial(), [])

    const getHeightAt = useMemo(() => {
      const vpr = SEGMENTS + 1
      const halfW = TERRAIN_CONSTANTS.width / 2
      const halfD = TERRAIN_CONSTANTS.depth / 2
      const cellW = TERRAIN_CONSTANTS.width / SEGMENTS
      const cellD = TERRAIN_CONSTANTS.depth / SEGMENTS

      return (worldX: number, worldZ: number): number => {
        const col = (worldX + halfW) / cellW
        const row = (worldZ + halfD) / cellD
        const c = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(col)))
        const r = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(row)))
        const fx = col - c
        const fz = row - r

        const i00 = r * vpr + c
        const i10 = i00 + 1
        const i01 = i00 + vpr
        const i11 = i01 + 1

        const h00 = heightfield[i00] ?? 0
        const h10 = heightfield[i10] ?? 0
        const h01 = heightfield[i01] ?? 0
        const h11 = heightfield[i11] ?? 0

        return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) +
               h01 * (1 - fx) * fz + h11 * fx * fz
      }
    }, [heightfield])

    useImperativeHandle(ref, () => ({
      getHeightAt,
      seed,
      mesh: solidRef.current,
      heightfield,
    }), [getHeightAt, seed, heightfield])

    return (
      <group name="base-landscape" rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRAIN_CONSTANTS.yOffset, 0]}>
        <mesh
          ref={solidRef}
          geometry={geometry}
          material={solidMat}
          frustumCulled={false}
          renderOrder={1}
        />
        {showGrid && (
          <mesh
            ref={latticeRef}
            geometry={geometry}
            material={wireMat}
            frustumCulled={false}
            renderOrder={2}
          />
        )}
      </group>
    )
  },
)

export default BaseLandscapeMesh
