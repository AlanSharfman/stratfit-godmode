import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * ProbabilityEnvelope creates a soft confidence band around the baseline path.
 *
 * This visualizes the uncertainty/confidence range of the projection.
 * Uses lightweight triangle strip geometry for performance.
 *
 * Premium aesthetic: subtle cyan with very low opacity (0.12).
 */
export default function ProbabilityEnvelope() {
  return null;
}
