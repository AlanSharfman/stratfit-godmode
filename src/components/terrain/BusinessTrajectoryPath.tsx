import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import type { TrajectoryVector, TrajectoryInsight, TrajectoryNodeData } from "@/types/trajectory";
import {
  projectPathToTerrain,
  sampleCurve,
  trajectoryPointsToVector3,
  getPointAtPosition,
} from "./trajectoryUtils";
import TrajectoryNode from "./TrajectoryNode";

type Props = {
  terrainMesh: THREE.Mesh | null;
};

/**
 * Convert TrajectoryVector[] to TrajectoryPoint-like format for rendering
 */
function vectorsToPoints(vectors: TrajectoryVector[]): Array<{ id: string; x: number; z: number }> {
  return vectors.map((v, i) => ({
    id: `pt-${i}`,
    x: v.x,
    z: v.z,
  }));
}

/**
 * Convert TrajectoryInsight[] to TrajectoryNodeData[] for rendering
 */
function insightsToNodes(insights: TrajectoryInsight[]): TrajectoryNodeData[] {
  return insights.map((insight) => ({
    id: insight.id,
    title: insight.title,
    insight: insight.message,
    impact: insight.impact,
    confidence: insight.confidence,
    positionIndex: insight.t,
  }));
}

/**
 * BusinessTrajectoryPath renders a terrain-conforming spline path
 * representing the business journey, with annotation nodes anchored along the path.
 *
 * Visual rules:
 * - Path follows terrain height
 * - Sits slightly above surface (no clipping)
 * - Supports nodes with insights
 * - Premium visual styling with cyan glow
 *
 * Engineering note: Path is a pure visual projection.
 * It does NOT own simulation state to prevent render feedback loops.
 */
export default function BusinessTrajectoryPath({ terrainMesh }: Props) {
  const { scenarioVectors, insights } = useTrajectoryStore();
  
  // Convert store data to rendering format
  const path = useMemo(() => vectorsToPoints(scenarioVectors), [scenarioVectors]);
  const nodes = useMemo(() => insightsToNodes(insights), [insights]);

  // Convert trajectory points to Vector3 array
  const rawPoints = useMemo(() => {
    return trajectoryPointsToVector3(path);
  }, [path]);

  // Create smooth curve from raw points
  const curve = useMemo(() => {
    if (rawPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(rawPoints);
  }, [rawPoints]);

  // Sample curve and project to terrain
  const projectedPoints = useMemo(() => {
    if (!curve || !terrainMesh) return [];

    const sampled = sampleCurve(curve, 200);
    return projectPathToTerrain(sampled, terrainMesh, 0.15);
  }, [curve, terrainMesh]);

  // Create final curve from projected points for node positioning
  const projectedCurve = useMemo(() => {
    if (projectedPoints.length < 2) return null;
    return new THREE.CatmullRomCurve3(projectedPoints);
  }, [projectedPoints]);

  // Calculate node positions along the curve
  const nodePositions = useMemo(() => {
    if (!projectedCurve || nodes.length === 0) return [];

    return nodes.map((node) => {
      // positionIndex is normalized 0-1 along the path
      const t = node.positionIndex;
      const point = getPointAtPosition(projectedCurve, t);
      return {
        node,
        position: [point.x, point.y, point.z] as [number, number, number],
      };
    });
  }, [projectedCurve, nodes]);

  if (projectedPoints.length < 2) return null;

  return (
    <group name="business-trajectory-path">
      {/* Main trajectory line */}
      <Line
        points={projectedPoints}
        color="#00D1FF"
        lineWidth={3}
        dashed={false}
      />

      {/* Glow effect line (slightly wider, more transparent) */}
      <Line
        points={projectedPoints}
        color="#00D1FF"
        lineWidth={6}
        transparent
        opacity={0.3}
      />

      {/* Trajectory nodes */}
      {nodePositions.map(({ node, position }) => (
        <TrajectoryNode key={node.id} position={position} data={node} />
      ))}
    </group>
  );
}
