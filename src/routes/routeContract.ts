export const ROUTE_CONTRACT = [
  "/initiate",
  "/position",
  "/what-if",
  "/actions",
  "/timeline",
  "/risk",
  "/compare",
  "/studio",
  "/valuation",
  "/boardroom",
  "/pulse",
] as const

export const ROUTES = {
  INITIATE: "/initiate",
  POSITION: "/position",
  WHAT_IF: "/what-if",
  ACTIONS: "/actions",
  TIMELINE: "/timeline",
  RISK: "/risk",
  COMPARE: "/compare",
  STUDIO: "/studio",
  VALUATION: "/valuation",
  BOARDROOM: "/boardroom",
  PULSE: "/pulse",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
