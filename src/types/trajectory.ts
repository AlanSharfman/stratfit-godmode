// ============================================================================
// TRAJECTORY TYPES - Business Path Visualization Layer
// ============================================================================

// --- Original BusinessTrajectoryPath types (components/terrain) ---

export type TrajectoryPoint = {
  id: string;
  x: number;
  z: number;
  metric?: string;
  value?: number;
};

export type TrajectoryNodeData = {
  id: string;
  title: string;
  insight: string;
  impact: string;
  confidence: number;
  positionIndex: number;
};

// --- Trajectory Engine types (engine/trajectory) ---

export type TrajectoryVector = {
  // timeline spine
  monthIndex?: number;
  t: number; // 0-1 progression along path

  // world coords
  x: number;
  z: number;
  y?: number; // Height (optional - set after terrain projection)

  // optional risk for shading
  risk?: number;
};

export type TrajectoryInsight = {
  id: string;
  t: number; // 0-1 position along path

  title: string;
  message: string;

  // optional metadata used by UI
  type?: "risk" | "opportunity" | "info";
  priority?: "low" | "medium" | "high";

  impact: "low" | "medium" | "high";
  confidence: number;
};
