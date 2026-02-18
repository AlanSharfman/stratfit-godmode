import React from "react"

export default function StructuralPillars() {
  return (
    <group>
      <mesh position={[-10, 2, -5]}>
        <cylinderGeometry args={[0.4, 0.4, 4, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      <mesh position={[15, 2, -8]}>
        <cylinderGeometry args={[0.4, 0.4, 4, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  )
}
