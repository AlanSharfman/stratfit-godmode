import { useMemo } from "react";
import { positionMarkers } from "./markerData";
import { PositionMarker } from "@/types/positionMarkers";

interface Props {
  terrainRef: React.RefObject<{ getHeightAt: (x: number, z: number) => number }>;
  enabled?: boolean;
}

export default function MarkerLayer({ terrainRef, enabled = true }: Props) {
  const meshes = useMemo(() => {
    if (!terrainRef?.current) return [];

    return positionMarkers.map((m: PositionMarker) => {
      const y = terrainRef.current!.getHeightAt(m.x, m.z) + 1.6;
      return { ...m, y };
    });
  }, [terrainRef]);

  if (!enabled) return null;

  return (
    <group>
      {meshes.map(m => (
        <group key={m.id} position={[m.x, m.y, m.z]}>
          {/* vertical post */}
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
            <meshStandardMaterial
              color="#0f1720"
              emissive="#0ea5e9"
              emissiveIntensity={0.35}
            />
          </mesh>

          {/* head cap */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#22d3ee"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
