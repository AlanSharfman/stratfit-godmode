import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/routeContract";
import MainNav from "@/components/navigation/MainNav";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";

import TerrainRoute from "@/routes/TerrainRoute";
import StudioRoute from "@/routes/StudioRoute";
import CompareRoute from "@/routes/CompareRoute";
import AssessmentRoute from "@/routes/AssessmentRoute";

export default function AppRouter() {
    return (
        <SystemBaselineProvider>
            <div className="app">
                <MainNav />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <Routes>
                        <Route path="/" element={<Navigate to={ROUTES.POSITION} />} />

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
