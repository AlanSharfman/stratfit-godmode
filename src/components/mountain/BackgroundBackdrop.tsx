import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

type Props = {
  url: string;             // your existing background mountain image
  opacity?: number;        // 0..1 (recommend 0.28–0.42)
  tint?: string;           // dark teal tint to unify palette
  position?: [number, number, number];
  scale?: [number, number, number];
};

export default function BackgroundBackdrop({
  url,
  opacity = 0.34,
  tint = "#07161c",
  position = [0, 1.25, -6.0],
  scale = [14, 7.6, 1],
}: Props) {
  const tex = useLoader(THREE.TextureLoader, url);

  const mat = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;

    // "Atmosphere plate": multiply-ish look by tinting
    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      color: new THREE.Color(tint),
      blending: THREE.MultiplyBlending,
      depthWrite: false,
    });
  }, [tex, opacity, tint]);

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
