export const ROUTES = {
  // Core tabs
  POSITION: "/position",
  COMPASS: "/compass",
  STUDIO: "/studio",
  COMPARE: "/compare",
  ASSESSMENT: "/assessment",
  ROADMAP: "/roadmap",

  // Restore rich modules (already implemented)
  INITIALIZE: "/initialize",
  INITIATE: "/initiate", // alias -> /initialize

  BASELINE: "/baseline",
  OBJECTIVES: "/objectives",
  RISK: "/risk",
  VALUATION: "/valuation",
  SIMULATE: "/simulate",
  IMPACT: "/impact",
  STRATEGY_STUDIO: "/strategy-studio",

  // legacy / gated
  ADVANCED: "/advanced",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
