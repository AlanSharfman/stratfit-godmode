import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import TrajectoryAnimatedLine from "./TrajectoryAnimatedLine";

/**
 * MultiScenarioOverlay renders additional scenario paths on top of the dual trajectory.
 *
 * Architecture:
 * - Supports unlimited scenarios (currently renders scenario path)
 * - Slight Y offset for visual separation
 * - Reuses TrajectoryAnimatedLine for consistent styling
 */
export default function MultiScenarioOverlay() {
  const { scenarioVectors } = useTrajectoryStore();

  const pts = useMemo(() => {
    if (scenarioVectors.length < 2) return [];
    return scenarioVectors.map((v) => new THREE.Vector3(v.x, (v.y ?? 0) + 0.05, v.z));
  }, [scenarioVectors]);

  if (pts.length < 2) return null;

  return <TrajectoryAnimatedLine sampledPoints={pts} />;
}
