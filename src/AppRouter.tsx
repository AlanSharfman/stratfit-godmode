import React, { Suspense } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"

import WelcomePage from "@/pages/welcome/WelcomePage"
import InitializeBaselinePage from "@/pages/initialize/InitializeBaselinePage"
import PositionRoute from "@/pages/position/PositionRoute"
import WhatIfPage from "@/pages/what-if/WhatIfPage"
import ActionsPage from "@/pages/actions/ActionsPage"
import TimelinePage from "@/pages/timeline/TimelinePage"
import RiskPage from "@/pages/modules/StrategicModulesPage"
import ComparePage from "@/pages/compare/ComparePage"
import StudioPage from "@/pages/studio/StudioPage"
import BoardroomPage from "@/pages/boardroom/BoardroomPage"
import PulsePage from "@/pages/pulse/PulsePage"
import TermsPage from "@/pages/legal/TermsPage"
import PrivacyPage from "@/pages/legal/PrivacyPage"

function AppRoutes() {
  const location = useLocation()

  return (
    <Routes location={location}>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/initiate" element={<InitializeBaselinePage />} />
      <Route path="/position" element={<PositionRoute />} />
      <Route path="/what-if" element={<WhatIfPage />} />
      <Route path="/actions" element={<ActionsPage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/risk" element={<RiskPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/studio" element={<StudioPage />} />
      <Route path="/valuation" element={<RiskPage />} />
      <Route path="/boardroom" element={<BoardroomPage />} />
      <Route path="/pulse" element={<PulsePage />} />
      <Route path="/legal/terms" element={<TermsPage />} />
      <Route path="/legal/privacy" element={<PrivacyPage />} />

      {/* Compat redirects */}
      <Route path="/initialize" element={<Navigate to="/initiate" replace />} />
      <Route path="/scenarios" element={<Navigate to="/what-if" replace />} />
      <Route path="/decision" element={<Navigate to="/what-if" replace />} />
      <Route path="/briefing" element={<Navigate to="/boardroom" replace />} />
      <Route path="/command" element={<Navigate to="/actions" replace />} />

      <Route path="*" element={<Navigate to="/initiate" replace />} />
    </Routes>
  )
}

export default function AppRouter() {
  return <AppRoutes />
}
