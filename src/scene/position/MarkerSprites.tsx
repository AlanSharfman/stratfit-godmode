import { Billboard, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type MarkerProps = {
  position: [number, number, number];
  label: string;
  active?: boolean;
};

export default function MarkerSprites({ position, label, active }: MarkerProps) {
  const color = active ? "#7dd3fc" : "#cbd5f5";

  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        color,
        depthWrite: false,
        depthTest: true,
        transparent: true,
        opacity: active ? 1 : 0.85,
      }),
    [color, active]
  );

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <sprite material={material} scale={active ? 1.6 : 1.2} />

      <Text
        position={[0, 0.6, 0]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#020617"
      >
        {label}
      </Text>
    </Billboard>
  );
}
