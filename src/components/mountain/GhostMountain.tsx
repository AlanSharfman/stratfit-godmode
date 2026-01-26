// src/components/mountain/GhostMountain.tsx
// STRATFIT — Ghost Mountain (previous scenario snapshot)
// Rules:
// - Wireframe only
// - Cyan/ice-blue only
// - No animation beyond fade-out (~700ms)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function GhostMountain(props: {
  geometry: THREE.PlaneGeometry;
  durationMs?: number;
  color?: string;
  opacityStart?: number;
  onDone?: () => void;
}) {
  const {
    geometry,
    durationMs = 700,
    color = "rgba(34,211,238,0.55)",
    opacityStart = 0.45,
    onDone,
  } = props;

  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);
  const [alive, setAlive] = useState(true);

  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    setAlive(true);
    startRef.current = null;
  }, [geometry]);

  useFrame((state) => {
    if (!alive) return;
    if (!matRef.current) return;
    if (startRef.current === null) startRef.current = state.clock.elapsedTime * 1000;
    const t0 = startRef.current;
    const t = state.clock.elapsedTime * 1000 - t0;
    const p = Math.max(0, Math.min(1, t / durationMs));
    const o = opacityStart * (1 - p);
    matRef.current.opacity = o;
    matRef.current.needsUpdate = true;
    if (p >= 1) {
      setAlive(false);
      onDone?.();
    }
  });

  if (!geometry || !alive) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        ref={matRef}
        wireframe
        transparent
        opacity={opacityStart}
        color={threeColor}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

