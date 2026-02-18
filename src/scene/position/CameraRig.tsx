import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Vec3 = THREE.Vector3;

function dampVec3(current: Vec3, target: Vec3, lambda: number, dt: number) {
  // Critically damped exponential smoothing.
  const t = 1 - Math.exp(-lambda * dt);
  current.lerp(target, t);
}

export default function CameraRig() {
  const { camera } = useThree();

  // LOCKED hero framing (safe defaults)
  const heroPos = useMemo(() => new THREE.Vector3(0, 3.9, 7.4), []);
  const heroTarget = useMemo(() => new THREE.Vector3(0.0, 0.55, 0.0), []);

  // Internal state (never re-alloc per frame)
  const pos = useRef(new THREE.Vector3());
  const tgt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Optional subtle breathing (disabled by default)
  const enableBreath = false;

  useFrame((state, dt) => {
    // Defensive dt clamp (prevents camera jump on tab refocus)
    const d = Math.min(dt, 1 / 30);

    if (!initialized.current) {
      pos.current.copy(camera.position);
      tgt.current.copy(heroTarget);
      initialized.current = true;
    }

    // Slight breathing (very subtle) — OFF unless explicitly enabled
    const breath = enableBreath ? Math.sin(state.clock.elapsedTime * 0.35) * 0.06 : 0;

    const targetPos = heroPos.clone().add(new THREE.Vector3(breath, 0, 0));
    const targetLook = heroTarget;

    // Position + target damping (camera authority)
    dampVec3(pos.current, targetPos, 6.5, d);
    dampVec3(tgt.current, targetLook, 8.5, d);

    camera.position.copy(pos.current);
    camera.lookAt(tgt.current);

    // Guardrails: prevent unwanted roll and keep vertical stable
    camera.up.set(0, 1, 0);
  });

  return null;
}
