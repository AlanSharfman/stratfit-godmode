// src/components/risk/RiskField.tsx
// STRATFIT — Risk field overlay stub for Compare dual-risk rendering
// Step 27: renders risk intensity nodes inside an R3F scene

import React, { useMemo } from "react"
import type { RiskModifiers } from "@/terrain/scenarioToRiskModifiers"

interface RiskFieldProps {
  modifiers: RiskModifiers
}

interface RiskNode {
  position: [number, number, number]
  scale: number
  color: string
}

/**
 * Stub risk field component.
 * Renders small spheres representing risk concentration
 * in the scene, sized by intensity.
 */
export default function RiskField({ modifiers }: RiskFieldProps) {
  const nodes = useMemo<RiskNode[]>(() => {
    const result: RiskNode[] = []
    const count = 5 + Math.round(modifiers.intensity * 8)
    const spread = 1.5 - modifiers.concentration * 0.8

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = spread * (0.5 + Math.sin(i * 1.7) * 0.5)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = 0.05 + Math.random() * 0.1

      const scale = 0.03 + modifiers.intensity * 0.08
      const riskBias = modifiers.executionRisk + modifiers.fundingPressure
      const color = riskBias > 0.5 ? "#f87171" : riskBias > 0.3 ? "#fbbf24" : "#22d3ee"

      result.push({ position: [x, y, z], scale, color })
    }

    return result
  }, [modifiers])

  return (
    <group name="risk-field">
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position} scale={node.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
