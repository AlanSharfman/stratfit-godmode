export type ArrowTone = "up" | "down" | "neutral";

export type DemoFlagId =
  | "survival"
  | "cashValley"
  | "growth"
  | "operating"
  | "capital"
  | "value";

export type DemoStop = {
  id: DemoFlagId;

  // Terrain anchor in WORLD coords (same space as your terrain mesh)
  anchor: { x: number; y: number; z: number };

  // Camera target + position (WORLD coords)
  camPos: { x: number; y: number; z: number };
  camLookAt: { x: number; y: number; z: number };

  // Optional cinematic overrides (safe defaults if omitted)
  fov?: number; // degrees
  zoomInFovDelta?: number; // e.g. 4 means zoom from fov -> fov-4 during hold
  spotlightRadiusPx?: number; // UI spotlight size hint

  title: string;
  headline: string;
  subline: string;

  arrow: ArrowTone;

  ai: {
    what: string;
    why: string;
    means: string;
  };
};
