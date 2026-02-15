import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * DivergenceRibbon creates a subtle translucent ribbon between baseline and scenario paths.
 *
 * This visualizes the "delta space" between trajectories in a premium, non-gaming aesthetic.
 * The ribbon uses a soft cyan color with very low opacity (0.15) for institutional quality.
 *
 * Geometry: Triangle strip connecting corresponding points on both paths.
 */
export default function DivergenceRibbon() {
  return null;
}
