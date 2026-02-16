import { Route, Routes, Navigate } from "react-router-dom";
import App from "./App";
import { AppStateProvider, useAppState } from "@/providers/AppStateProvider";
import { STRATFIT_ROUTES } from "@/app/navigation/routeContract";

import InitializeRoute from "@/routes/InitializeRoute";
import ObjectiveRoute from "@/routes/ObjectiveRoute";
import CompareRoute from "@/routes/CompareRoute";
import RiskRoute from "@/routes/RiskRoute";
import ValuationRoute from "@/routes/ValuationRoute";
import AssessmentRoute from "@/routes/AssessmentRoute";
import ImpactRoute from "@/routes/ImpactRoute";
import TerrainRoute from "@/routes/TerrainRoute";
import SimulateOverlayRoute from "@/routes/SimulateOverlayRoute";

import ScenarioMemoPage from "@/pages/ScenarioMemoPage";
import StudioPage from "@/pages/studio/StudioPage";
import ScenariosPage from "@/pages/scenarios/ScenariosPage";
import StrategicAssessmentPage from "@/pages/StrategicAssessmentPage";
import AdminEngineConsole from "@/components/admin/AdminEngineConsole";

import MainNav from "@/app/navigation/MainNav";

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
                        <Route path="/" element={<Navigate to={STRATFIT_ROUTES.initiate} replace />} />

                        <Route path="/terrain" element={<Navigate to={STRATFIT_ROUTES.position} replace />} />
                        <Route path="/baseline" element={<Navigate to={STRATFIT_ROUTES.position} replace />} />
                        <Route path="/initialize" element={<Navigate to={STRATFIT_ROUTES.initiate} replace />} />
                        <Route path="/objective" element={<Navigate to={STRATFIT_ROUTES.objectives} replace />} />
                        <Route path="/assessment" element={<Navigate to={STRATFIT_ROUTES.capital} replace />} />

                        <Route element={<App />}>
                            <Route path={STRATFIT_ROUTES.initiate} element={<InitializeRoute />} />
                            <Route path={STRATFIT_ROUTES.objectives} element={<ObjectiveRoute />} />
                            <Route path={STRATFIT_ROUTES.position} element={<BaselineRouteWithState />} />
                            <Route path={STRATFIT_ROUTES.studio} element={<StudioRouteWithState />} />
                            <Route path={STRATFIT_ROUTES.scenarios} element={<ScenariosPage />} />
                            <Route path={STRATFIT_ROUTES.risk} element={<RiskRoute />} />
                            <Route path={STRATFIT_ROUTES.capital} element={<AssessmentRoute />} />
                            <Route path={STRATFIT_ROUTES.valuation} element={<ValuationRoute />} />
                            <Route path={STRATFIT_ROUTES.strategicAssessment} element={<StrategicAssessmentPage />} />

                            <Route path="/compare" element={<CompareRoute />} />
                            <Route path="/impact" element={<ImpactRoute />} />
                            <Route path="/simulate" element={<SimulateRouteWithState />} />
                        </Route>

                        <Route path="/memo/*" element={<ScenarioMemoPage />} />
                        <Route path="/admin/engine" element={<AdminEngineRoute />} />

                        <Route path="*" element={<Navigate to={STRATFIT_ROUTES.initiate} replace />} />
                    </Routes>

                    <ComputationMonitor />
                </AppStateProvider>
            </SystemBaselineProvider>
        </ErrorBoundary>
    );
}
