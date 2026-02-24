// Validates LIVE_NAV against ROUTE_CONTRACT at app startup.
// Call this once from main.tsx before the render tree mounts.

import { LIVE_NAV } from "@/nav/liveNav"
import { ROUTE_CONTRACT } from "@/routes/routeContract"

export function validateRoutingContract(): void {
  const navPaths = LIVE_NAV.map((n) => n.path)

  const missing = navPaths.filter(
    (p) => !(ROUTE_CONTRACT as readonly string[]).includes(p),
  )

  if (missing.length > 0) {
    console.warn("[RoutingContract] Nav paths missing from contract:", missing)
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[RoutingContract] OK — all nav paths present in contract")
  }
}
