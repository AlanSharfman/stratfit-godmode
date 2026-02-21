import { useMemo } from "react";
import { positionMarkers } from "./markerData";
import { PositionMarker } from "@/types/positionMarkers";

interface Props {
  terrainRef: React.RefObject<{ getHeightAt: (x: number, z: number) => number }>;
  enabled?: boolean;
}

/**
 * MarkerLayer — Hazard beacon markers.
 * Each marker: saturated burnt-orange sphere + volumetric halo glow.
 * toneMapped={false} for Bloom punch-through.
 */
export default function MarkerLayer({ terrainRef, enabled = true }: Props) {
  const meshes = useMemo(() => {
    if (!terrainRef?.current) return [];

    return positionMarkers.map((m: PositionMarker) => {
      const y = terrainRef.current!.getHeightAt(m.x, m.z) + 0.25;
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
              color="#1a0a00"
              emissive="#FF7043"
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Outer halo glow — volumetric burnt-orange sphere */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.65, 16, 16]} />
            <meshStandardMaterial
              color="#BF360C"
              emissive="#FF7043"
              emissiveIntensity={2.0}
              toneMapped={false}
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>

          {/* Inner core sphere — saturated burnt orange */}
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color="#FF7043"
              emissive="#FFAB91"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
