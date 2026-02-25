// src/components/compare/CompareTerrainPair.tsx
// STRATFIT — Step 22: Dual terrain A/B in one R3F scene (single-canvas)
// Must render inside an R3F <Canvas>. Uses ScenarioMountain directly
// since TerrainStage creates its own Canvas.

import React, { useMemo } from "react"
import { Html } from "@react-three/drei"
import ScenarioMountain from "@/components/mountain/ScenarioMountain"
import { useScenarioStore, type ScenarioId } from "@/state/scenarioStore"

function Label({
  text,
  position,
}: {
  text: string
  position: [number, number, number]
}) {
  return (
    <Html position={position} transform occlude={false} zIndexRange={[10, 0]}>
      <div
        style={{
          pointerEvents: "none",
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          letterSpacing: 0.2,
          backdropFilter: "blur(10px)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </Html>
  )
}

export default function CompareTerrainPair() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)

  const showB = activeScenarioId !== "base"

  // World offsets (keep exactly in sync with labels and path/risk pairs)
  const A: [number, number, number] = showB ? [-1.8, 0, 0] : [0, 0, 0]
  const B: [number, number, number] = [1.8, 0, 0]

  // Label anchors (slightly above terrain)
  const labelY = 1.25
  const labelZ = 0

  return (
    <>
      {/* A: Baseline */}
      <group position={A}>
        <ScenarioMountain scenario="base" />
      </group>
      <Label text="Baseline" position={[A[0], labelY, labelZ]} />

      {/* B: Scenario */}
      {showB && (
        <>
          <group position={B}>
            <ScenarioMountain scenario={activeScenarioId as ScenarioId} />
          </group>
          <Label text="Scenario" position={[B[0], labelY, labelZ]} />
        </>
      )}
    </>
  )
}
