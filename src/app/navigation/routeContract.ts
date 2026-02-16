// src/app/navigation/routeContract.ts
// STRATFIT — Canonical Route Contract (Single Source of Truth)
// Phase 1 Navigation Lock

export const STRATFIT_ROUTES = {
    initiate: "/initiate",
    objectives: "/objectives",
    position: "/position",
    studio: "/studio",
    scenarios: "/scenarios",
    risk: "/risk",
    capital: "/capital",
    strategicAssessment: "/strategic-assessment",
} as const;

export type StratfitRouteKey = keyof typeof STRATFIT_ROUTES;
export type StratfitRoutePath = (typeof STRATFIT_ROUTES)[StratfitRouteKey];
