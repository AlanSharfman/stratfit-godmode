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

  const surfaceMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0c1722"),
      roughness: 0.92,
      metalness: 0.04,
      emissive: new THREE.Color("#081423"),
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.78,
    })

    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        float depthFactor = clamp(gl_FragCoord.z, 0.0, 1.0);
        gl_FragColor.rgb += vec3(depthFactor * 0.06);
        #include <dithering_fragment>
        `
      )
    }

    return mat
  }, [])

  const latticeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#7dd3fc"),
      transparent: true,
      opacity: 0.22,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  return (
    <>
      {/* Physical surface */}
      <mesh
        ref={solidRef}
        geometry={geometry}
        material={surfaceMaterial}
        renderOrder={0}
        name="terrain-surface"
        onClick={(e) => {
          e.stopPropagation()
          clearSelected()
        }}
      />

      {/* Embedded lattice */}
      <mesh ref={latticeRef} geometry={geometry} material={latticeMaterial} renderOrder={1} />
    </>
  )
}
