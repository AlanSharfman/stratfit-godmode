// src/types/view.ts
export type CenterViewId =
  | "onboard"
  | "terrain"
  | "strategy"
  | "simulate"
  | "stress"
  | "sensitivity"
  | "impact"
  | "compare"
  | "risk"
  | "valuation"
  | "decision";

// Optional: legacy support for safe migration (remove later)
export type LegacyCenterViewId = "terrain" | "scenario" | "variances" | "foundation" | "impact";

export function migrateCenterView(v: string | undefined | null): CenterViewId {
  if (v === "scenario") return "strategy";
  if (v === "variances") return "compare";
  // Legacy aliases
  if (v === "foundation" || v === "initiate") return "onboard";
  if (
    v === "onboard" ||
    v === "terrain" ||
    v === "strategy" ||
    v === "simulate" ||
    v === "stress" ||
    v === "sensitivity" ||
    v === "impact" ||
    v === "compare" ||
    v === "risk" ||
    v === "valuation" ||
    v === "decision"
  )
    return v;
  return "terrain";
}
