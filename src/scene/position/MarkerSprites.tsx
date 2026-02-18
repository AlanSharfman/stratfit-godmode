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

  // Focus band
  const FOCUS_NEAR = 6.5;
  const FOCUS_FAR = 18.0;

  // Beat pulse
  const PULSE_SPEED = 1.15;
  const PULSE_AMPLITUDE = active ? 0.07 : 0.05;

  // Label behaviour
  const LABEL_SHOW_THRESHOLD = 0.18;
  const LABEL_DAMP = 12.0;

  // Render order discipline (beam=1)
  const ORDER_MARKER = 3;
  const ORDER_LABEL = 4;

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
        depthTest: true, // realism: terrain can occlude marker if it truly should
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

  const labelAlpha = useRef(0);
  const labelLift = useRef(0);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);

    const dist = camera.position.distanceTo(worldPos);
    const focus = 1 - smoothstep(FOCUS_NEAR, FOCUS_FAR, dist);

    const pulse =
      focus > 0.001
        ? 1 + Math.sin(state.clock.elapsedTime * PULSE_SPEED) * PULSE_AMPLITUDE * focus
        : 1;

    const coreScale = (active ? 1.25 : 1.1) * (1 + 0.10 * focus) * pulse;
    const haloScale = (active ? 2.25 : 2.05) * (1 + 0.14 * focus) * pulse;

    if (coreRef.current) {
      coreRef.current.scale.set(coreScale, coreScale, 1);
      coreRef.current.renderOrder = ORDER_MARKER; // ✅ markers over beam
    }
    if (haloRef.current) {
      haloRef.current.scale.set(haloScale, haloScale, 1);
      haloRef.current.renderOrder = ORDER_MARKER; // ✅ halo also over beam
    }

    coreMat.opacity = THREE.MathUtils.lerp(active ? 0.92 : 0.86, 1.0, focus);
    haloMat.opacity = THREE.MathUtils.lerp(active ? 0.14 : 0.09, active ? 0.24 : 0.17, focus);

    const targetAlphaRaw = focus;
    const targetAlpha = targetAlphaRaw < LABEL_SHOW_THRESHOLD ? 0 : targetAlphaRaw;

    labelAlpha.current = damp(labelAlpha.current, targetAlpha, LABEL_DAMP, d);
    labelLift.current = damp(labelLift.current, focus, LABEL_DAMP, d);

    if (textRef.current) {
      const a = THREE.MathUtils.clamp(labelAlpha.current, 0, 1);
      textRef.current.fillOpacity = a;
      textRef.current.outlineOpacity = a;
      textRef.current.fontSize = THREE.MathUtils.lerp(0.0, 0.255, a);
      textRef.current.position.y = THREE.MathUtils.lerp(0.56, 0.70, labelLift.current);
      textRef.current.renderOrder = ORDER_LABEL; // ✅ label always over beam
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
