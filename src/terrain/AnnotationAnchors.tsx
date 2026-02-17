import React from "react"

export default function AnnotationAnchors() {
  return (
    <group>
      <mesh position={[0, 1, -2]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    </group>
  )
}
