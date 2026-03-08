import React, { useEffect } from "react"
import { Navigate } from "react-router-dom"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import PositionPage from "@/pages/position/PositionPage"

export default function PositionRoute() {
  const scenarioHydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const hydrateScenarios = usePhase1ScenarioStore((s) => s.hydrate)
  const { baseline } = useSystemBaseline()

  useEffect(() => { hydrateScenarios() }, [hydrateScenarios])

  if (!scenarioHydrated) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "#060b16",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#2a5a80", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14,
      }}>
        Loading&#8230;
      </div>
    )
  }

  if (!baseline) {
    return <Navigate to="/initiate" replace />
  }

  return <PositionPage />
}
