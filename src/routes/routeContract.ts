export const ROUTES = {
  POSITION: "/position",
  STUDIO: "/studio",
  COMPARE: "/compare",
  ASSESSMENT: "/assessment",
  ROADMAP: "/roadmap",

  // legacy / gated
  ADVANCED: "/advanced",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
