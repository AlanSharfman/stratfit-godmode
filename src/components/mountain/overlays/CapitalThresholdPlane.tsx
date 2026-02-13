import React from "react";

export default function CapitalThresholdPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#0A2B35" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
}
