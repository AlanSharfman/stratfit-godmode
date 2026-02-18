import { Billboard, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type MarkerProps = {
  position: [number, number, number];
  label: string;
  active?: boolean;
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export default function MarkerSprites({ position, label, active }: MarkerProps) {
  const { camera } = useThree();

  // --- TUNABLES (composition-grade defaults) ---
  const FOCUS_NEAR = 6.5; // start emphasis when closer than this
  const FOCUS_FAR = 18.0; // fade emphasis by this distance
  const PULSE_SPEED = 1.15;
  const PULSE_AMPLITUDE = active ? 0.07 : 0.05; // subtle (do not look "gamey")

  const baseColor = active ? "#7dd3fc" : "#c7d2fe";
  const haloColor = "#38bdf8";

  const worldPos = useMemo(() => new THREE.Vector3(...position), [position]);

  const coreMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: true,
      }),
    [baseColor]
  );

  const haloMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        color: haloColor,
        transparent: true,
        opacity: active ? 0.18 : 0.12,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [active]
  );

  const coreRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const textRef = useRef<any>(null);

  useFrame((state, dt) => {
    // Defensive clamp (prevents spikes on tab refocus)
    const d = Math.min(dt, 1 / 30);

    const dist = camera.position.distanceTo(worldPos);

    // focus = 1 in focus band, 0 outside (smooth)
    // We want emphasis when closer; fade out as distance increases.
    const focus = 1 - smoothstep(FOCUS_NEAR, FOCUS_FAR, dist);

    // Micro pulse only when focused; otherwise stable
    const pulse = focus > 0.001 ? 1 + Math.sin(state.clock.elapsedTime * PULSE_SPEED) * PULSE_AMPLITUDE * focus : 1;

    // Scale discipline (do not inflate UI)
    const coreScale = (active ? 1.25 : 1.1) * (1 + 0.10 * focus) * pulse;
    const haloScale = (active ? 2.25 : 2.05) * (1 + 0.14 * focus) * pulse;

    if (coreRef.current) coreRef.current.scale.set(coreScale, coreScale, 1);
    if (haloRef.current) haloRef.current.scale.set(haloScale, haloScale, 1);

    // Opacity lift in focus band (halo remains subordinate)
    coreMat.opacity = THREE.MathUtils.lerp(active ? 0.95 : 0.88, 1.0, focus);
    haloMat.opacity = THREE.MathUtils.lerp(active ? 0.16 : 0.10, active ? 0.26 : 0.18, focus);

    // Label readability: slightly larger + higher contrast only in focus band
    if (textRef.current) {
      textRef.current.fillOpacity = THREE.MathUtils.lerp(0.78, 1.0, focus);
      textRef.current.outlineOpacity = THREE.MathUtils.lerp(0.85, 1.0, focus);
      textRef.current.fontSize = THREE.MathUtils.lerp(0.22, 0.255, focus);
    }

    // Ensure materials update smoothly without realloc
    // (opacity changes propagate automatically)
    void d;
  });

  return (
    <Billboard position={position} follow>
      <sprite ref={haloRef} material={haloMat} />
      <sprite ref={coreRef} material={coreMat} />

      <Text
        ref={textRef}
        position={[0, 0.62, 0]}
        fontSize={0.22}
        color={baseColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#020617"
      >
        {label}
      </Text>
    </Billboard>
  );
}
