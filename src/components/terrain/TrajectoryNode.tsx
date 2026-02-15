import { Html } from "@react-three/drei";
import type { TrajectoryNodeData } from "@/types/trajectory";

type Props = {
  position: [number, number, number];
  data: TrajectoryNodeData;
};

/**
 * TrajectoryNode renders a 3D marker with an HTML overlay
 * displaying insight data at a specific point along the trajectory path.
 *
 * Visual styling:
 * - Emissive cyan sphere marker
 * - Dark glass background panel
 * - Soft cyan border
 * - Blur backdrop effect
 */
export default function TrajectoryNode({ position, data }: Props) {
  const confidencePercent = Math.round(data.confidence * 100);

  return (
    <group position={position}>
      {/* 3D marker sphere */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#0EA5E9"
          emissive="#0284C7"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial
          color="#00D1FF"
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>

      {/* HTML overlay panel */}
      <Html
        distanceFactor={10}
        center
        style={{
          pointerEvents: "auto",
          transform: "translateY(-60px)",
        }}
      >
        <div className="trajectory-node">
          <h4 className="trajectory-node__title">{data.title}</h4>
          <p className="trajectory-node__insight">{data.insight}</p>
          <div className="trajectory-node__footer">
            <span className="trajectory-node__impact">
              Impact: {data.impact}
            </span>
            <span className="trajectory-node__confidence">
              {confidencePercent}% confidence
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}
