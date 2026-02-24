import { Routes, Route, Navigate } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"
import AppHeader from "@/components/layout/AppHeader"
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider"
import StratfitErrorBoundary from "@/system/StratfitErrorBoundary"
import { useRenderSentinel } from "@/dev/useRenderSentinel"

import TerrainRoute from "@/routes/TerrainRoute"
import StudioRoute from "@/routes/StudioRoute"
import CompareRoute from "@/routes/CompareRoute"
import AssessmentRoute from "@/routes/AssessmentRoute"

// Restore implemented routes
import InitializeRoute from "@/routes/InitializeRoute"
import BaselineRoute from "@/routes/BaselineRoute"
import ObjectiveRoute from "@/routes/ObjectiveRoute"
import RiskRoute from "@/routes/RiskRoute"
import ValuationRoute from "@/routes/ValuationRoute"
import SimulateRoute from "@/routes/SimulateRoute"
import ImpactRoute from "@/routes/ImpactRoute"
import StrategyStudioRoute from "@/routes/StrategyStudioRoute"
import CompassPage from "@/pages/compass/CompassPage"
import SimulationPresenceLayer from "@/components/system/SimulationPresenceLayer"

export default function AppRouter() {
  useRenderSentinel("AppRouter");
  return (
    <SystemBaselineProvider>
      <StratfitErrorBoundary>
        <div className="app">
          <AppHeader />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <StratfitErrorBoundary>
              <Routes>
            <Route path="/" element={<Navigate to={ROUTES.POSITION} />} />

            {/* Initialize aliases */}
            <Route path={ROUTES.INITIALIZE} element={<InitializeRoute />} />
            <Route path={ROUTES.INITIATE} element={<Navigate to={ROUTES.INITIALIZE} replace />} />

            {/* Core */}
            <Route path={ROUTES.POSITION} element={<TerrainRoute />} />
            <Route path={ROUTES.COMPASS} element={<CompassPage />} />
            <Route path={ROUTES.STUDIO} element={<StudioRoute />} />
            <Route path={ROUTES.COMPARE} element={<CompareRoute />} />
            <Route path={ROUTES.ASSESSMENT} element={<AssessmentRoute />} />
            <Route
              path={ROUTES.ROADMAP}
              element={<div className="p-6 text-slate-200">Roadmap</div>}
            />

            {/* Restored modules */}
            <Route path={ROUTES.BASELINE} element={<BaselineRoute />} />
            <Route path={ROUTES.OBJECTIVES} element={<ObjectiveRoute />} />
            <Route path={ROUTES.RISK} element={<RiskRoute />} />
            <Route path={ROUTES.VALUATION} element={<ValuationRoute />} />
            <Route path={ROUTES.SIMULATE} element={<div className="p-6 text-slate-200">Simulate</div>} />
            <Route path={ROUTES.IMPACT} element={<ImpactRoute />} />
            <Route path={ROUTES.STRATEGY_STUDIO} element={<StrategyStudioRoute />} />

              <Route path="*" element={<Navigate to={ROUTES.POSITION} />} />
            </Routes>
            </StratfitErrorBoundary>
          </div>

          {/* GLOBAL: simulation presence on every page */}
          <StratfitErrorBoundary>
            <SimulationPresenceLayer />
          </StratfitErrorBoundary>
        </div>
      </StratfitErrorBoundary>
    </SystemBaselineProvider>
  )
}
