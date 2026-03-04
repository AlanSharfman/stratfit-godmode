// Flat array used by validateRoutingContract — must include every path in LIVE_NAV.
export const ROUTE_CONTRACT = [
  "/position",
  "/studio",
  "/compare",
  "/initiate",
  "/decision",
  "/risk",
  "/valuation",
] as const

export const ROUTES = {
  // Core tabs (routed)
  POSITION: "/position",
  STUDIO: "/studio",
  COMPARE: "/compare",
  INITIATE: "/initiate",
  DECISION: "/decision",

  // Future (not yet routed — kept for forward-reference only)
  COMPASS: "/compass",
  INSIGHTS: "/insights",
  ASSESSMENT: "/assessment",
  ROADMAP: "/roadmap",
  RISK: "/risk",
  VALUATION: "/valuation",
  COMING_FEATURES: "/coming-features",
  BASELINE: "/baseline",
  OBJECTIVES: "/objectives",
  SIMULATE: "/simulate",
  IMPACT: "/impact",
  STRATEGY_STUDIO: "/strategy-studio",
  INITIALIZE: "/initialize",

  // legacy / gated
  ADVANCED: "/advanced",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
