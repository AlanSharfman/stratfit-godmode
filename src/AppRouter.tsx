import React, { lazy, Suspense } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import PageTransition from "@/components/transitions/PageTransition"
import PageSkeleton from "@/components/system/PageSkeleton"

const WelcomePage = lazy(() => import("@/pages/welcome/WelcomePage"))
const InitializeBaselinePage = lazy(() => import("@/pages/initialize/InitializeBaselinePage"))
const PositionRoute = lazy(() => import("@/pages/position/PositionRoute"))
const WhatIfPage = lazy(() => import("@/pages/what-if/WhatIfPage"))
const ActionsPage = lazy(() => import("@/pages/actions/ActionsPage"))
const TimelinePage = lazy(() => import("@/pages/timeline/TimelinePage"))
const RiskPage = lazy(() => import("@/pages/risk/RiskPage"))
const ComparePage = lazy(() => import("@/pages/compare/ComparePage"))
const StudioPage = lazy(() => import("@/pages/studio/StudioPage"))
const ValuationPage = lazy(() => import("@/pages/valuation/ValuationPage"))
const BoardroomPage = lazy(() => import("@/pages/boardroom/BoardroomPage"))
const PulsePage = lazy(() => import("@/pages/pulse/PulsePage"))

function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#040810",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 20, height: 20,
          border: "2px solid rgba(34,211,238,0.15)",
          borderTopColor: "rgba(34,211,238,0.7)",
          borderRadius: "50%",
          animation: "routeLoadSpin 0.7s linear infinite",
          margin: "0 auto 14px",
        }} />
        <div style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "rgba(200,220,240,0.25)",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Loading
        </div>
        <style>{`@keyframes routeLoadSpin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
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
          <Route path="/valuation" element={<ValuationPage />} />
          <Route path="/boardroom" element={<BoardroomPage />} />
          <Route path="/pulse" element={<PulsePage />} />

          {/* Compat redirects */}
          <Route path="/initialize" element={<Navigate to="/initiate" replace />} />
          <Route path="/scenarios" element={<Navigate to="/what-if" replace />} />
          <Route path="/decision" element={<Navigate to="/what-if" replace />} />
          <Route path="/briefing" element={<Navigate to="/boardroom" replace />} />
          <Route path="/command" element={<Navigate to="/actions" replace />} />

          <Route path="*" element={<Navigate to="/initiate" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  )
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnimatedRoutes />
    </Suspense>
  )
}
