export type PositionMarkerType =
  | "liquidity"
  | "runway"
  | "market"
  | "drag"
  | "risk"
  | "waypoint";

export interface PositionMarker {
  id: string;
  type: PositionMarkerType;
  x: number;
  z: number;
  label: string;
  description?: string;
}
