import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

interface Props {
  intensity: number
}

const FISSURE_COUNT = 6
const CRACK_BASE_WIDTH = 1.8
const PULSE_SPEED = 0.7
const GLOW_SPRITE_SCALE: [number, number, number] = [8, 4, 1]

/** Generate a jagged crack path across the terrain surface. */
function buildCrackPath(): THREE.Vector3[] {
  const hw = TERRAIN_CONSTANTS.width * 0.5
  const hd = TERRAIN_CONSTANTS.depth * 0.35
  const segs = 5 + Math.floor(Math.random() * 4)
  const points: THREE.Vector3[] = []
  let x = (Math.random() - 0.5) * hw * 2
  let z = (Math.random() - 0.5) * hd * 2
  for (let i = 0; i <= segs; i++) {
    points.push(new THREE.Vector3(x, -3 + Math.random() * 6, z))
    x += (Math.random() - 0.3) * 28
    z += (Math.random() - 0.5) * 18
  }
  return points
}

/** Build a triangle-strip ribbon along `path` with the given `width`. */
function buildStripGeometry(path: THREE.Vector3[], width: number): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  for (let i = 0; i < path.length; i++) {
    const p = path[i]
    let dx: number, dz: number
    if (i < path.length - 1) {
      dx = path[i + 1].x - p.x
      dz = path[i + 1].z - p.z
    } else {
      dx = p.x - path[i - 1].x
      dz = p.z - path[i - 1].z
    }
    const len = Math.sqrt(dx * dx + dz * dz) || 1
    const nx = (-dz / len) * width * 0.5
    const nz = (dx / len) * width * 0.5

    positions.push(p.x + nx, p.y, p.z + nz)
    positions.push(p.x - nx, p.y, p.z - nz)

    if (i > 0) {
      const b = (i - 1) * 2
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

interface FissureDef {
  geometry: THREE.BufferGeometry
  glowPoints: THREE.Vector3[]
}

const LavaFissureLayer: React.FC<Props> = memo(({ intensity }) => {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const fissures = useMemo<FissureDef[]>(
    () =>
      Array.from({ length: FISSURE_COUNT }, () => {
        const path = buildCrackPath()
        return {
          geometry: buildStripGeometry(path, CRACK_BASE_WIDTH + Math.random() * 1.5),
          glowPoints: path.filter((_, i) => i % 2 === 0),
        }
      }),
    [],
  )

  useFrame((_, dt) => {
    if (!groupRef.current || intensity <= 0) return
    timeRef.current += dt
    const t = timeRef.current
    let idx = 0

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial
        const pulse = 0.4 + 0.6 * Math.sin(t * PULSE_SPEED + idx * 2.1) ** 2
        mat.opacity = intensity * pulse * 0.7
        mat.color.setRGB(1, 0.3 + 0.4 * pulse, 0.05)
        idx++
      } else if (child instanceof THREE.Sprite) {
        const mat = child.material as THREE.SpriteMaterial
        const pulse = 0.3 + 0.7 * Math.sin(t * 0.5 + idx * 1.3) ** 2
        mat.opacity = intensity * pulse * 0.25
        idx++
      }
    })
  })

  if (intensity <= 0) return null

  return (
    <group ref={groupRef} name="lava-fissures">
      {fissures.map((f, i) => (
        <React.Fragment key={i}>
          <mesh geometry={f.geometry}>
            <meshBasicMaterial
              color="#ff4400"
              transparent
              opacity={intensity * 0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          {f.glowPoints.map((gp, j) => (
            <sprite
              key={j}
              position={[gp.x, gp.y + 2, gp.z]}
              scale={GLOW_SPRITE_SCALE}
            >
              <spriteMaterial
                color="#ff6600"
                transparent
                opacity={intensity * 0.2}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </sprite>
          ))}
        </React.Fragment>
      ))}
    </group>
  )
})

LavaFissureLayer.displayName = "LavaFissureLayer"
export default LavaFissureLayer
