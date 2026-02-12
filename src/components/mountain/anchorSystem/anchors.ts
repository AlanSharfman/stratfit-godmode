/**
 * STRATFIT — Shared Terrain Identification System
 *
 * Canonical anchor definitions used by BOTH Baseline and Strategy Studio.
 * Each anchor marks a named feature on the terrain mesh (UV-mapped).
 */

// ── Anchor IDs ──────────────────────────────────────────────────────────

export type AnchorId =
  | "LEFT_RISE"
  | "PRIMARY_CREST"
  | "UPPER_RIDGE"
  | "CLIFF_EDGE"
  | "SECONDARY_PLATEAU"
  | "VALLEY_BASIN"
  | "FAR_DECLINE";

// ── Anchor definition ───────────────────────────────────────────────────

export interface TerrainAnchor {
  id: AnchorId;
  label: string;
  subtitle: string;
  /** Normalised 0‥1 across terrain plane (u = lateral, v = depth). */
  uv: { u: number; v: number };
}

// ── Canonical anchor catalogue ──────────────────────────────────────────

export const ANCHORS: Record<AnchorId, TerrainAnchor> = {
  LEFT_RISE: {
    id: "LEFT_RISE",
    label: "LEFT RISE",
    subtitle: "Revenue Momentum",
    uv: { u: 0.22, v: 0.58 },
  },
  PRIMARY_CREST: {
    id: "PRIMARY_CREST",
    label: "PRIMARY CREST",
    subtitle: "Margin Stability",
    uv: { u: 0.52, v: 0.36 },
  },
  UPPER_RIDGE: {
    id: "UPPER_RIDGE",
    label: "UPPER RIDGE",
    subtitle: "Runway Sustainability",
    uv: { u: 0.72, v: 0.28 },
  },
  CLIFF_EDGE: {
    id: "CLIFF_EDGE",
    label: "CLIFF EDGE",
    subtitle: "Burn Pressure",
    uv: { u: 0.8, v: 0.48 },
  },
  SECONDARY_PLATEAU: {
    id: "SECONDARY_PLATEAU",
    label: "SECONDARY PLATEAU",
    subtitle: "Capital Strength",
    uv: { u: 0.68, v: 0.72 },
  },
  VALLEY_BASIN: {
    id: "VALLEY_BASIN",
    label: "VALLEY BASIN",
    subtitle: "Structural Fragility",
    uv: { u: 0.38, v: 0.86 },
  },
  FAR_DECLINE: {
    id: "FAR_DECLINE",
    label: "FAR DECLINE",
    subtitle: "Risk Exposure",
    uv: { u: 0.86, v: 0.84 },
  },
};

export const ANCHOR_LIST: TerrainAnchor[] = Object.values(ANCHORS);

/** Quick lookup: id → anchor. */
export const ANCHOR_MAP = new Map<AnchorId, TerrainAnchor>(
  ANCHOR_LIST.map((a) => [a.id, a]),
);

// ── Connection definition ───────────────────────────────────────────────

export interface AnchorConnection<FromId extends string = string> {
  fromId: FromId;
  fromLabel: string;
  anchorId: AnchorId;
}

// ── Strategy Studio lever → anchor mapping ──────────────────────────────

export type StrategyLeverId =
  | "demandStrength"
  | "pricingPower"
  | "expansionVelocity"
  | "costDiscipline"
  | "hiringIntensity"
  | "operatingDrag"
  | "marketVolatility"
  | "executionRisk"
  | "fundingPressure";

export const STRATEGY_LEVER_CONNECTIONS: AnchorConnection<StrategyLeverId>[] = [
  { fromId: "demandStrength",    fromLabel: "Demand Strength",    anchorId: "LEFT_RISE" },
  { fromId: "expansionVelocity", fromLabel: "Expansion Velocity", anchorId: "LEFT_RISE" },
  { fromId: "pricingPower",      fromLabel: "Pricing Power",      anchorId: "PRIMARY_CREST" },
  { fromId: "costDiscipline",    fromLabel: "Cost Discipline",    anchorId: "PRIMARY_CREST" },
  { fromId: "hiringIntensity",   fromLabel: "Hiring Intensity",   anchorId: "UPPER_RIDGE" },
  { fromId: "operatingDrag",     fromLabel: "Operating Drag",     anchorId: "VALLEY_BASIN" },
  { fromId: "fundingPressure",   fromLabel: "Funding Pressure",   anchorId: "CLIFF_EDGE" },
  { fromId: "executionRisk",     fromLabel: "Execution Risk",     anchorId: "FAR_DECLINE" },
  { fromId: "marketVolatility",  fromLabel: "Market Volatility",  anchorId: "FAR_DECLINE" },
];

// ── Baseline metric → anchor mapping ────────────────────────────────────

export type BaselineMetricId =
  | "revenueFitness"
  | "costDiscipline"
  | "capitalStrength"
  | "runwayStability"
  | "operatingEfficiency"
  | "structuralRisk";

export const BASELINE_METRIC_CONNECTIONS: AnchorConnection<BaselineMetricId>[] = [
  { fromId: "revenueFitness",      fromLabel: "Revenue Fitness",      anchorId: "LEFT_RISE" },
  { fromId: "costDiscipline",      fromLabel: "Cost Discipline",      anchorId: "PRIMARY_CREST" },
  { fromId: "capitalStrength",     fromLabel: "Capital Strength",     anchorId: "SECONDARY_PLATEAU" },
  { fromId: "runwayStability",     fromLabel: "Runway Stability",     anchorId: "UPPER_RIDGE" },
  { fromId: "operatingEfficiency", fromLabel: "Operating Efficiency", anchorId: "SECONDARY_PLATEAU" },
  { fromId: "structuralRisk",      fromLabel: "Structural Risk",      anchorId: "VALLEY_BASIN" },
];




