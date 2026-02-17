import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { buildTerrain } from "./buildTerrain"
import { createSeed } from "./seed"

export default function TerrainSurface() {
  const solidRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const seed = createSeed("baseline")
    return buildTerrain(260, seed)
  }, [])

  useEffect(() => {
    for (const ref of [solidRef, wireRef]) {
      if (!ref.current) continue
      ref.current.rotation.x = -Math.PI / 2
      ref.current.position.set(0, 0, 0)
      ref.current.scale.set(0.1, 0.3, 0.1)
      ref.current.frustumCulled = false
    }
  }, [])

  return (
    <>
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
    </>
  )
}
