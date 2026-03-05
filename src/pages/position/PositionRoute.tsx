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
      <div style={{ padding: 24, color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading&#8230;
      </div>
    )
  }

  if (!baseline) {
    return <Navigate to="/initiate" replace />
  }

  return <PositionPage />
}
