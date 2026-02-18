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

function damp(current: number, target: number, lambda: number, dt: number) {
  const t = 1 - Math.exp(-lambda * dt);
  return THREE.MathUtils.lerp(current, target, t);
}

export default function MarkerSprites({ position, label, active }: MarkerProps) {
  const { camera } = useThree();

  // --- Focus band (must match the Narrative Emphasis intent) ---
  const FOCUS_NEAR = 6.5;
  const FOCUS_FAR = 18.0;

  // Beat pulse (subtle)
  const PULSE_SPEED = 1.15;
  const PULSE_AMPLITUDE = active ? 0.07 : 0.05;

  // Label behaviour (focus-only)
  const LABEL_SHOW_THRESHOLD = 0.18; // below this, label effectively off
  const LABEL_DAMP = 12.0;

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
        opacity: active ? 0.16 : 0.10,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [active]
  );

  const coreRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const textRef = useRef<any>(null);

  // Smoothed label state (prevents pop)
  const labelAlpha = useRef(0);
  const labelLift = useRef(0);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);

    const dist = camera.position.distanceTo(worldPos);
    const focus = 1 - smoothstep(FOCUS_NEAR, FOCUS_FAR, dist);

    // Micro pulse only when focused
    const pulse =
      focus > 0.001
        ? 1 + Math.sin(state.clock.elapsedTime * PULSE_SPEED) * PULSE_AMPLITUDE * focus
        : 1;

    // Scales (disciplined)
    const coreScale = (active ? 1.25 : 1.1) * (1 + 0.10 * focus) * pulse;
    const haloScale = (active ? 2.25 : 2.05) * (1 + 0.14 * focus) * pulse;

    if (coreRef.current) coreRef.current.scale.set(coreScale, coreScale, 1);
    if (haloRef.current) haloRef.current.scale.set(haloScale, haloScale, 1);

    // Opacity lift in focus band
    coreMat.opacity = THREE.MathUtils.lerp(active ? 0.92 : 0.86, 1.0, focus);
    haloMat.opacity = THREE.MathUtils.lerp(active ? 0.14 : 0.09, active ? 0.24 : 0.17, focus);

    // ---- Focus-band-only label logic ----
    // Gate: outside focus band, labels should essentially disappear.
    const targetAlphaRaw = focus; // 0..1
    const targetAlpha = targetAlphaRaw < LABEL_SHOW_THRESHOLD ? 0 : targetAlphaRaw;

    labelAlpha.current = damp(labelAlpha.current, targetAlpha, LABEL_DAMP, d);
    labelLift.current = damp(labelLift.current, focus, LABEL_DAMP, d);

    if (textRef.current) {
      // Alpha and size
      const a = THREE.MathUtils.clamp(labelAlpha.current, 0, 1);
      textRef.current.fillOpacity = a;
      textRef.current.outlineOpacity = a;

      // Slight size lift only when relevant
      textRef.current.fontSize = THREE.MathUtils.lerp(0.0, 0.255, a);

      // Vertical lift: small, controlled (no floaty UI)
      textRef.current.position.y = THREE.MathUtils.lerp(0.56, 0.70, labelLift.current);

      // Keep text color stable (no flicker)
      textRef.current.color = baseColor;

      // If alpha is near-zero, keep it non-intrusive
      // (fontSize already near 0, opacity near 0)
    }
  });

  return (
    <Billboard position={position} follow>
      <sprite ref={haloRef} material={haloMat} />
      <sprite ref={coreRef} material={coreMat} />

      <Text
        ref={textRef}
        position={[0, 0.62, 0]}
        fontSize={0.0}
        color={baseColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#020617"
        fillOpacity={0}
        outlineOpacity={0}
      >
        {label}
      </Text>
    </Billboard>
  );
}
