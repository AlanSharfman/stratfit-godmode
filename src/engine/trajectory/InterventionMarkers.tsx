import { Html } from "@react-three/drei";
import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * InterventionMarkers places interactive markers along the trajectory
 * indicating potential intervention points.
 *
 * Architecture:
 * - Lightweight geometry (cone)
 * - Interactive but minimal DOM overlay
 * - Spaced every 8 points to avoid clutter
 */
export default function InterventionMarkers() {
  const { baselineVectors } = useTrajectoryStore();

  if (baselineVectors.length < 8) return null;

  return (
    <>
      {baselineVectors
        .filter((_, i) => i % 8 === 0 && i > 0)
        .map((v, i) => {
          const y = v.y ?? 0;

          return (
            <group key={i} position={[v.x, y + 0.25, v.z]}>
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.08, 0.25, 12]} />
                <meshStandardMaterial
                  color="#A78BFA"
                  emissive="#6366F1"
                  emissiveIntensity={0.8}
                  roughness={0.3}
                />
              </mesh>

              <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
                <div
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 8,
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(167, 139, 250, 0.25)",
                    backdropFilter: "blur(8px)",
                    color: "#E6F7FF",
                    whiteSpace: "nowrap",
                  }}
                >
                  Intervention Point
                </div>
              </Html>
            </group>
          );
        })}
    </>
  );
}
