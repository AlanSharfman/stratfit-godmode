// src/components/compare/CompareRiskPair.tsx
// STRATFIT — Step 27: Dual risk field A/B aligned with terrain + legend
// Must render inside an R3F <Canvas>. Offsets must match CompareTerrainPair.

import React, { useMemo } from "react"
import { Html } from "@react-three/drei"
import RiskField from "@/components/Risk/RiskField"
import { useScenarioStore } from "@/state/scenarioStore"
import { useSimulationStore } from "@/state/simulationStore"
import { scenarioToRiskModifiers } from "@/terrain/scenarioToRiskModifiers"

function Tag({
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

export default function CompareRiskPair() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)
  const savedScenarios = useScenarioStore((s) => s.savedScenarios ?? [])

  const activeScenario = useMemo(() => {
    if (!activeScenarioId || activeScenarioId === "base") return null
    return savedScenarios.find((x) => String(x.id) === String(activeScenarioId)) ?? null
  }, [activeScenarioId, savedScenarios])

  const status = useSimulationStore((s: any) => s.simulationStatus ?? null)
  if (status && status !== "completed") return null

  const showB = activeScenarioId !== "base"

  // MUST match CompareTerrainPair offsets
  const A: [number, number, number] = showB ? [-1.8, 0, 0] : [0, 0, 0]
  const B: [number, number, number] = [1.8, 0, 0]

  const baselineModifiers = useMemo(() => scenarioToRiskModifiers(null), [])
  const scenarioModifiers = useMemo(
    () => scenarioToRiskModifiers(activeScenario),
    [activeScenario]
  )

  return (
    <>
      {/* A: Baseline Risk */}
      <group position={A}>
        <RiskField modifiers={baselineModifiers} />
      </group>
      <Tag text="Risk: Baseline" position={[A[0], 0.6, 0]} />

      {/* B: Scenario Risk */}
      {showB && (
        <>
          <group position={B}>
            <RiskField modifiers={scenarioModifiers} />
          </group>
          <Tag text="Risk: Scenario" position={[B[0], 0.6, 0]} />
        </>
      )}

      {/* Compare-only legend (UI overlay anchored in scene near center) */}
      <Html position={[0, 1.55, 0]} transform occlude={false} zIndexRange={[9, 0]}>
        <div
          style={{
            pointerEvents: "none",
            padding: "8px 10px",
            borderRadius: 14,
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.9)",
            fontSize: 12,
            backdropFilter: "blur(10px)",
            minWidth: 180,
          }}
        >
          <div style={{ opacity: 0.9, marginBottom: 6 }}>Risk Intensity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.8 }}>
            <div>Low → smaller nodes</div>
            <div>High → larger nodes</div>
          </div>
        </div>
      </Html>
    </>
  )
}
