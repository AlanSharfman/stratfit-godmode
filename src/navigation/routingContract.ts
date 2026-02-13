import { NAV_ITEMS } from "@/navigation/navConfig";

/**
 * Single canonical set of route paths.
 * Keep this aligned with NAV_ITEMS.
 */
export const ROUTE_PATHS = {
  initiate: "/initialize",
  baseline: "/baseline",
  objective: "/objective",
  studio: "/studio",
  compare: "/compare",
  risk: "/risk",
  valuation: "/valuation",
  capital: "/capital",
} as const;

type RouteId = keyof typeof ROUTE_PATHS;

function invariant(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(`[ROUTING_CONTRACT] ${msg}`);
}

/**
 * Call once at startup.
 * Crashes early if nav/route contract drifts.
 */
export function validateRoutingContract() {
  // 1) ids must match
  const routeIds = new Set(Object.keys(ROUTE_PATHS));
  const navIds = new Set(NAV_ITEMS.map((n) => n.id));

  for (const id of routeIds) {
    invariant(navIds.has(id), `NAV_ITEMS missing id "${id}"`);
  }
  for (const id of navIds) {
    invariant(routeIds.has(id), `ROUTE_PATHS missing id "${id}"`);
  }

  // 2) paths must match
  const pathById = new Map(NAV_ITEMS.map((n) => [n.id, n.path]));
  for (const [id, path] of Object.entries(ROUTE_PATHS)) {
    invariant(pathById.get(id) === path, `Path mismatch for "${id}": NAV="${pathById.get(id)}" ROUTE="${path}"`);
  }

  // 3) no duplicate paths
  const seen = new Set<string>();
  for (const n of NAV_ITEMS) {
    invariant(!seen.has(n.path), `Duplicate nav path detected: "${n.path}"`);
    seen.add(n.path);
  }
}
