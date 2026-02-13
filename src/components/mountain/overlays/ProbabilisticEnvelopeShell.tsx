import React, { useMemo } from "react";
import * as THREE from "three";

type Props = {
  geometry: THREE.BufferGeometry;
  strength?: number;
};

export default function ProbabilisticEnvelopeShell({ geometry, strength = 0.35 }: Props) {
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: "#7C7CFF",
      transparent: true,
      opacity: 0.08,
      roughness: 0.1,
      metalness: 0.0,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      depthWrite: false,
    });
  }, []);

  // NOTE: terrain object-space uses Z as height; inflate vertically.
  return <mesh geometry={geometry} material={material} scale={[1, 1, 1 + strength]} renderOrder={40} />;
}
