import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Vec3 = THREE.Vector3;

function dampVec3(current: Vec3, target: Vec3, lambda: number, dt: number) {
  const t = 1 - Math.exp(-lambda * dt);
  current.lerp(target, t);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function getQueryFlag(name: string): boolean {
  try {
    const v = new URLSearchParams(window.location.search).get(name);
    return v === "1" || v === "true" || v === "yes";
  } catch {
    return false;
  }
}

export default function CameraRig() {
  const { camera } = useThree();

  // Locked hero framing (product default)
  const heroPos = useMemo(() => new THREE.Vector3(0, 3.9, 7.4), []);
  const heroTarget = useMemo(() => new THREE.Vector3(0.0, 0.55, 0.0), []);

  // Demo mode (opt-in)
  const demoMode = useMemo(() => getQueryFlag("demo"), []);
  const enableBreath = useMemo(() => getQueryFlag("breath"), []);

  // Demo sweep start pose (slightly wider + higher = cinematic reveal)
  const demoStartPos = useMemo(() => new THREE.Vector3(-0.9, 4.7, 9.6), []);
  const demoStartTarget = useMemo(() => new THREE.Vector3(-0.25, 0.75, 0.0), []);

  // Sweep timing (hard stop)
  const SWEEP_SECONDS = 2.1;

  const pos = useRef(new THREE.Vector3());
  const tgt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const sweepT = useRef(0);
  const sweepDone = useRef(false);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);

    if (!initialized.current) {
      // Initialize from current camera pose to avoid any snap
      pos.current.copy(camera.position);

      // If demo mode, start closer to demoStart immediately (still damped)
      if (demoMode) {
        pos.current.copy(demoStartPos);
        tgt.current.copy(demoStartTarget);
        sweepT.current = 0;
        sweepDone.current = false;
      } else {
        tgt.current.copy(heroTarget);
        sweepDone.current = true; // no sweep in product mode
      }

      initialized.current = true;
    }

    // Optional micro-breath (ONLY if explicitly enabled via query)
    const breath = enableBreath ? Math.sin(state.clock.elapsedTime * 0.35) * 0.06 : 0;

    // Determine target pose
    let desiredPos = heroPos.clone().add(new THREE.Vector3(breath, 0, 0));
    let desiredTgt = heroTarget;

    // Demo sweep-in: interpolate from demoStart -> hero for a fixed duration, then hard stop
    if (demoMode && !sweepDone.current) {
      sweepT.current += d;
      const tNorm = THREE.MathUtils.clamp(sweepT.current / SWEEP_SECONDS, 0, 1);
      const tEase = easeOutCubic(tNorm);

      desiredPos = demoStartPos.clone().lerp(heroPos, tEase);
      desiredTgt = demoStartTarget.clone().lerp(heroTarget, tEase);

      if (tNorm >= 1) {
        sweepDone.current = true;
        // After sweep completes, snap the internal state to the hero pose (prevents micro drift)
        pos.current.copy(heroPos);
        tgt.current.copy(heroTarget);
      }
    }

    // Product mode: damp to hero and hold stable
    // Demo mode after sweep: hold stable (no float) unless breath explicitly enabled
    const lambdaPos = demoMode ? (sweepDone.current ? 12.0 : 6.5) : 6.5;
    const lambdaTgt = demoMode ? (sweepDone.current ? 14.0 : 8.5) : 8.5;

    dampVec3(pos.current, desiredPos, lambdaPos, d);
    dampVec3(tgt.current, desiredTgt, lambdaTgt, d);

    camera.position.copy(pos.current);
    camera.lookAt(tgt.current);

    // Guardrails
    camera.up.set(0, 1, 0);
  });

  return null;
}
