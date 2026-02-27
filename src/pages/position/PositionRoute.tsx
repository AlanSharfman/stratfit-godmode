import React, { useEffect } from "react"
import { Navigate } from "react-router-dom"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import PositionPage from "@/pages/position/PositionPage"

export default function PositionRoute() {
  const hydrated = usePhase1ScenarioStore((s) => s.isHydrated)
  const hydrate = usePhase1ScenarioStore((s) => s.hydrate)
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) {
    return <div style={{ padding: 24 }}>Loading scenario store…</div>
  }

  if (!activeScenarioId) {
    return <Navigate to="/decision" replace />
  }

  const scenario = scenarios?.find((s) => s.id === activeScenarioId)
  if (!scenario) {
    return <div style={{ padding: 24 }}>No active scenario — redirecting…</div>
  }

  return <PositionPage />
}
