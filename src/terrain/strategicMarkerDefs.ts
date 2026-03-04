import * as THREE from "three"
import type { MarkerDef } from "./markerTypes"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

// X positions map to approximate months along the temporal terrain.
// Range: x0 = -width*0.36  to  x1 = +width*0.36
// Markers represent key temporal milestones a founder tracks.
const X0 = -TERRAIN_CONSTANTS.width * 0.36
const X1 = TERRAIN_CONSTANTS.width * 0.36
const monthX = (month: number, horizon: number) =>
  X0 + (X1 - X0) * (month / Math.max(1, horizon))

const HORIZON = 24 // default 24-month view

export const STRATEGIC_MARKERS: MarkerDef[] = [
  // Month 3: Runway pressure (early liquidity checkpoint)
  {
    id: "m-runway-horizon",
    kind: "milestone",
    label: "Runway Pressure",
    position: new THREE.Vector3(monthX(3, HORIZON), 0, -50),
    color: "#00E0FF",
  },
  // Month 6: Funding window
  {
    id: "m-funding-pressure",
    kind: "milestone",
    label: "Funding Window",
    position: new THREE.Vector3(monthX(6, HORIZON), 0, 55),
    color: "#00E0FF",
  },
  // Month 12: Peak demand uncertainty
  {
    id: "m-demand-volatility",
    kind: "signal",
    label: "Demand Volatility",
    position: new THREE.Vector3(monthX(12, HORIZON), 0, -80),
    color: "#7A7CFF",
  },
  // Month 18: Competitive density zone
  {
    id: "m-competitive-density",
    kind: "signal",
    label: "Competitive Density",
    position: new THREE.Vector3(monthX(18, HORIZON), 0, 45),
    color: "#7A7CFF",
  },
  // Month 22: Late-stage operational friction
  {
    id: "m-operational-friction",
    kind: "constraint",
    label: "Operational Friction",
    position: new THREE.Vector3(monthX(22, HORIZON), 0, -35),
    color: "#A86BFF",
  },
]

// ─── PATH WAYPOINT DEFINITIONS ──────────────────────────────────────────────
// Waypoints anchored ON the P50 strategic path at evenly spaced t-positions.
// Rendered by PathWaypoints component — NOT by StrategicMarkerBeacon.
// These replace the scattered terrain markers with path-aligned milestones.

export interface PathWaypointDef {
  id: string
  label: string
  /** Position along the CatmullRom spline (0 = start, 1 = end) */
  t: number
  color: string
  /** Brief one-line description for tooltip */
  description: string
}

export const PATH_WAYPOINT_DEFS: PathWaypointDef[] = [
  {
    id: "wp-liquidity-horizon",
    label: "Liquidity Horizon",
    t: 0.1,
    color: "#00e0ff",
    description: "Cash runway & burn rate checkpoint",
  },
  {
    id: "wp-capital-raise",
    label: "Capital Raise",
    t: 0.3,
    color: "#34d399",
    description: "Funding window & capital efficiency",
  },
  {
    id: "wp-revenue-acceleration",
    label: "Revenue Acceleration",
    t: 0.5,
    color: "#facc15",
    description: "Growth inflection & demand signal",
  },
  {
    id: "wp-margin-expansion",
    label: "Margin Expansion",
    t: 0.7,
    color: "#a78bfa",
    description: "Unit economics & margin trajectory",
  },
  {
    id: "wp-strategic-scale",
    label: "Strategic Scale",
    t: 0.9,
    color: "#f472b6",
    description: "Scale threshold & operational leverage",
  },
]
