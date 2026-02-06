// src/components/compare/types.ts
// STRATFIT — Compare Types

export type QuantileSeries = {
  // arrays length = N (timeline points)
  p5: number[];
  p50: number[];
  p95: number[];
};

export type CompareMetric = "ARR" | "CASH" | "RUNWAY";

export type CompareDataset = {
  months: number[];          // e.g. [0..36]
  baseline: QuantileSeries;  // scenario A
  exploration: QuantileSeries; // scenario B
  metric: CompareMetric;
};

export type DriverKey =
  | "Pricing"
  | "Demand"
  | "Churn"
  | "CAC"
  | "Headcount"
  | "COGS"
  | "Ops Risk"
  | "Capital Raise";

export type DriverHeatmap = {
  drivers: DriverKey[];
  // matrix drivers x monthsIndex with values [-1..+1]
  // negative = baseline advantage, positive = exploration advantage
  values: number[][];
};

