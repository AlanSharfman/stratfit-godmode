// src/types/view.ts
export type CenterViewId = "terrain" | "timeline" | "impact" | "compare" | "decision";

// Optional: legacy support for safe migration (remove later)
export type LegacyCenterViewId = "terrain" | "scenario" | "variances";

export function migrateCenterView(v: string | undefined | null): CenterViewId {
  if (v === "terrain") return "terrain";
  if (v === "impact") return "impact";
  if (v === "compare") return "compare";
  if (v === "scenario") return "compare"; // legacy
  if (v === "variances") return "impact"; // legacy
  if (v === "timeline") return "timeline";
  if (v === "decision") return "decision";
  return "terrain"; // anything else
}
