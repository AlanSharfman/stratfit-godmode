export type MarkerKind = "WAYPOINT" | "RESERVOIR" | "PASS" | "HAZARD" | "BEACON";

export type Marker = {
  id: string;
  kind: MarkerKind;
  label: string;
  t: number;           // timeline position 0..1 (critical)
  x: number;
  z: number;
  // Optional semantics
  severity?: number;   // 0..1 (hazards/beacons)
  confidence?: number; // 0..1 (beacons)
};
