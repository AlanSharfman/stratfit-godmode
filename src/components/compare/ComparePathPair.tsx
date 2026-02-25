// src/components/compare/ComparePathPair.tsx
// STRATFIT — Step 26: Dual trajectory path A/B aligned with terrain
// Must render inside an R3F <Canvas>. Offsets must match CompareTerrainPair.

import React, { useMemo } from "react"
import { Html } from "@react-three/drei"
import TrajectoryPath from "@/components/path/TrajectoryPath"
import { useScenarioStore } from "@/state/scenarioStore"
import { useSimulationStore } from "@/state/simulationStore"
import { scenarioToPathModifiers } from "@/terrain/scenarioToPathModifiers"

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
          padding: "5px 9px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
          backdropFilter: "blur(10px)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </Html>
  )
}

export default function ComparePathPair() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)
  const savedScenarios = useScenarioStore((s) => s.savedScenarios ?? [])

  const activeScenario = useMemo(() => {
    if (!activeScenarioId || activeScenarioId === "base") return null
    return savedScenarios.find((x) => String(x.id) === String(activeScenarioId)) ?? null
  }, [activeScenarioId, savedScenarios])

  // Only show when simulation has completed
  const status = useSimulationStore((s: any) => s.simulationStatus ?? null)
  if (status && status !== "completed") return null

  const showB = activeScenarioId !== "base"

  // MUST match CompareTerrainPair offsets
  const A: [number, number, number] = showB ? [-1.8, 0, 0] : [0, 0, 0]
  const B: [number, number, number] = [1.8, 0, 0]

  const baselineModifiers = useMemo(() => scenarioToPathModifiers(null), [])
  const scenarioModifiers = useMemo(
    () => scenarioToPathModifiers(activeScenario),
    [activeScenario]
  )

  return (
    <>
      {/* A: Baseline Path */}
      <group position={A}>
        <TrajectoryPath modifiers={baselineModifiers} />
      </group>
      <Label text="Path: Baseline" position={[A[0], 0.35, 0]} />

      {/* B: Scenario Path */}
      {showB && (
        <>
          <group position={B}>
            <TrajectoryPath modifiers={scenarioModifiers} />
          </group>
          <Label text="Path: Scenario" position={[B[0], 0.35, 0]} />
        </>
      )}
    </>
  )
}
