import React, { useMemo } from "react";
import * as THREE from "three";

export default function ShadowCatcherFloor() {
  const mat = useMemo(() => {
    // ShadowMaterial is literally designed for this:
    // it renders ONLY shadows, letting your background show through.
    const m = new THREE.ShadowMaterial({
      opacity: 0.28, // tune 0.18–0.35
    });
    return m;
  }, []);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -2.2, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
