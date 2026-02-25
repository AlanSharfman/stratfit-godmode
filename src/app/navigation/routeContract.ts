// Canonical route contract proxy
// Re-exports the single source of truth to prevent path drift.
import { ROUTES } from "../../routes/routeContract"

export const RouteContract = {
  initialize:  ROUTES.INITIATE,
  position:    ROUTES.POSITION,
  objectives:  ROUTES.OBJECTIVES,
  studio:      ROUTES.STUDIO,
  compare:     ROUTES.COMPARE,
  risk:        ROUTES.RISK,
  capital:     ROUTES.BASELINE,
  valuation:   ROUTES.VALUATION,
  assessment:  ROUTES.ASSESSMENT,
  roadmap:     ROUTES.ROADMAP,
} as const

export type RouteKey = keyof typeof RouteContract
