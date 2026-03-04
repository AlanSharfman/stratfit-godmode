import * as THREE from "three"
import type { MarkerDef } from "./markerTypes"

// Positions in geometry space: X ∈ [-252, 252], Z ∈ [-162, 162].
// Y is ignored — StrategicMarkerBeacon samples terrain height via getHeightAt.
// Spread across the full terrain width so markers don't bunch at center.
export const STRATEGIC_MARKERS: MarkerDef[] = [
  // Liquidity — far-left quarter (early runway / pre-peak)
  {
    id: "m-runway-horizon",
    kind: "milestone",
    label: "Runway Horizon",
    position: new THREE.Vector3(-190, 0, -50),
    color: "#00E0FF",
  },
  // Liquidity — left-center (approaching critical funding zone)
  {
    id: "m-funding-pressure",
    kind: "milestone",
    label: "Funding Pressure",
    position: new THREE.Vector3(-75, 0, 55),
    color: "#00E0FF",
  },

  // Market — center-ridge (peak demand uncertainty)
  {
    id: "m-demand-volatility",
    kind: "signal",
    label: "Demand Volatility",
    position: new THREE.Vector3(20, 0, -80),
    color: "#7A7CFF",
  },
  // Market — right-center (competitive density zone)
  {
    id: "m-competitive-density",
    kind: "signal",
    label: "Competitive Density",
    position: new THREE.Vector3(135, 0, 45),
    color: "#7A7CFF",
  },

  // Structural — far-right (late-stage operational friction)
  {
    id: "m-operational-friction",
    kind: "constraint",
    label: "Operational Friction",
    position: new THREE.Vector3(210, 0, -35),
    color: "#A86BFF",
  },
]
