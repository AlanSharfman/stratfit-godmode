import React from "react"
import * as THREE from "three"

export default function TerrainPathSystem() {
  return (
    <group>
      {/* Timeline base line (ground reference) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-50, 0.01, 0, 50, 0.01, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#7dd3fc" linewidth={1} />
      </line>
    </group>
  )
}
