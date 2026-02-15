import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import type { ProjectedTrajectoryVector } from "./trajectoryProjectionOnce";

/**
 * TrajectoryNodes renders insight markers along the trajectory path.
 *
 * Features:
 * - Premium emissive sphere markers
 * - Hover shows minimal label (NOT full panel)
 * - Click opens/closes detailed insight panel
 * - Nodes subscribe only to trajectory store (no simulation state)
 */
export default function TrajectoryNodes() {
  const {
    insights,
    baselineVectors,
    setHoveredInsightId,
    setSelectedInsightId,
    selectedInsightId,
  } = useTrajectoryStore();

  const vectorByT = useMemo(() => {
    // Vectors are ordered by t; find first >= node.t
    return (t: number) =>
      baselineVectors.find((p) => p.t >= t) as ProjectedTrajectoryVector | undefined;
  }, [baselineVectors]);

  if (!baselineVectors.length) return null;

  return (
    <>
      {insights.map((node) => {
        const v = vectorByT(node.t);
        if (!v) return null;

        const isSelected = selectedInsightId === node.id;
        const y = typeof v.y === "number" ? v.y : 0;

        return (
          <group
            key={node.id}
            position={[v.x, y + 0.06, v.z]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredInsightId(node.id);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredInsightId(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInsightId(isSelected ? null : node.id);
            }}
          >
            <mesh>
              <sphereGeometry args={[0.12, 18, 18]} />
              <meshStandardMaterial
                color={isSelected ? "#67E8F9" : "#22D3EE"}
                emissive={isSelected ? "#06B6D4" : "#0891B2"}
                emissiveIntensity={isSelected ? 2.2 : 1.6}
                roughness={0.25}
                metalness={0.15}
              />
            </mesh>

            {/* Minimal hover label (NOT the full panel) */}
            <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
              <div
                style={{
                  transform: "translateY(-18px)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  background: "rgba(6, 12, 18, 0.62)",
                  border: "1px solid rgba(34, 211, 238, 0.25)",
                  backdropFilter: "blur(10px)",
                  color: "rgba(230, 247, 255, 0.92)",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {node.title}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

