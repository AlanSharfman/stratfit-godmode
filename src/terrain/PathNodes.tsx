import React from "react"

export default function PathNodes() {
  return (
    <group>
      <mesh position={[-20, 0.05, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>

      <mesh position={[20, 0.05, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>
    </group>
  )
}
