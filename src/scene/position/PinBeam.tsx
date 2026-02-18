import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";

type PinBeamProps = {
  start: [number, number, number];
  end: [number, number, number];
  intensity?: number; // baseline (will be modulated by distance)
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function PinBeam({ start, end, intensity = 0.55 }: PinBeamProps) {
  const { camera } = useThree();

  const endPos = useMemo(() => new THREE.Vector3(...end), [end]);

  const geometry = useMemo(() => {
    const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: "#38bdf8",
      transparent: true,
      opacity: intensity,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
  }, [intensity]);

  const lineRef = useRef<THREE.Line>(null);

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);

    // Distance-based discipline:
    // Beam is strongest when you're near the endpoint (marker zone),
    // fades gently as you move away to avoid competing with the trajectory.
    const dist = camera.position.distanceTo(endPos);

    const NEAR = 6.0;
    const FAR = 22.0;

    const focus = 1 - smoothstep(NEAR, FAR, dist);
    const targetOpacity = intensity * (0.35 + 0.65 * focus);

    // Smooth opacity changes (no popping)
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 1 - Math.exp(-8.0 * d));

    // Render order: keep subordinate to markers but above terrain
    if (lineRef.current) lineRef.current.renderOrder = 1;
  });

  return <line ref={lineRef} geometry={geometry} material={material} />;
}
