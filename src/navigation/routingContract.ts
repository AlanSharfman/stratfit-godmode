// src/navigation/routingContract.ts
import { NAV_ITEMS, type NavId } from "@/navigation/navConfig";

/**
 * STRATFIT — Routing Contract
 * Single canonical set of route paths validated against NAV_ITEMS.
 *
 * IMPORTANT:
 * NAV_ITEMS currently uses legacy ids (baseline/objective/compare).
 * We keep ids stable (to satisfy NavId) but map them to the LOCKED new paths.
 *
 * Alias policy:
 * - baseline  -> /position
 * - objective -> /objectives
 * - compare   -> /scenarios
 * - initiate  -> /initiate
 */
export const ROUTE_PATHS = {
  initiate: "/initiate",
  baseline: "/position",
  objective: "/objectives",
  studio: "/studio",
  compare: "/scenarios",
  risk: "/risk",
  valuation: "/valuation",
  capital: "/capital",
} as const satisfies Record<NavId, `/${string}`>;

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
  const routeIds = new Set<RouteId>(Object.keys(ROUTE_PATHS) as RouteId[]);
  const navIds = new Set<RouteId>(NAV_ITEMS.map((n) => n.id));

  for (const id of routeIds) {
    invariant(navIds.has(id), `NAV_ITEMS missing id "${id}"`);
  }
  for (const id of navIds) {
    invariant(routeIds.has(id), `ROUTE_PATHS missing id "${id}"`);
  }

  // 2) paths must match
  const pathById = new Map<RouteId, string>(NAV_ITEMS.map((n) => [n.id, n.path]));
  for (const [id, path] of Object.entries(ROUTE_PATHS) as [RouteId, (typeof ROUTE_PATHS)[RouteId]][]) {
    invariant(pathById.get(id) === path, `Path mismatch for "${id}": NAV="${pathById.get(id)}" ROUTE="${path}"`);
  }

  // 3) no duplicate paths
  const seen = new Set<string>();
  for (const n of NAV_ITEMS) {
    invariant(!seen.has(n.path), `Duplicate nav path detected: "${n.path}"`);
    seen.add(n.path);
  }
}
