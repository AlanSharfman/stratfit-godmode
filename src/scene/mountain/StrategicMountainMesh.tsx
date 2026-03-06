// scene/mountain/StrategicMountainMesh.tsx
// STRATFIT — Business-Driven Strategic Mountain
//
// This mesh sits centered on the landscape and is driven by business KPIs.
// It is smaller than the landscape (~60% width) and animates via lerp
// when scenarios change.
//
// Height = landscape base + mountain displacement (additive).

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { buildMountainHeightfield } from "@/engine/terrain/generateMountainHeight"
import { buildLandscapeHeightfield } from "@/engine/terrain/generateLandscapeHeight"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

const MOUNTAIN_SEGMENTS = 120
const MOUNTAIN_WIDTH_RATIO = 0.60
const LERP_SPEED = 2.5

export type StrategicMountainHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
}

interface Props {
  seed: number
  kpis: PositionKpis | null
  focusedKpi?: KpiKey | null
}

const StrategicMountainMesh = forwardRef<StrategicMountainHandle, Props>(
  function StrategicMountainMesh({ seed, kpis, focusedKpi }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)
    const showGrid = useRenderFlagsStore((s) => s.showGrid)
    const currentHeights = useRef<Float32Array | null>(null)

    const mountainWidth = TERRAIN_CONSTANTS.width * MOUNTAIN_WIDTH_RATIO
    const mountainDepth = TERRAIN_CONSTANTS.depth * MOUNTAIN_WIDTH_RATIO

    const mSegments = MOUNTAIN_SEGMENTS

    // Landscape base heights for the mountain footprint (to add on top)
    const landscapeBase = useMemo(() => {
      const vpr = mSegments + 1
      const count = vpr * vpr
      const fullLandscape = buildLandscapeHeightfield(seed, mSegments)
      const base = new Float32Array(count)

      for (let row = 0; row < vpr; row++) {
        for (let col = 0; col < vpr; col++) {
          const i = row * vpr + col
          base[i] = fullLandscape[i]
        }
      }
      return base
    }, [seed, mSegments])

    // Mountain overlay heights (business-driven)
    const mountainOverlay = useMemo(
      () => buildMountainHeightfield(kpis, seed, mSegments),
      [kpis, seed, mSegments],
    )

    // Combined target heights = landscape + mountain
    const targetHeights = useMemo(() => {
      const vpr = mSegments + 1
      const count = vpr * vpr
      const combined = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        combined[i] = landscapeBase[i] + mountainOverlay[i]
      }
      return combined
    }, [landscapeBase, mountainOverlay])

    // Initial geometry
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        mountainWidth,
        mountainDepth,
        mSegments,
        mSegments,
      )
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, targetHeights[i])
      }
      geo.computeVertexNormals()
      geo.computeBoundingSphere()

      currentHeights.current = new Float32Array(targetHeights)
      return geo
    }, [mountainWidth, mountainDepth, mSegments, targetHeights])

    const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
    const wireMat = useMemo(() => createTerrainWireMaterial(), [])

    // Animated lerp toward target when KPIs change
    useFrame((_, delta) => {
      if (!solidRef.current || !currentHeights.current) return

      const pos = geometry.attributes.position as THREE.BufferAttribute
      let changed = false
      const speed = LERP_SPEED * delta

      for (let i = 0; i < pos.count; i++) {
        const current = currentHeights.current[i]
        const target = targetHeights[i]
        const diff = target - current
        if (Math.abs(diff) > 0.01) {
          const newH = current + diff * Math.min(speed, 1)
          currentHeights.current[i] = newH
          pos.setZ(i, newH)
          changed = true
        }
      }

      if (changed) {
        pos.needsUpdate = true
        geometry.computeVertexNormals()
      }
    })

    // Height query for markers
    const getHeightAt = useMemo(() => {
      const vpr = mSegments + 1
      const halfW = mountainWidth / 2
      const halfD = mountainDepth / 2
      const cellW = mountainWidth / mSegments
      const cellD = mountainDepth / mSegments

      return (worldX: number, worldZ: number): number => {
        if (!currentHeights.current) return 0
        const col = (worldX + halfW) / cellW
        const row = (worldZ + halfD) / cellD
        const c = Math.max(0, Math.min(mSegments - 1, Math.floor(col)))
        const r = Math.max(0, Math.min(mSegments - 1, Math.floor(row)))
        const fx = col - c
        const fz = row - r

        const i00 = r * vpr + c
        const i10 = i00 + 1
        const i01 = i00 + vpr
        const i11 = i01 + 1

        const h00 = currentHeights.current[i00] ?? 0
        const h10 = currentHeights.current[i10] ?? 0
        const h01 = currentHeights.current[i01] ?? 0
        const h11 = currentHeights.current[i11] ?? 0

        return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) +
               h01 * (1 - fx) * fz + h11 * fx * fz
      }
    }, [mSegments, mountainWidth, mountainDepth])

    useImperativeHandle(ref, () => ({
      getHeightAt,
      seed,
    }), [getHeightAt, seed])

    return (
      <group name="strategic-mountain" rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRAIN_CONSTANTS.yOffset, 0]}>
        <mesh
          ref={solidRef}
          geometry={geometry}
          material={solidMat}
          frustumCulled={false}
          renderOrder={3}
        />
        {showGrid && (
          <mesh
            ref={latticeRef}
            geometry={geometry}
            material={wireMat}
            frustumCulled={false}
            renderOrder={4}
          />
        )}
      </group>
    )
  },
)

export default StrategicMountainMesh
