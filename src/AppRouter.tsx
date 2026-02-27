import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"

import InitializeBaselinePage from "@/pages/initialize/InitializeBaselinePage"
import DecisionPage from "@/pages/decision/DecisionPage"
import PositionRoute from "@/pages/position/PositionRoute"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/initiate" replace />} />
      <Route path="/initiate" element={<InitializeBaselinePage />} />
      <Route path="/decision" element={<DecisionPage />} />
      <Route path="/position" element={<PositionRoute />} />
      <Route path="*" element={<Navigate to="/initiate" replace />} />
    </Routes>
  )
}
