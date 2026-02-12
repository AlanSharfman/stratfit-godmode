import { Route, Routes, Navigate, useNavigate, useOutletContext } from "react-router-dom";
import AppShell, { type AppOutletContext } from "./AppShell";
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
  const ctx = useOutletContext<AppOutletContext>();
  return (
    <TerrainRoute
      hasBaseline={ctx.hasBaseline}
      showSimulate={ctx.showSimulate}
      setShowSimulate={ctx.setShowSimulate}
      showSaveModal={ctx.showSaveModal}
      setShowSaveModal={ctx.setShowSaveModal}
      showLoadPanel={ctx.showLoadPanel}
      setShowLoadPanel={ctx.setShowLoadPanel}
      levers={ctx.levers}
      isSimulatingGlobal={ctx.isSimulatingGlobal}
    />
  );
}

function StudioRouteWithState() {
  const ctx = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();
  return (
    <StrategyStudioRoute
      levers={ctx.levers}
      setLevers={ctx.setLevers}
      scenario={ctx.scenario}
      dataPoints={ctx.dataPoints}
      showSaveModal={ctx.showSaveModal}
      setShowSaveModal={ctx.setShowSaveModal}
      showLoadPanel={ctx.showLoadPanel}
      setShowLoadPanel={ctx.setShowLoadPanel}
      isSimulatingGlobal={ctx.isSimulatingGlobal}
      onRunScenario={() => navigate("/compare")}
    />
  );
}

function SimulateRouteWithState() {
  const ctx = useOutletContext<AppOutletContext>();
  return <SimulateOverlayRoute levers={ctx.levers} />;
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
        <Routes>
          {/* ROOT */}
          <Route path="/" element={<Navigate to="/initialize" replace />} />

          {/* Legacy */}
          <Route path="/terrain" element={<Navigate to="/baseline" replace />} />
          <Route path="/assessment" element={<Navigate to="/capital" replace />} />

          {/* App shell */}
          <Route element={<AppShell />}>
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
      </SystemBaselineProvider>
    </ErrorBoundary>
  );
}


