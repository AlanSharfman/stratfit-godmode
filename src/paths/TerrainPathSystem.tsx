import React from "react"
import { Line } from "@react-three/drei"
import * as THREE from "three"

const MARKER_POSITIONS = [
  [-40, 0.2, 0],
  [-10, 0.2, 0],
  [10, 0.2, 0],
  [40, 0.2, 0],
]

export default function TerrainPathSystem() {
  return (
    <group renderOrder={1000}>
      {/* Timeline — screen readable thickness */}
      <Line
        points={[
          [-120, 0.2, 0],
          [120, 0.2, 0],
        ]}
        color="#9be7ff"
        lineWidth={2.5}
        transparent
        opacity={0.95}
        depthTest={false}
      />

      {/* Timeline markers */}
      {MARKER_POSITIONS.map((pos, i) => (
        <mesh key={i} position={pos as any} renderOrder={1001}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0.9}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  )
}
