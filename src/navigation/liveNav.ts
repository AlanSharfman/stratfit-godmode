export type LiveNavItem = { to: string; label: string }

export const LIVE_NAV: LiveNavItem[] = [
  { to: "/position", label: "Position" },
  { to: "/studio", label: "Studio" },
  { to: "/compare", label: "Compare" },
  { to: "/assessment", label: "Assessment" },

  // restored high-value modules (keep compact)
  { to: "/valuation", label: "Valuation" },
  { to: "/risk", label: "Risk" },

  // optional but useful for demos / onboarding
  { to: "/objectives", label: "Objectives" },
]
