import { useMemo } from "react";
import { positionMarkers } from "./markerData";
import { PositionMarker } from "@/types/positionMarkers";

interface Props {
  terrainRef: React.RefObject<{ getHeightAt: (x: number, z: number) => number }>;
  enabled?: boolean;
}

/**
 * MarkerLayer — Strategic dateline inflection point markers.
 * Each marker: crisp bright cyan sphere + soft ethereal azure halo glow.
 */
export default function MarkerLayer({ terrainRef, enabled = true }: Props) {
  const meshes = useMemo(() => {
    if (!terrainRef?.current) return [];

    return positionMarkers.map((m: PositionMarker) => {
      const y = terrainRef.current!.getHeightAt(m.x, m.z) + 1.8;
      return { ...m, y };
    });
  }, [terrainRef]);

  if (!enabled) return null;

  return (
    <group>
      {meshes.map(m => (
        <group key={m.id} position={[m.x, m.y, m.z]}>
          {/* Vertical post — subtle dark pillar */}
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial
              color="#0a1520"
              emissive="#0ea5e9"
              emissiveIntensity={0.25}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Outer halo glow — ethereal azure sphere */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.65, 16, 16]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#22d3ee"
              emissiveIntensity={0.8}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </mesh>

          {/* Inner core sphere — crisp bright cyan */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#E0F7FF"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
