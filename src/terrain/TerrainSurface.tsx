import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { buildTerrain } from "./buildTerrain"
import { createSeed } from "./seed"
import { useNarrativeStore } from "@/state/narrativeStore"

export default function TerrainSurface() {
  const solidRef = useRef<THREE.Mesh>(null)
  const latticeRef = useRef<THREE.Mesh>(null)

  const clearSelected = useNarrativeStore((s) => s.clearSelected)

  const geometry = useMemo(() => {
    const seed = createSeed("baseline")
    return buildTerrain(260, seed)
  }, [])

  useEffect(() => {
    for (const ref of [solidRef, latticeRef]) {
      if (!ref.current) continue
      ref.current.rotation.x = -Math.PI / 2
      ref.current.position.set(0, -10, 0)
      ref.current.scale.set(1, 3.0, 1)
      ref.current.frustumCulled = false
    }
  }, [])

  return (
    <>
      {/* Physical surface */}
      <mesh
        ref={solidRef}
        geometry={geometry}
        renderOrder={0}
        name="terrain-surface"
        onClick={(e) => {
          e.stopPropagation()
          clearSelected()
        }}
      >
        <meshStandardMaterial
          color={0x0c1a28}
          emissive={0x071423}
          emissiveIntensity={0.22}
          transparent
          opacity={0.74}
          roughness={0.88}
          metalness={0.06}
          depthWrite
          depthTest
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Embedded lattice */}
      <mesh ref={latticeRef} geometry={geometry} renderOrder={1}>
        <meshStandardMaterial
          color={0x93c5fd}
          emissive={0x38bdf8}
          emissiveIntensity={0.48}
          wireframe
          transparent
          opacity={0.52}
          roughness={0.78}
          metalness={0.1}
          depthWrite={false}
          depthTest
        />
      </mesh>
    </>
  )
}
