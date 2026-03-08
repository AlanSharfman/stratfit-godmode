import { useMemo, useRef, useEffect } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

const TREE_COUNT = 55
const MIN_HEIGHT = 3
const MAX_HEIGHT = 14
const MAX_SLOPE = 1.0
const TRUNK_RADIUS = 0.35
const TRUNK_HEIGHT = 1.4
const CANOPY_RADIUS = 1.2
const CANOPY_HEIGHT = 2.8

const SEGMENTS = TERRAIN_CONSTANTS.segments
const VPR = SEGMENTS + 1

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface TreePlacement {
  x: number
  z: number
  scale: number
}

function computePlacements(heightfield: Float32Array, seed: number): TreePlacement[] {
  const rand = mulberry32(seed + 77701)
  const placements: TreePlacement[] = []

  for (let attempt = 0; attempt < 800 && placements.length < TREE_COUNT; attempt++) {
    const col = Math.floor(rand() * (VPR - 2)) + 1
    const row = Math.floor(rand() * (VPR - 2)) + 1
    const i = row * VPR + col
    const h = heightfield[i]

    if (h < MIN_HEIGHT || h > MAX_HEIGHT) continue

    const slopeX = Math.abs(heightfield[i + 1] - heightfield[i - 1])
    const slopeZ = Math.abs(heightfield[i + VPR] - heightfield[i - VPR])
    if (slopeX + slopeZ > MAX_SLOPE) continue

    const tooClose = placements.some(p => {
      const dx = (col / SEGMENTS - 0.5) * TERRAIN_CONSTANTS.width - p.x / 3.0
      const dz = (row / SEGMENTS - 0.5) * TERRAIN_CONSTANTS.depth - p.z / -2.6
      return dx * dx + dz * dz < 100
    })
    if (tooClose) continue

    const geomX = (col / SEGMENTS - 0.5) * TERRAIN_CONSTANTS.width
    const geomY = (row / SEGMENTS - 0.5) * TERRAIN_CONSTANTS.depth
    const worldX = geomX * 3.0
    const worldZ = -geomY * 2.6

    const scale = 0.6 + rand() * 0.6
    placements.push({ x: worldX, z: worldZ, scale })
  }

  return placements
}

interface TerrainTreesProps {
  heightfield: Float32Array
  seed: number
  getHeightAt: (worldX: number, worldZ: number) => number
}

export default function TerrainTrees({ heightfield, seed, getHeightAt }: TerrainTreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)

  const placements = useMemo(() => computePlacements(heightfield, seed), [heightfield, seed])

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]
      const terrainY = getHeightAt(p.x, p.z)
      dummy.position.set(p.x, terrainY, p.z)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.y += TRUNK_HEIGHT * p.scale * 0.5
      dummy.updateMatrix()
      canopyRef.current.setMatrixAt(i, dummy.matrix)
    }
    trunkRef.current.instanceMatrix.needsUpdate = true
    canopyRef.current.instanceMatrix.needsUpdate = true
  }, [placements, getHeightAt])

  useFrame(() => {
    if (!trunkRef.current || !canopyRef.current) return
    const dummy = new THREE.Object3D()
    let changed = false
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i]
      const terrainY = getHeightAt(p.x, p.z)
      dummy.position.set(p.x, terrainY, p.z)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.y += TRUNK_HEIGHT * p.scale * 0.5
      dummy.updateMatrix()
      canopyRef.current.setMatrixAt(i, dummy.matrix)
      changed = true
    }
    if (changed) {
      trunkRef.current.instanceMatrix.needsUpdate = true
      canopyRef.current.instanceMatrix.needsUpdate = true
    }
  })

  if (placements.length === 0) return null

  return (
    <>
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, placements.length]}
        frustumCulled={false}
        renderOrder={2}
      >
        <cylinderGeometry args={[TRUNK_RADIUS * 0.5, TRUNK_RADIUS, TRUNK_HEIGHT, 5]} />
        <meshStandardMaterial
          color={0x0a2540}
          emissive={0x081e30}
          emissiveIntensity={0.3}
          roughness={0.85}
          metalness={0.05}
        />
      </instancedMesh>

      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, placements.length]}
        frustumCulled={false}
        renderOrder={2}
      >
        <coneGeometry args={[CANOPY_RADIUS, CANOPY_HEIGHT, 6]} />
        <meshStandardMaterial
          color={0x0c3050}
          emissive={0x0a2848}
          emissiveIntensity={0.35}
          roughness={0.7}
          metalness={0.08}
        />
      </instancedMesh>
    </>
  )
}
