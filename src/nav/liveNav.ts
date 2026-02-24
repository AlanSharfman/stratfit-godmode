// CANONICAL: single source of truth for top-level navigation.
// All consumers import from "@/nav/liveNav".
// The validator at "@/system/validateRoutingContract" checks these paths
// against the ROUTE_CONTRACT at startup.

export type NavItem = {
  label: string
  path: string
}

export const LIVE_NAV: NavItem[] = [
  { label: "Position",   path: "/position" },
  { label: "Compass",    path: "/compass" },
  { label: "Studio",     path: "/studio" },
  { label: "Compare",    path: "/compare" },
  { label: "Assessment", path: "/assessment" },
  { label: "Roadmap",    path: "/roadmap" },
]
