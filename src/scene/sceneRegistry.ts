// src/scene/sceneRegistry.ts

export type SceneId =
  | "terrain"
  | "compare"
  | "risk"
  | "valuation"
  | "assessment"
  | "impact"
  | "simulate"
  | "none";

export function sceneFromPath(pathname: string): SceneId {
  const path = pathname.split("?")[0].split("#")[0];
  const first = (path.split("/").filter(Boolean)[0] ?? "terrain").toLowerCase();

  switch (first) {
    case "terrain":
      return "terrain";
    case "baseline":
      return "terrain";
    case "studio":
      return "simulate";
    case "compare":
      return "compare";
    case "risk":
      return "risk";
    case "valuation":
      return "valuation";
    case "assessment":
      return "assessment";
    case "impact":
      return "impact";
    case "simulate":
      return "simulate";
    default:
      return "none";
  }
}

export function routeHas3D(scene: SceneId): boolean {
  return scene !== "none";
}
