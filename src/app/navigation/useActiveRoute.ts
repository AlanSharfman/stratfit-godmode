// src/app/navigation/useActiveRoute.ts
// STRATFIT — Active Route Hook
// Nav Rewire Lock

import { useLocation } from "react-router-dom";
import { STRATFIT_ROUTES, type StratfitRouteKey } from "./routeContract";

export function useActiveRoute(): StratfitRouteKey | null {
    const { pathname } = useLocation();

    for (const [key, path] of Object.entries(STRATFIT_ROUTES)) {
        if (pathname === path || pathname.startsWith(path + "/")) {
            return key as StratfitRouteKey;
        }
    }

    return null;
}
