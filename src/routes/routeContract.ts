// Flat array used by validateRoutingContract — must include every path in LIVE_NAV.
export const ROUTE_CONTRACT = [
  "/position",
  "/compass",
  "/studio",
  "/compare",
  "/insights",
  "/risk",
  "/valuation",
  "/coming-features",
  "/assessment",
  "/roadmap",
  "/initialize",
] as const

export const ROUTES = {
  // Core tabs
  POSITION: "/position",
  COMPASS: "/compass",
  STUDIO: "/studio",
  COMPARE: "/compare",
  INSIGHTS: "/insights",
  ASSESSMENT: "/assessment",
  ROADMAP: "/roadmap",

  // Restore rich modules (already implemented)
  INITIALIZE: "/initialize",
  INITIATE: "/initiate", // alias -> /initialize

  BASELINE: "/baseline",
  OBJECTIVES: "/objectives",
  RISK: "/risk",
  VALUATION: "/valuation",
  COMING_FEATURES: "/coming-features",
  SIMULATE: "/simulate",
  IMPACT: "/impact",
  STRATEGY_STUDIO: "/strategy-studio",

  // legacy / gated
  ADVANCED: "/advanced",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
