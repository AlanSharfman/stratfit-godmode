import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/app/layout/AppShell";
import { RouteContract } from "@/app/navigation/routeContract";

import InitializeRoute from "@/routes/InitializeRoute";
import ObjectiveRoute from "@/routes/ObjectiveRoute";
import TerrainRoute from "@/routes/TerrainRoute";
import StudioRoute from "@/routes/StudioRoute";
import CompareRoute from "@/routes/CompareRoute";
import RiskRoute from "@/routes/RiskRoute";
import ImpactRoute from "@/routes/ImpactRoute";
import ValuationRoute from "@/routes/ValuationRoute";
import AssessmentRoute from "@/routes/AssessmentRoute";

export default function AppRouter() {
    return (
        <AppShell>
            <Routes>
                <Route path={RouteContract.initialize} element={<InitializeRoute />} />
                <Route path={RouteContract.objectives} element={<ObjectiveRoute />} />
                <Route path={RouteContract.position} element={<TerrainRoute />} />
                <Route path={RouteContract.studio} element={<StudioRoute />} />
                <Route path={RouteContract.compare} element={<CompareRoute />} />
                <Route path={RouteContract.risk} element={<RiskRoute />} />
                <Route path={RouteContract.capital} element={<ImpactRoute />} />
                <Route path={RouteContract.valuation} element={<ValuationRoute />} />
                <Route path={RouteContract.assessment} element={<AssessmentRoute />} />
                <Route path="*" element={<Navigate to={RouteContract.initialize} replace />} />
            </Routes>
        </AppShell>
    );
}
