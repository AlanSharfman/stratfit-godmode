export type BaselineAnchorId =
  | "LEFT_RISE"
  | "PRIMARY_CREST"
  | "UPPER_RIDGE"
  | "CLIFF_EDGE"
  | "SECONDARY_PLATEAU"
  | "VALLEY_BASIN"
  | "FAR_DECLINE";

export type BaselineAnchor = {
  id: BaselineAnchorId;
  label: string;
  subtitle: string;
  uv: { u: number; v: number }; // normalized 0..1 across terrain plane
};

export const BASELINE_ANCHORS: Record<BaselineAnchorId, BaselineAnchor> = {
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

export type BaselineMetricId =
  | "revenueFitness"
  | "costDiscipline"
  | "capitalStrength"
  | "runwayStability"
  | "operatingEfficiency"
  | "structuralRisk";

export type BaselineMetricToAnchorMap = Record<BaselineMetricId, BaselineAnchorId>;

export const DEFAULT_METRIC_TO_ANCHOR: BaselineMetricToAnchorMap = {
  revenueFitness: "LEFT_RISE",
  costDiscipline: "PRIMARY_CREST",
  capitalStrength: "SECONDARY_PLATEAU",
  runwayStability: "UPPER_RIDGE",
  operatingEfficiency: "SECONDARY_PLATEAU",
  structuralRisk: "VALLEY_BASIN",
};





