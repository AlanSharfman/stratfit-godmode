// src/terrain/terrainAnchors.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Intelligence Anchors
//
// Defines targetable terrain features that the intelligence engine can
// reference during commentary. Each anchor has a semantic type and
// world-space position sampled from the terrain heightfield.
// ═══════════════════════════════════════════════════════════════════════════

export type TerrainAnchorType =
  | "revenue_engine"
  | "margin_expansion"
  | "risk_peak"
  | "inflection_point"
  | "capital_efficiency"
  | "valuation_peak"
  | "roughness_zone"
  | "ev_trajectory"
  | "leverage_nodes"
  | "wide_overview"
  | "path_trajectory"
  | "probability_band";

export interface TerrainAnchor {
  id: string;
  label: string;
  description: string;
  /** World-space [x, y, z] — y is terrain-sampled at runtime */
  position: [number, number, number];
  type: TerrainAnchorType;
}

// ────────────────────────────────────────────────────────────────────────────
// UV → World conversion (matches generateInvestorPlanStub)
// Terrain: width=560, depth=360, scale [3.0, 2.8]
// ────────────────────────────────────────────────────────────────────────────

function uvToWorld(u: number, v: number): [number, number] {
  const x = (u - 0.5) * 560 * 3.0;
  const z = (v - 0.5) * 360 * 2.8;
  return [
    Math.max(-800, Math.min(800, x)),
    Math.max(-500, Math.min(500, z)),
  ];
}

// ────────────────────────────────────────────────────────────────────────────
// CANONICAL ANCHORS
// ────────────────────────────────────────────────────────────────────────────
// Y values are placeholders — resolved at runtime via terrain sampling.

const [REV_X, REV_Z] = uvToWorld(0.40, 0.60);
const [MARGIN_X, MARGIN_Z] = uvToWorld(0.48, 0.52);
const [RISK_X, RISK_Z] = uvToWorld(0.60, 0.35);
const [INFLECT_X, INFLECT_Z] = uvToWorld(0.50, 0.50);
const [CAP_X, CAP_Z] = uvToWorld(0.35, 0.45);
const [VAL_X, VAL_Z] = uvToWorld(0.55, 0.50);
const [ROUGH_X, ROUGH_Z] = uvToWorld(0.55, 0.42);
const [EVTRAJ_X, EVTRAJ_Z] = uvToWorld(0.52, 0.55);
const [LEVER_X, LEVER_Z] = uvToWorld(0.45, 0.48);
const [OVER_X, OVER_Z] = uvToWorld(0.50, 0.50);
const [PATH_X, PATH_Z] = uvToWorld(0.42, 0.58);
const [PROB_X, PROB_Z] = uvToWorld(0.58, 0.46);

export const TERRAIN_ANCHORS: TerrainAnchor[] = [
  {
    id: "revenue_engine",
    label: "Revenue Engine",
    description: "Growth acceleration begins here.",
    position: [REV_X, 0, REV_Z],
    type: "revenue_engine",
  },
  {
    id: "margin_expansion",
    label: "Margin Expansion",
    description: "Unit economics improve across this ridge.",
    position: [MARGIN_X, 0, MARGIN_Z],
    type: "margin_expansion",
  },
  {
    id: "risk_peak",
    label: "Risk Concentration",
    description: "Probability of structural stress peaks here.",
    position: [RISK_X, 0, RISK_Z],
    type: "risk_peak",
  },
  {
    id: "inflection_point",
    label: "Inflection Point",
    description: "Scenario divergence is most visible at this position.",
    position: [INFLECT_X, 0, INFLECT_Z],
    type: "inflection_point",
  },
  {
    id: "capital_efficiency",
    label: "Capital Efficiency",
    description: "Burn rate optimization converges here.",
    position: [CAP_X, 0, CAP_Z],
    type: "capital_efficiency",
  },
  {
    id: "valuation_peak",
    label: "Valuation Peak",
    description: "Maximum value concentration on the terrain.",
    position: [VAL_X, 0, VAL_Z],
    type: "valuation_peak",
  },
  {
    id: "roughness_zone",
    label: "Roughness Zone",
    description: "Operational friction concentrates in this terrain region.",
    position: [ROUGH_X, 0, ROUGH_Z],
    type: "roughness_zone",
  },
  {
    id: "ev_trajectory",
    label: "EV Trajectory",
    description: "Enterprise value progression along the strategic corridor.",
    position: [EVTRAJ_X, 0, EVTRAJ_Z],
    type: "ev_trajectory",
  },
  {
    id: "leverage_nodes",
    label: "Leverage Nodes",
    description: "Strategic leverage converges at these ridge structures.",
    position: [LEVER_X, 0, LEVER_Z],
    type: "leverage_nodes",
  },
  {
    id: "wide_overview",
    label: "Strategic Overview",
    description: "Full terrain landscape — probabilistic scenario surface.",
    position: [OVER_X, 0, OVER_Z],
    type: "wide_overview",
  },
  {
    id: "path_trajectory",
    label: "Path Trajectory",
    description: "Strategic path traverses the terrain toward modelled outcomes.",
    position: [PATH_X, 0, PATH_Z],
    type: "path_trajectory",
  },
  {
    id: "probability_band",
    label: "Probability Band",
    description: "Outcome dispersion envelope across the terrain surface.",
    position: [PROB_X, 0, PROB_Z],
    type: "probability_band",
  },
];

/**
 * Look up an anchor by id.
 * Returns undefined if not found.
 */
export function getTerrainAnchor(id: string): TerrainAnchor | undefined {
  return TERRAIN_ANCHORS.find((a) => a.id === id);
}
