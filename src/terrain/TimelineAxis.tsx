import React from "react"

export default function TimelineAxis() {
  return (
    <line position={[0, 0.02, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([-60, 0, 0, 60, 0, 0]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#7dd3fc" />
    </line>
  )
}
