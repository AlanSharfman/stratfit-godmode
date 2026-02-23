import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/routeContract";
import AppHeader from "@/components/layout/AppHeader";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";

import TerrainRoute from "@/routes/TerrainRoute";
import StudioRoute from "@/routes/StudioRoute";
import CompareRoute from "@/routes/CompareRoute";
import AssessmentRoute from "@/routes/AssessmentRoute";
import InitializePage from "@/pages/initialize/InitializePage";

export default function AppRouter() {
    return (
        <SystemBaselineProvider>
            <div className="app">
                <AppHeader />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <Routes>
                        <Route path="/" element={<Navigate to={ROUTES.POSITION} />} />

                        <Route path="/initialize" element={<InitializePage />} />

                        <Route path={ROUTES.POSITION} element={<TerrainRoute />} />
                        <Route path={ROUTES.STUDIO} element={<StudioRoute />} />
                        <Route path={ROUTES.COMPARE} element={<CompareRoute />} />
                        <Route path={ROUTES.ASSESSMENT} element={<AssessmentRoute />} />
                        <Route
                            path={ROUTES.ROADMAP}
                            element={<div className="p-6 text-slate-200">Roadmap</div>}
                        />

                        <Route path="*" element={<Navigate to={ROUTES.POSITION} />} />
                    </Routes>
                </div>
            </div>
        </SystemBaselineProvider>
    );
}
