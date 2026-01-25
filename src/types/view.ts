// src/types/view.ts
export type CenterViewId = "terrain" | "simulate" | "compare" | "impact" | "risk" | "decision" | "valuation";

// Optional: legacy support for safe migration (remove later)
export type LegacyCenterViewId = "terrain" | "scenario" | "variances";

export function migrateCenterView(v: string | undefined | null): CenterViewId {
  if (v === "scenario") return "impact";
  if (v === "variances") return "compare";
  if (v === "impact" || v === "compare" || v === "terrain" || v === "simulate" || v === "risk" || v === "decision" || v === "valuation") return v;
  return "terrain";
}
