import React, { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { buildTerrain } from "./buildTerrain"
import { createSeed } from "./seed"

// ── Breathing tunables ──
const BREATH_SPEED      = 0.28   // cycles per second (very slow, geological feel)
const BREATH_Y_SCALE    = 0.045  // ±4.5% vertical scale oscillation
const BREATH_WIRE_DELTA = 0.08   // wireframe opacity swing (0.36 → 0.44)
const BREATH_EMIT_DELTA = 0.06   // emissive intensity swing on solid mesh
const BREATH_WIRE_EMIT  = 0.05   // wireframe emissive swing

export default function TerrainSurface() {
  const groupRef = useRef<THREE.Group>(null)
  const solidRef = useRef<THREE.Mesh>(null)
  const wireRef  = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const seed = createSeed("baseline")
    return buildTerrain(260, seed)
  }, [])

  // Base scale (applied once, then modulated per-frame)
  const BASE_Y_SCALE = 3.0

  useEffect(() => {
    for (const ref of [solidRef, wireRef]) {
      if (!ref.current) continue
      ref.current.rotation.x = -Math.PI / 2
      ref.current.position.set(0, -10, 0)
      ref.current.scale.set(1, BASE_Y_SCALE, 1)
      ref.current.frustumCulled = false
    }
  }, [])

  // ── Per-frame breathing ──
  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Smooth sine breath (two overlapping frequencies for organic feel)
    const breath =
      Math.sin(t * BREATH_SPEED * Math.PI * 2) * 0.7 +
      Math.sin(t * BREATH_SPEED * 1.618 * Math.PI * 2) * 0.3

    // Vertical scale oscillation (mountain gently rises/falls)
    const yScale = BASE_Y_SCALE * (1 + breath * BREATH_Y_SCALE)

    if (solidRef.current) {
      solidRef.current.scale.y = yScale
      const mat = solidRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.16 + breath * BREATH_EMIT_DELTA
    }
    if (wireRef.current) {
      wireRef.current.scale.y = yScale
      const mat = wireRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.4 + breath * BREATH_WIRE_DELTA
      mat.emissiveIntensity = 0.34 + breath * BREATH_WIRE_EMIT
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={solidRef} geometry={geometry} renderOrder={0} name="terrain-surface">
        <meshStandardMaterial
          color={0x0f1d2b}
          emissive={0x081423}
          emissiveIntensity={0.16}
          transparent
          opacity={0.62}
          roughness={0.92}
          metalness={0.05}
          depthWrite
          depthTest
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh ref={wireRef} geometry={geometry} renderOrder={1}>
        <meshStandardMaterial
          color={0x7dd3fc}
          emissive={0x38bdf8}
          emissiveIntensity={0.34}
          wireframe
          transparent
          opacity={0.4}
          roughness={0.85}
          metalness={0.12}
          depthWrite={false}
          depthTest
        />
      </mesh>
    </group>
  )
}
