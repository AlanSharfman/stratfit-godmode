// src/types/view.ts
export type CenterViewId = "terrain" | "impact" | "compare";

// Optional: legacy support for safe migration (remove later)
export type LegacyCenterViewId = "terrain" | "scenario" | "variances";

export function migrateCenterView(v: string | undefined | null): CenterViewId {
  if (v === "scenario") return "impact";
  if (v === "variances") return "compare";
  if (v === "impact" || v === "compare" || v === "terrain") return v;
  return "terrain";
}
