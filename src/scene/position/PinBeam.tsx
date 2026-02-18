import * as THREE from "three";
import { useMemo } from "react";

type PinBeamProps = {
  start: [number, number, number];
  end: [number, number, number];
  intensity?: number;
};

export default function PinBeam({ start, end, intensity = 0.65 }: PinBeamProps) {
  const geometry = useMemo(() => {
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: intensity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [intensity]
  );

  return <line geometry={geometry} material={material} renderOrder={2} />;
}
