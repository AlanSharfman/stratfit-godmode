import React from "react"
import * as THREE from "three"

export default function HorizonBand() {
  const geometry = new THREE.PlaneGeometry(240, 18)
  const material = new THREE.MeshBasicMaterial({
    color: "#6FE7FF",
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 9, -120]}
      rotation={[-Math.PI / 2.5, 0, 0]}
      renderOrder={10}
    />
  )
}
