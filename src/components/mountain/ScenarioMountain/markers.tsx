import React from "react";

// ============================================================================
// CONTINUITY CUES — Reality anchor, origin marker, forward cue (strategy only)
// ============================================================================

export function ContinuityCues(props: {
  enabled: boolean;
  origin?: [number, number, number];
  forward?: [number, number, number];
}) {
  const { enabled, origin = [0, 0.12, 0], forward = [0, 0.12, -6] } = props;
  if (!enabled) return null;

  return (
    <group renderOrder={20}>
      {/* Reality Anchor pin */}
      <group position={[origin[0], origin[1] + 0.18, origin[2]]}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color="#67e8f9"
            emissive="#22d3ee"
            emissiveIntensity={0.35}
          />
        </mesh>
        {/* small stem */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 10]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* Trajectory Origin marker ("You are here") */}
      <group position={origin}>
        <mesh>
          <ringGeometry args={[0.18, 0.28, 32]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Forward / North cue: faint arrow line */}
      <group>
        <mesh
          position={[
            (origin[0] + forward[0]) * 0.5,
            origin[1],
            (origin[2] + forward[2]) * 0.5,
          ]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry
            args={[0.01, 0.01, Math.abs(forward[2] - origin[2]) || 6, 8]}
          />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.25} />
        </mesh>
        <mesh position={forward}>
          <coneGeometry args={[0.08, 0.18, 10]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}
