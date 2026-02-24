export type LiveNavItem = { to: string; label: string }

export const LIVE_NAV: LiveNavItem[] = [
  { to: "/position",   label: "Position" },
  { to: "/compass",    label: "Compass" },    // hero tab — strategic intent entry
  { to: "/studio",     label: "Studio" },
  { to: "/compare",    label: "Compare" },
  { to: "/assessment", label: "Assessment" },
  { to: "/roadmap",    label: "Roadmap" },

  // high-value modules
  { to: "/valuation",  label: "Valuation" },
  { to: "/risk",       label: "Risk" },

  // onboarding / objectives
  { to: "/objectives", label: "Objectives" },
]
