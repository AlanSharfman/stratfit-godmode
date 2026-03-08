// src/nav/liveNav.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Single canonical navigation config.
//
// ALL navbar components derive their items from this array.
// No page or component may define its own nav item list.
//
// To add, remove, or reorder items: edit ONLY this file.
// ═══════════════════════════════════════════════════════════════════════════

import { ROUTES } from "@/routes/routeContract"

export type NavItem = {
  label: string
  to: string
}

export const LIVE_NAV: NavItem[] = [
  { label: "Position",  to: ROUTES.POSITION  },
  { label: "Decision",  to: ROUTES.WHAT_IF   }, // /decision alias redirects here; canonical path used for active-state correctness
  { label: "Studio",    to: ROUTES.STUDIO    },
  { label: "Compare",   to: ROUTES.COMPARE   },
  { label: "Risk",      to: ROUTES.RISK      },
  { label: "Valuation", to: ROUTES.VALUATION },
]
