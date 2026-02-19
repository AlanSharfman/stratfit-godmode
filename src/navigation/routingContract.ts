// src/navigation/routingContract.ts
// Validates the ACTIVE app routing contract (AppRouter + app/navigation).
// main.tsx calls validateRoutingContract() at startup.

import { NAV_ITEMS } from "@/app/navigation/navConfig";
import { RouteContract } from "@/app/navigation/routeContract";

function invariant(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`[ROUTING_CONTRACT] ${msg}`);
}

/**
 * Call once at startup.
 * Validates that every nav item's path is a registered route and that
 * no two nav items share the same path.
 */
export function validateRoutingContract() {
  const routePaths = new Set<string>(Object.values(RouteContract));

  // Every nav item must point to a real route
  for (const n of NAV_ITEMS) {
    invariant(
      routePaths.has(n.path),
      `Nav item "${n.key}" points to path "${n.path}" which is not registered in RouteContract`,
    );
  }

  // No duplicate nav paths
  const seen = new Set<string>();
  for (const n of NAV_ITEMS) {
    invariant(!seen.has(n.path), `Duplicate nav path detected: "${n.path}"`);
    seen.add(n.path);
  }
}

// Re-export for any legacy consumers that used ROUTE_PATHS from here.
export { RouteContract as ROUTE_PATHS } from "@/app/navigation/routeContract";
