// src/navigation/routingContract.ts
// Validates the ACTIVE app routing contract (AppRouter + LIVE_NAV).
// main.tsx calls validateRoutingContract() at startup.

import { LIVE_NAV } from "@/navigation/liveNav"
import { ROUTES } from "@/routes/routeContract"

function invariant(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`[ROUTING_CONTRACT] ${msg}`)
}

export function validateRoutingContract() {
  const livePaths = new Set<string>(Object.values(ROUTES))

  for (const item of LIVE_NAV) {
    invariant(
      livePaths.has(item.to),
      `Nav item "${item.label}" points to "${item.to}" but it is not present in ROUTES.`,
    )
  }

  // Sanity checks
  invariant(livePaths.has("/position"), "ROUTES missing /position")
  invariant(livePaths.has("/studio"), "ROUTES missing /studio")
}
