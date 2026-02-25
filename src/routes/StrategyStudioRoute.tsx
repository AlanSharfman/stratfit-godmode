import { Navigate } from "react-router-dom";

/**
 * Redirect legacy path to canonical studio route.
 * Ensures deep links continue to function
 * without creating a second render surface.
 */

export default function StrategyStudioRoute() {
  return <Navigate to="/studio" replace />
}
