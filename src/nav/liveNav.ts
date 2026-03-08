// src/nav/liveNav.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Single canonical primary navigation config.
//
// This is the ONLY place where primary nav items are defined.
// ALL shells, headers, and nav components derive from this array.
// To add, remove, or reorder: edit ONLY this file.
//
// Canonical order: INITIATE | POSITION | WHAT IF | COMPARE | STUDIO | RISK | VALUATION | BOARDROOM
//
// ACTIONS, TIMELINE, PULSE are NOT in primary nav.
// They exist as page-level secondary controls only.
// ═══════════════════════════════════════════════════════════════════════════

import { ROUTES } from "@/routes/routeContract"

export type NavItem = {
  label: string
  to: string
}

export const LIVE_NAV: NavItem[] = [
  { label: "Initiate",   to: ROUTES.INITIATE  },
  { label: "Position",   to: ROUTES.POSITION  },
  { label: "What If",    to: ROUTES.WHAT_IF   },
  { label: "Compare",    to: ROUTES.COMPARE   },
  { label: "Studio",     to: ROUTES.STUDIO    },
  { label: "Risk",       to: ROUTES.RISK      },
  { label: "Valuation",  to: ROUTES.VALUATION },
  { label: "Boardroom",  to: ROUTES.BOARDROOM },
]
