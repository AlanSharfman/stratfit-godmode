import { useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import type * as THREE from "three"

/**
 * TerrainBreathRig — subtle sinusoidal heave on the terrain surface.
 *
 * Finds the "terrain-surface" mesh by name and oscillates its Y position
 * with a slow, organic period (~7 s). Amplitude is small enough to feel
 * alive without being distracting.
 */
export default function TerrainBreathRig() {
  const { scene } = useThree()
  const meshRef = useRef<THREE.Mesh | null>(null)
  const baseY = useRef<number | null>(null)

  useFrame(({ clock }) => {
    // Lazy lookup — grab terrain-surface once and cache
    if (!meshRef.current) {
      const found = scene.getObjectByName("terrain-surface") as THREE.Mesh | undefined
      if (!found) return
      meshRef.current = found
      baseY.current = found.position.y          // −6
    }

    const t = clock.getElapsedTime()

    // Primary heave — slow breath (~7 s period)
    const breath = Math.sin(t * 0.9) * 0.35

    // Secondary micro-ripple — faster, lower-amplitude organic drift
    const ripple = Math.sin(t * 2.1 + 1.2) * 0.08

    meshRef.current.position.y = (baseY.current ?? -6) + breath + ripple

    // Also find and move the lattice in sync (if visible)
    const lattice = scene.getObjectByName("terrain-lattice") as THREE.Mesh | undefined
    if (lattice) {
      lattice.position.y = meshRef.current.position.y
    }
  })

  return null
}
