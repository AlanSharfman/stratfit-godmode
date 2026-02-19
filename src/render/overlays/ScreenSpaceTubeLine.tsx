import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp, worldUnitsPerPixel } from "./screenSpace";
import { useEffect } from "react";

type Props = {
  points: THREE.Vector3[];
  thicknessPx?: number;
  liftY?: number;
  color?: string;
  opacity?: number;
  tubularSegments?: number;
  radiusMin?: number;
  radiusMax?: number;
  renderOrder?: number;
};

export function ScreenSpaceTubeLine({
  points,
  thicknessPx = 8.0,
  liftY = 0.22,
  color = "#EAFBFF",
  opacity = 0.98,
  tubularSegments = 256,
  radiusMin = 0.02,
  radiusMax = 0.6,
  renderOrder = 180,
}: Props) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(p.x, p.y + liftY, p.z));
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.0);
  }, [points, liftY]);

  const geom = useMemo(() => {
    return new THREE.TubeGeometry(curve, tubularSegments, 0.05, 12, false);
  }, [curve, tubularSegments]);

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const mid = curve.getPoint(0.5);
    const dist = camera.position.distanceTo(mid);

    const hPx = gl.domElement?.clientHeight ?? 900;
    const wuPerPx = worldUnitsPerPixel(camera, dist, hPx);

    const targetRadius = clamp((thicknessPx * wuPerPx) * 0.5, radiusMin, radiusMax);

    const baseRadius = 0.05;
    const s = targetRadius / baseRadius;
    mesh.scale.set(s, s, s);
  });

  return (
    <mesh ref={meshRef} geometry={geom} renderOrder={renderOrder}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
