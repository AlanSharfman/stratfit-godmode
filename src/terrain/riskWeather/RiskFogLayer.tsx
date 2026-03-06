import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

interface Props {
  density: number
}

const SPRITE_COUNT = 36
const Y_BAND: [number, number] = [-4, 25]
const DRIFT_X = 0.015
const DRIFT_Z = 0.012
const BOB_SPEED = 0.08

interface FogParticleDef {
  x: number; y: number; z: number
  sx: number; sy: number
  phase: number
  baseOpacity: number
}

const RiskFogLayer: React.FC<Props> = memo(({ density }) => {
  const groupRef = useRef<THREE.Group>(null)
  const clockRef = useRef(0)

  const particles = useMemo<FogParticleDef[]>(() => {
    const hw = TERRAIN_CONSTANTS.width * 1.6
    const hd = TERRAIN_CONSTANTS.depth * 1.2
    const edgeFrac = 0.6

    return Array.from({ length: SPRITE_COUNT }, (_, i) => {
      const isEdge = i < SPRITE_COUNT * edgeFrac
      const x = isEdge
        ? (Math.random() > 0.5 ? 1 : -1) * (hw * 0.6 + Math.random() * hw * 0.4)
        : (Math.random() - 0.5) * hw * 1.4
      const z = isEdge
        ? (Math.random() - 0.5) * hd * 2
        : (Math.random() > 0.5 ? 1 : -1) * (hd * 0.6 + Math.random() * hd * 0.4)
      const y = Y_BAND[0] + Math.random() * (Y_BAND[1] - Y_BAND[0])

      return {
        x, y, z,
        sx: 60 + Math.random() * 80,
        sy: 20 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
        baseOpacity: 0.03 + Math.random() * 0.06,
      }
    })
  }, [])

  useFrame((_, dt) => {
    if (!groupRef.current || density <= 0) return
    clockRef.current += dt
    const t = clockRef.current

    groupRef.current.children.forEach((child, i) => {
      if (!(child instanceof THREE.Sprite)) return
      const p = particles[i]
      child.position.x = p.x + Math.sin(t * DRIFT_X + p.phase) * 12
      child.position.y = p.y + Math.sin(t * BOB_SPEED + p.phase * 1.5) * 2.5
      child.position.z = p.z + Math.cos(t * DRIFT_Z + p.phase) * 8
      ;(child.material as THREE.SpriteMaterial).opacity = p.baseOpacity * density
    })
  })

  if (density <= 0) return null

  return (
    <group ref={groupRef} name="risk-fog">
      {particles.map((p, i) => (
        <sprite key={i} position={[p.x, p.y, p.z]} scale={[p.sx, p.sy, 1]}>
          <spriteMaterial
            color="#6b7b8d"
            transparent
            opacity={p.baseOpacity * density}
            depthWrite={false}
            toneMapped={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
})

RiskFogLayer.displayName = "RiskFogLayer"
export default RiskFogLayer
