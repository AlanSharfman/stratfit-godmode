import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type Vec3 = [number, number, number];

type Props = {
  points: Vec3[];
  color?: string;
  radius?: number;
  opacity?: number;
  flow?: boolean;
};

export default function FinancialTrajectory({
  points,
  color = "#6FE7FF",
  radius = 0.04,
  opacity = 0.85,
  flow = true,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const geometry = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));

    // Smooth realistic curve
    const curve = new THREE.CatmullRomCurve3(vecs, false, "catmullrom", 0.5);

    return new THREE.TubeGeometry(curve, 120, radius, 12, false);
  }, [points, radius]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.25,
      depthWrite: false,
    });
    return mat;
  }, [color, opacity]);

  // Flow pulse animation
  useFrame(() => {
    if (!flow) return;
    if (!meshRef.current) return;

    const t = performance.now() * 0.001;
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.35 + Math.sin(t * 2.5) * 0.08;
  });

  if (!points || points.length < 2) return null;

  return <mesh ref={meshRef} geometry={geometry} material={material} renderOrder={56} />;
}
