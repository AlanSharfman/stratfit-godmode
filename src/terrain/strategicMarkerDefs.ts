import * as THREE from "three"
import type { MarkerDef } from "./MarkerBeacon"

export const STRATEGIC_MARKERS: MarkerDef[] = [
  // Liquidity
  {
    id: "m-runway-horizon",
    kind: "milestone",
    label: "Runway Horizon",
    position: new THREE.Vector3(-25, 3, -5),
    color: "#00E0FF",
  },
  {
    id: "m-funding-pressure",
    kind: "milestone",
    label: "Funding Pressure",
    position: new THREE.Vector3(10, 4, 0),
    color: "#00E0FF",
  },

  // Market
  {
    id: "m-demand-volatility",
    kind: "signal",
    label: "Demand Volatility",
    position: new THREE.Vector3(35, 6, 5),
    color: "#7A7CFF",
  },
  {
    id: "m-competitive-density",
    kind: "signal",
    label: "Competitive Density",
    position: new THREE.Vector3(55, 5, 2),
    color: "#7A7CFF",
  },

  // Structural
  {
    id: "m-operational-friction",
    kind: "constraint",
    label: "Operational Friction",
    position: new THREE.Vector3(5, 3, -12),
    color: "#A86BFF",
  },
]
