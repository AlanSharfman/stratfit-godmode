import { Routes, Route, Navigate } from "react-router-dom"
import App from "@/App"

import PositionPage from "@/pages/position/PositionPage"
import ObjectivePage from "@/pages/objective/ObjectivePage"
import ComparePage from "@/pages/compare/ComparePage"
import InsightsPage from "@/pages/insights/InsightsPage"
import RiskPage from "@/components/Risk/RiskPage"
import BaselinePage from "@/pages/baseline/BaselinePage"
import ValuationPage from "@/pages/valuation/ValuationPage"
import ComingFeaturesPage from "@/pages/coming-features/ComingFeaturesPage"
import AssessmentPage from "@/pages/StrategicAssessmentPage"
import InitializeBaselinePage from "@/pages/initialize/InitializeBaselinePage"

import StudioRoute from "@/routes/StudioRoute"
import StrategyStudioRoute from "@/routes/StrategyStudioRoute"

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Navigate to="/position" replace />} />

        <Route path="/position" element={<PositionPage />} />
        <Route path="/objectives" element={<ObjectivePage />} />
        <Route path="/studio" element={<StudioRoute />} />
        <Route path="/strategy-studio" element={<StrategyStudioRoute />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/baseline" element={<BaselinePage />} />
        <Route path="/valuation" element={<ValuationPage />} />
        <Route path="/coming-features" element={<ComingFeaturesPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/initiate" element={<InitializeBaselinePage />} />

        {/* Removed stub routes:
            /roadmap
            /simulate
           These will be reintroduced only when real pages exist */}
      </Route>
    </Routes>
  )
}
