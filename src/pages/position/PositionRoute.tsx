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

  // Gate 1: store not yet rehydrated from localStorage
  if (!hydrated) {
    return <div style={{ padding: 24, color: "#e2e8f0" }}>Loading scenario store&#8230;</div>
  }

  // Gate 2: no active scenario selected → back to decision
  if (!activeScenarioId) {
    return <Navigate to="/decision" replace />
  }

  // Gate 3: active ID doesn't match any scenario → redirect
  const scenario = scenarios?.find((s) => s.id === activeScenarioId)
  if (!scenario) {
    return <Navigate to="/decision" replace />
  }

  return <PositionPage />
}
