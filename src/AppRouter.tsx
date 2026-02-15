import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import App from "./App";
import { AppStateProvider, useAppState } from "@/providers/AppStateProvider";
import InitializeRoute from "@/routes/InitializeRoute";
import ObjectiveRoute from "@/routes/ObjectiveRoute";
import CompareRoute from "@/routes/CompareRoute";
import RiskRoute from "@/routes/RiskRoute";
import ValuationRoute from "@/routes/ValuationRoute";
import AssessmentRoute from "@/routes/AssessmentRoute";
import ImpactRoute from "@/routes/ImpactRoute";
import TerrainRoute from "@/routes/TerrainRoute";
import StrategyStudioRoute from "@/routes/StrategyStudioRoute";
import SimulateOverlayRoute from "@/routes/SimulateOverlayRoute";

import ScenarioMemoPage from "@/pages/ScenarioMemoPage";
import StudioPage from "@/pages/studio/StudioPage";
import AdminEngineConsole from "@/components/admin/AdminEngineConsole";
import { MainNav } from "@/components/navigation";

import ErrorBoundary from "@/components/ErrorBoundary";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";
import ComputationMonitor from "@/components/system/ComputationMonitor";

import "./styles/phase2Tokens.css";
import "./styles/tokens.css";
import "./styles/mountainBackplate.css";
import "./index.css";
import "./styles/phase1LayoutFixes.css";

function BaselineRouteWithState() {
  const state = useAppState();
  return (
    <TerrainRoute
      hasBaseline={state.hasBaseline}
      showSimulate={state.showSimulate}
      setShowSimulate={state.setShowSimulate}
      showSaveModal={state.showSaveModal}
      setShowSaveModal={state.setShowSaveModal}
      showLoadPanel={state.showLoadPanel}
      setShowLoadPanel={state.setShowLoadPanel}
      levers={state.levers}
      isSimulatingGlobal={state.isSimulatingGlobal}
    />
  );
}

function StudioRouteWithState() {
  return <StudioPage />;
}

function SimulateRouteWithState() {
  const state = useAppState();
  return <SimulateOverlayRoute levers={state.levers} />;
}

function AdminEngineRoute() {
  return (
    <div className="app">
      <MainNav />
      <AdminEngineConsole />
    </div>
  );
}

export default function AppRouter() {
  return (
    <ErrorBoundary>
      <SystemBaselineProvider>
        <AppStateProvider>
          <Routes>
            {/* ROOT */}
            <Route path="/" element={<Navigate to="/initialize" replace />} />

            {/* Legacy */}
            <Route path="/terrain" element={<Navigate to="/baseline" replace />} />
            <Route path="/assessment" element={<Navigate to="/capital" replace />} />

            {/* App shell with nested routes */}
            <Route element={<App />}>
              <Route path="/initialize" element={<InitializeRoute />} />
              <Route path="/baseline" element={<BaselineRouteWithState />} />
              <Route path="/objective" element={<ObjectiveRoute />} />
              <Route path="/studio" element={<StudioRouteWithState />} />
              <Route path="/compare" element={<CompareRoute />} />
              <Route path="/risk" element={<RiskRoute />} />
              <Route path="/valuation" element={<ValuationRoute />} />
              <Route path="/capital" element={<AssessmentRoute />} />
              <Route path="/impact" element={<ImpactRoute />} />
              <Route path="/simulate" element={<SimulateRouteWithState />} />
            </Route>

            {/* Other */}
            <Route path="/memo/*" element={<ScenarioMemoPage />} />
            <Route path="/admin/engine" element={<AdminEngineRoute />} />

            {/* Unknown */}
            <Route path="*" element={<Navigate to="/baseline" replace />} />
          </Routes>

          <ComputationMonitor />
        </AppStateProvider>
      </SystemBaselineProvider>
    </ErrorBoundary>
  );
}


