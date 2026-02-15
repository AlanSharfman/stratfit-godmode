import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import TrajectoryAnimatedLine from "./TrajectoryAnimatedLine";

/**
 * DualTrajectory renders both baseline and scenario paths simultaneously.
 *
 * Architecture:
 * - Baseline path: primary trajectory (original projection)
 * - Scenario path: alternative trajectory (slightly elevated for visual separation)
 *
 * The visual separation is achieved via a small Y offset (0.08 units)
 * rather than different styling, maintaining the premium aesthetic.
 */
export default function DualTrajectory() {
  const { baselineVectors, scenarioVectors } = useTrajectoryStore();

  const basePts = useMemo(
    () => baselineVectors.map((v) => new THREE.Vector3(v.x, v.y ?? 0, v.z)),
    [baselineVectors]
  );

  const scenarioPts = useMemo(
    () => scenarioVectors.map((v) => new THREE.Vector3(v.x, v.y ?? 0, v.z)),
    [scenarioVectors]
  );

  return (
    <>
      {/* Baseline path - primary trajectory */}
      {basePts.length > 1 && <TrajectoryAnimatedLine sampledPoints={basePts} />}

      {/* Scenario path - slightly offset upward for visual separation */}
      {scenarioPts.length > 1 && (
        <group position={[0, 0.08, 0]}>
          <TrajectoryAnimatedLine sampledPoints={scenarioPts} />
        </group>
      )}
    </>
  );
}
