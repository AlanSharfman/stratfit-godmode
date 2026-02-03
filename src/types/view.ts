// src/types/view.ts
// NOTE: "impact" is legacy (no longer in MainNav/App switching), but kept in the union
// to avoid breaking older internal mode components that still reference it.
export type CenterViewId = "terrain" | "simulate" | "strategy" | "compare" | "risk" | "decision" | "valuation" | "impact";

// Optional: legacy support for safe migration (remove later)
export type LegacyCenterViewId = "terrain" | "scenario" | "variances";

export function migrateCenterView(v: string | undefined | null): CenterViewId {
  if (v === "scenario") return "strategy";
  if (v === "variances") return "compare";
  if (v === "strategy" || v === "compare" || v === "terrain" || v === "simulate" || v === "risk" || v === "decision" || v === "valuation" || v === "impact") return v;
  return "terrain";
}
