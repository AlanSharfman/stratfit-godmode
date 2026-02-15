import { useTrajectoryStore } from "@/state/trajectoryStore";

/**
 * BranchPoints renders visual indicators for scenario branching opportunities.
 *
 * Architecture:
 * - Lightweight torus geometry
 * - Does NOT modify core path logic
 * - Spaced every 12 points for clarity
 */
export default function BranchPoints() {
  const { baselineVectors } = useTrajectoryStore();

  if (baselineVectors.length < 12) return null;

  return (
    <>
      {baselineVectors
        .filter((_, i) => i % 12 === 0 && i > 0)
        .map((v, i) => {
          const y = v.y ?? 0;

          return (
            <mesh key={i} position={[v.x, y + 0.05, v.z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.025, 16, 40]} />
              <meshStandardMaterial
                color="#FACC15"
                emissive="#F59E0B"
                emissiveIntensity={1.2}
                roughness={0.25}
                metalness={0.1}
              />
            </mesh>
          );
        })}
    </>
  );
}
