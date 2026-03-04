import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import WelcomePage from "@/pages/welcome/WelcomePage"
import InitializeBaselinePage from "@/pages/initialize/InitializeBaselinePage"
import DecisionPage from "@/pages/decision/DecisionPage"
import PositionRoute from "@/pages/position/PositionRoute"
import StudioPage from "@/pages/studio/StudioPage"
import ComparePage from "@/pages/compare/ComparePage"
import RiskRoute from "@/routes/RiskRoute"
import ValuationRoute from "@/routes/ValuationRoute"
import CommandCentrePage from "@/pages/command/CommandCentrePage"

export default function AppRouter() {
  return (
    <Routes>
      {/* Welcome — front door */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/initiate" element={<InitializeBaselinePage />} />
      <Route path="/position" element={<PositionRoute />} />
      <Route path="/decision" element={<DecisionPage />} />
      <Route path="/studio" element={<StudioPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/risk" element={<RiskRoute />} />
      <Route path="/valuation" element={<ValuationRoute />} />
      <Route path="/command" element={<CommandCentrePage />} />

      {/* Compat redirects */}
      <Route path="/initialize" element={<Navigate to="/initiate" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/initiate" replace />} />
    </Routes>
  )
}
