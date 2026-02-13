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
