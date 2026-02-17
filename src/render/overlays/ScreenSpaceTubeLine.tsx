import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp, worldUnitsPerPixel } from "./screenSpace";

type Props = {
  points: THREE.Vector3[];
  thicknessPx?: number;     // perceived thickness on screen
  liftY?: number;           // avoid merge into terrain wireframe
  color?: string;
  opacity?: number;
  tubularSegments?: number;
  radiusMin?: number;
  radiusMax?: number;
  renderOrder?: number;
};

export function ScreenSpaceTubeLine({
  points,
  thicknessPx = 5.0,         // Mode B default
  liftY = 0.14,
  color = "#EAFBFF",
  opacity = 0.94,
  tubularSegments = 256,
  radiusMin = 0.012,
  radiusMax = 0.28,
  renderOrder = 80,
}: Props) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(p.x, p.y + liftY, p.z));
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.0);
  }, [points, liftY]);

  const geom = useMemo(() => {
    // base radius used only as a scaling reference (we scale every frame)
    return new THREE.TubeGeometry(curve, tubularSegments, 0.05, 12, false);
  }, [curve, tubularSegments]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const mid = curve.getPoint(0.5);
    const dist = camera.position.distanceTo(mid);

    const hPx = gl.domElement?.clientHeight ?? 900;
    const wuPerPx = worldUnitsPerPixel(camera, dist, hPx);

    // radius = (diameterPx * wuPerPx) / 2
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
        depthWrite={false}
        depthTest
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-3}
        polygonOffsetUnits={-3}
      />
    </mesh>
  );
}
