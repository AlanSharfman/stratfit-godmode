import { Billboard, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

type MarkerProps = {
  position: [number, number, number];
  label: string;
  active?: boolean;
};

export default function MarkerSprites({ position, label, active }: MarkerProps) {
  const { camera } = useThree();

  const color = active ? "#7dd3fc" : "#a5b4fc";

  const material = useMemo(() => {
    return new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
  }, [color]);

  const haloMaterial = useMemo(() => {
    return new THREE.SpriteMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: active ? 0.35 : 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [active]);

  const distance = camera.position.distanceTo(new THREE.Vector3(...position));
  const scale = active ? 1.6 : 1.2;
  const falloff = THREE.MathUtils.clamp(8 / distance, 0.6, 1.2);

  return (
    <Billboard position={position} follow>
      {/* Halo */}
      <sprite material={haloMaterial} scale={scale * 2 * falloff} />

      {/* Core */}
      <sprite material={material} scale={scale * falloff} />

      <Text
        position={[0, 0.65, 0]}
        fontSize={0.26 * falloff}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.018}
        outlineColor="#020617"
      >
        {label}
      </Text>
    </Billboard>
  );
}
