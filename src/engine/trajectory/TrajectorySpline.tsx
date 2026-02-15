import { useMemo } from "react";
import * as THREE from "three";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import TrajectoryAnimatedLine from "./TrajectoryAnimatedLine";
import type { ProjectedTrajectoryVector } from "./trajectoryProjectionOnce";

/**
 * TrajectorySpline generates the smooth curve from trajectory vectors
 * and renders it using the animated line component.
 *
 * Architecture rules:
 * - Trajectory rendering is purely derived from state
 * - Trajectory owns spline
 * - No simulation logic inside render layer
 */
export default function TrajectorySpline() {
  const { baselineVectors } = useTrajectoryStore();

  // Convert vectors to Vector3 points
  const points = useMemo(() => {
    return baselineVectors.map((v) => {
      const projected = v as ProjectedTrajectoryVector;
      // Use y from projection if available, otherwise default to 0
      const y = typeof projected.y === "number" ? projected.y : 0;
      return new THREE.Vector3(v.x, y, v.z);
    });
  }, [baselineVectors]);

  // Create smooth CatmullRom curve
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.25);
  }, [points]);

  // Sample curve at high fidelity for smooth rendering
  const sampled = useMemo(() => {
    if (!curve) return [];
    // Higher fidelity = smoother path
    return curve.getPoints(240);
  }, [curve]);

  if (!curve || sampled.length < 2) return null;

  return <TrajectoryAnimatedLine sampledPoints={sampled} />;
}
