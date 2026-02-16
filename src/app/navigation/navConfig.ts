// src/app/navigation/navConfig.ts
// STRATFIT — Primary Navigation Config (Single Source of Truth)
// Nav Amendment C Lock

import { STRATFIT_ROUTES, type StratfitRouteKey } from "./routeContract";

export interface NavItem {
    key: StratfitRouteKey;
    label: string;
    path: string;
}

export const PRIMARY_NAV: NavItem[] = [
    { key: "initiate", label: "Initiate", path: STRATFIT_ROUTES.initiate },
    { key: "objectives", label: "Objectives", path: STRATFIT_ROUTES.objectives },
    { key: "position", label: "Position", path: STRATFIT_ROUTES.position },
    { key: "studio", label: "Studio", path: STRATFIT_ROUTES.studio },
    { key: "scenarios", label: "Scenarios", path: STRATFIT_ROUTES.scenarios },
    { key: "risk", label: "Risk", path: STRATFIT_ROUTES.risk },
    { key: "capital", label: "Capital", path: STRATFIT_ROUTES.capital },
    { key: "valuation", label: "Valuation", path: STRATFIT_ROUTES.valuation },
    {
        key: "strategicAssessment",
        label: "Strategic Assessment",
        path: STRATFIT_ROUTES.strategicAssessment,
    },
] as const;
