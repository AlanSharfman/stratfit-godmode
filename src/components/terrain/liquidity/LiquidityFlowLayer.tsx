import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  terrainRef: React.RefObject<{ getHeightAt: (x: number, z: number) => number }>;
  enabled?: boolean;
}

export default function LiquidityFlowLayer({ terrainRef, enabled = true }: Props) {
  const lineRef = useRef<THREE.Line>(null);

  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-60, 0, -30),
      new THREE.Vector3(-20, 0, -5),
      new THREE.Vector3(10, 0, -20),
      new THREE.Vector3(40, 0, 0)
    ];
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  const points = useMemo(() => {
    if (!terrainRef?.current) return [] as THREE.Vector3[];

    return Array.from({ length: 60 }).map<THREE.Vector3>((_, i) => {
      const t = i / 59;
      const p = curve.getPoint(t);
      const y = terrainRef.current!.getHeightAt(p.x, p.z) + 0.4;
      return new THREE.Vector3(p.x, y, p.z);
    });
  }, [terrainRef, curve]);

  if (!enabled || points.length === 0) return null;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive
      object={
        (() => {
          const mat = new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.45 });
          return new THREE.Line(geometry, mat);
        })()
      }
      ref={lineRef}
    />
  );
}
