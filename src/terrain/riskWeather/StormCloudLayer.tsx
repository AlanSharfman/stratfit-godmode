import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

interface Props {
  intensity: number
}

const CLOUD_COUNT = 24
const Y_BASE = 85
const Y_SPREAD = 55
const DRIFT_SPEED = 0.025
const FLASH_DURATION = 0.12
const FLASH_COOLDOWN_MIN = 3.5

interface CloudDef {
  x: number; y: number; z: number
  sx: number; sy: number
  phase: number
  baseOpacity: number
}

const StormCloudLayer: React.FC<Props> = memo(({ intensity }) => {
  const groupRef = useRef<THREE.Group>(null)
  const clockRef = useRef(0)
  const flashRef = useRef({ timer: FLASH_COOLDOWN_MIN, target: -1 })

  const clouds = useMemo<CloudDef[]>(() => {
    const hw = TERRAIN_CONSTANTS.width * 1.3
    const hd = TERRAIN_CONSTANTS.depth * 1.0
    return Array.from({ length: CLOUD_COUNT }, () => ({
      x: (Math.random() - 0.5) * hw * 2,
      y: Y_BASE + Math.random() * Y_SPREAD,
      z: (Math.random() - 0.5) * hd * 2,
      sx: 50 + Math.random() * 70,
      sy: 10 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      baseOpacity: 0.04 + Math.random() * 0.10,
    }))
  }, [])

  useFrame((_, dt) => {
    if (!groupRef.current || intensity <= 0) return
    clockRef.current += dt

    const flash = flashRef.current
    flash.timer += dt
    if (flash.timer > FLASH_COOLDOWN_MIN + Math.random() * 4) {
      flash.timer = 0
      flash.target = Math.floor(Math.random() * CLOUD_COUNT)
    }

    const t = clockRef.current
    groupRef.current.children.forEach((child, i) => {
      if (!(child instanceof THREE.Sprite)) return
      const c = clouds[i]

      child.position.x = c.x + Math.sin(t * DRIFT_SPEED + c.phase) * 15
      child.position.y = c.y + Math.sin(t * 0.12 + c.phase * 2) * 3
      child.position.z = c.z + Math.cos(t * 0.018 + c.phase) * 10

      let op = c.baseOpacity * intensity
      if (i === flash.target && flash.timer < FLASH_DURATION) {
        op = Math.min(0.45, c.baseOpacity * 4) * intensity
      }
      ;(child.material as THREE.SpriteMaterial).opacity = op
    })
  })

  if (intensity <= 0) return null

  return (
    <group ref={groupRef} name="storm-clouds">
      {clouds.map((c, i) => (
        <sprite key={i} position={[c.x, c.y, c.z]} scale={[c.sx, c.sy, 1]}>
          <spriteMaterial
            color="#141428"
            transparent
            opacity={c.baseOpacity * intensity}
            depthWrite={false}
            toneMapped={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
})

StormCloudLayer.displayName = "StormCloudLayer"
export default StormCloudLayer
