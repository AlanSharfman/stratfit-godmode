// src/position/markerStyles.ts
// STRATFIT — Position Marker Visual Grammar
// Phase 2.3 PREP: defines marker taxonomy, geometry spec, and visual config.
// ─────────────────────────────────────────────────────────────────────────────
// DO NOT MOUNT: definitions only. Components will be built in Phase 2.3.
// CRITICAL UX LAW: no dots, no glowing spheres, no decorative elements.
// Every marker must read as instrumentation with a recognisable silhouette.
// ─────────────────────────────────────────────────────────────────────────────

// ── Taxonomy ──────────────────────────────────────────────────────────────────

export type MarkerType =
  | "LiquidityNode"   // vertical flag — cashflow state change
  | "RiskEvent"       // triangular hazard marker — risk inflection
  | "MarketContext"   // low-profile beacon — external context point
  | "Waypoint"        // slim milestone post — strategic milestone
  | "Beacon"          // glow pillar — attention anchor (used sparingly)

// ── Geometry descriptors ─────────────────────────────────────────────────────

export type MarkerGeometry =
  | "flag"            // vertical line + horizontal tab at top
  | "triangle"        // upward-pointing triangle outline (hazard)
  | "disc"            // flat thin disc, low profile (no dots — 2D ring)
  | "post"            // thin vertical post, short
  | "pillar"          // tall thin vertical column with attenuated top

// ── Colour palette ────────────────────────────────────────────────────────────

// All colours must be desaturated. No pure saturated hues.
export const MARKER_PALETTE = {
  liquidity:  "#4fd9c8",  // muted teal — cash-positive signal
  risk:       "#e87040",  // muted amber-orange — hazard
  market:     "#8ab4f8",  // muted periwinkle — external context
  waypoint:   "#a5b8c8",  // blue-grey — neutral milestone
  beacon:     "#c0d8f0",  // cold white — attention anchor
} as const

// ── Visual config per marker type ────────────────────────────────────────────

export interface MarkerVisualConfig {
  type:          MarkerType
  geometry:      MarkerGeometry
  color:         string
  heightUnits:   number          // world-space height above terrain
  baseOpacity:   number          // 0–1, at normal camera distance
  lineWidth:     number          // for line-based geometry
  scale:         number          // relative size multiplier
  /** Never animate by default. Only pulsate when explicitly hovered. */
  animated:      false
}

export const MARKER_STYLES: Record<MarkerType, MarkerVisualConfig> = {
  LiquidityNode: {
    type:        "LiquidityNode",
    geometry:    "flag",
    color:       MARKER_PALETTE.liquidity,
    heightUnits: 12,
    baseOpacity: 0.72,
    lineWidth:   1.2,
    scale:       1.0,
    animated:    false,
  },

  RiskEvent: {
    type:        "RiskEvent",
    geometry:    "triangle",
    color:       MARKER_PALETTE.risk,
    heightUnits: 8,
    baseOpacity: 0.68,
    lineWidth:   1.0,
    scale:       1.0,
    animated:    false,
  },

  MarketContext: {
    type:        "MarketContext",
    geometry:    "disc",
    color:       MARKER_PALETTE.market,
    heightUnits: 4,
    baseOpacity: 0.45,
    lineWidth:   0.8,
    scale:       0.85,
    animated:    false,
  },

  Waypoint: {
    type:        "Waypoint",
    geometry:    "post",
    color:       MARKER_PALETTE.waypoint,
    heightUnits: 10,
    baseOpacity: 0.60,
    lineWidth:   0.9,
    scale:       0.9,
    animated:    false,
  },

  Beacon: {
    type:        "Beacon",
    geometry:    "pillar",
    color:       MARKER_PALETTE.beacon,
    heightUnits: 18,
    baseOpacity: 0.55,
    lineWidth:   1.4,
    scale:       1.0,
    animated:    false,
  },
}

// ── Placement contract ────────────────────────────────────────────────────────

/** Each mounted marker must supply this. */
export interface MarkerPlacement {
  id:          string
  type:        MarkerType
  /** Normalised path parameter 0–1 (from P50Path) */
  pathT:       number
  /** Optional sub-label (e.g. "Series A", "Burn inflection") */
  sublabel?:   string
}

// ── Clustering rules ──────────────────────────────────────────────────────────

/** Minimum path-T gap between any two rendered markers (prevents clustering). */
export const MIN_MARKER_GAP_T = 0.06

/** Maximum number of markers visible at any one time. */
export const MAX_VISIBLE_MARKERS = 8
