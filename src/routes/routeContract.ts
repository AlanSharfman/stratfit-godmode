// Flat array used by validateRoutingContract — must include every path in LIVE_NAV.
export const ROUTE_CONTRACT = [
  "/initiate",
  "/position",
  "/decision",
  "/studio",
  "/compare",
  "/risk",
  "/valuation",
  "/command",
] as const

export const ROUTES = {
  // Core tabs (routed)
  INITIATE: "/initiate",
  POSITION: "/position",
  DECISION: "/decision",
  STUDIO: "/studio",
  COMPARE: "/compare",
  RISK: "/risk",
  VALUATION: "/valuation",
  COMMAND: "/command",

  // Future (not yet routed — kept for forward-reference only)
  COMPASS: "/compass",
  INSIGHTS: "/insights",
  ASSESSMENT: "/assessment",
  ROADMAP: "/roadmap",
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
