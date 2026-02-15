import React, { useEffect, useMemo, useRef, useState } from "react";
import { CameraControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { DemoStop } from "./DemoTourTypes";
import { demoStops } from "./demoStops";
import DemoOverlay from "./DemoOverlay";

type Phase = "idle" | "flag" | "ai";

type Props = {
  enabled: boolean;
  onFinished?: () => void;
};

const DURATIONS = {
  travel: 1800,
  settle: 700,
  holdFlag: 5000,
  ai: 5500,
  fadeGap: 600,
  between: 400,
} as const;

function v3(p: { x: number; y: number; z: number }) {
  return new THREE.Vector3(p.x, p.y, p.z);
}

export default function DemoTourDirector({ enabled, onFinished }: Props) {
  const controlsRef = useRef<CameraControls>(null!);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pulseKey, setPulseKey] = useState("init");

  const stop: DemoStop | null = useMemo(() => {
    if (!enabled) return null;
    return demoStops[index] ?? null;
  }, [enabled, index]);

  useEffect(() => {
    if (!enabled) {
      setPhase("idle");
      setIndex(0);
      setPulseKey("reset");
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !stop) return;

    let cancelled = false;

    async function runStop() {
      const controls = controlsRef.current;
      if (!controls || !stop) return;

      // Ensure consistent "institutional" camera behavior
      controls.smoothTime = 0.35;
      controls.dollySpeed = 0.0;
      controls.truckSpeed = 0.0;

      const camPos = v3(stop.camPos);
      const lookAt = v3(stop.camLookAt);

      // Travel
      setPhase("idle");
      await controls.setLookAt(
        camPos.x, camPos.y, camPos.z,
        lookAt.x, lookAt.y, lookAt.z,
        true
      );
      if (cancelled) return;

      // Settle
      await new Promise((r) => setTimeout(r, DURATIONS.settle));
      if (cancelled) return;

      // Flag phase (HOLD 5s MINIMUM)
      setPhase("flag");
      setPulseKey(`${stop.id}-${Date.now()}`);
      await new Promise((r) => setTimeout(r, DURATIONS.holdFlag));
      if (cancelled) return;

      // AI rollout
      setPhase("ai");
      await new Promise((r) => setTimeout(r, DURATIONS.ai));
      if (cancelled) return;

      // Fade gap
      setPhase("flag");
      await new Promise((r) => setTimeout(r, DURATIONS.fadeGap));
      if (cancelled) return;

      // Next
      setPhase("idle");
      await new Promise((r) => setTimeout(r, DURATIONS.between));
      if (cancelled) return;

      const next = index + 1;
      if (next >= demoStops.length) {
        setPhase("idle");
        onFinished?.();
        return;
      }
      setIndex(next);
    }

    runStop();

    return () => {
      cancelled = true;
    };
  }, [enabled, stop, index, onFinished]);

  return (
    <>
      <CameraControls
        ref={controlsRef}
        makeDefault
      />
      {/* Html fullscreen portals the overlay into the DOM above the Canvas */}
      <Html fullscreen style={{ pointerEvents: "none" }}>
        <DemoOverlay
          activeStop={stop}
          phase={phase}
          pulseKey={pulseKey}
        />
      </Html>
    </>
  );
}
