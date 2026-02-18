// src/navigation/navConfig.ts
// STRATFIT — Canonical Navigation Contract (Single Source of Truth)

export type NavId =
  | "initiate"
  | "baseline"
  | "objective"
  | "studio"
  | "compare"
  | "risk"
  | "valuation"
  | "capital";

export type NavItem = {
  id: NavId;
  label: string;
  path: `/${string}`; // canonical path (must start with "/")
};

export const NAV_ITEMS: NavItem[] = [
  { id: "initiate", label: "INITIATE", path: "/initiate" },
  { id: "baseline", label: "BASELINE", path: "/position" },
  { id: "objective", label: "OBJECTIVE", path: "/objectives" },
  { id: "studio", label: "STUDIO", path: "/studio" },
  { id: "compare", label: "COMPARE", path: "/scenarios" },
  { id: "risk", label: "RISK", path: "/risk" },
  { id: "valuation", label: "VALUATION", path: "/valuation" },
  { id: "capital", label: "CAPITAL", path: "/capital" },
];

export const NAV_BY_ID: Record<NavId, NavItem> = NAV_ITEMS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<NavId, NavItem>);

function normalizePathname(input: string): string {
  if (!input) return "/";

  // strip query/hash if caller passed a full URL-ish string
  const raw = input.split("?")[0].split("#")[0] || "/";

  // ensure leading slash
  let p = raw.startsWith("/") ? raw : `/${raw}`;

  // normalize trailing slashes (except root)
  if (p.length > 1) p = p.replace(/\/+$/g, "");

  return p;
}

/** Safe getter by id (string in, NavItem | null out) */
export function getNavItemById(id: string | null | undefined): NavItem | null {
  if (!id) return null;
  const key = id as NavId;
  return NAV_BY_ID[key] ?? null;
}

/**
 * Safe getter by pathname → returns the canonical nav item if path matches
 * exactly, or if pathname is a child route under a canonical path.
 *
 * Examples:
 *  - "/baseline" → baseline
 *  - "/baseline/" → baseline (normalized)
 *  - "/baseline/foo" → baseline (prefix match)
 */
export function getNavItemByPath(pathname: string | null | undefined): NavItem | null {
  const p = normalizePathname(pathname ?? "/");

  // exact match first
  for (const item of NAV_ITEMS) {
    if (p === item.path) return item;
  }

  // prefix match (supports subroutes under canonical pages)
  for (const item of NAV_ITEMS) {
    if (p.startsWith(item.path + "/")) return item;
  }

  return null;
}

/** Exposed for callers that want the normalized form */
export function normalizeNavPath(pathname: string): string {
  return normalizePathname(pathname);
}
