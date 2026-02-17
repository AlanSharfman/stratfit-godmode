import React from "react"

export default function TimelineTicks() {
  const ticks = Array.from({ length: 10 }, (_, i) => -50 + i * 10)

  return (
    <group>
      {ticks.map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      ))}
    </group>
  )
}
