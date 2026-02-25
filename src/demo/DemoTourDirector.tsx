import React, { useEffect, useMemo, useRef, useState } from "react";
import { CameraControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { DemoStop } from "./DemoTourTypes";
import { demoStops } from "./demoStops";
import DemoOverlay from "./DemoOverlay";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import { snapPoint, type TerrainHost } from "@/terrain/TerrainHostContract";

type Phase = "idle" | "flag" | "ai";

type Props = {
  enabled: boolean;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
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

function isPerspectiveCamera(cam: THREE.Camera): cam is THREE.PerspectiveCamera {
  return (cam as THREE.PerspectiveCamera).isPerspectiveCamera === true;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

async function tweenFov(
  cam: THREE.PerspectiveCamera,
  from: number,
  to: number,
  durationMs: number,
  isCancelled: () => boolean
) {
  const start = performance.now();
  return new Promise<void>((resolve) => {
    const tick = () => {
      if (isCancelled()) return resolve();
      const now = performance.now();
      const t = clamp((now - start) / durationMs, 0, 1);
      const s = t * t * (3 - 2 * t); // smoothstep
      cam.fov = from + (to - from) * s;
      cam.updateProjectionMatrix();
      if (t >= 1) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/**
 * NASA-documentary voice profile.
 * Smooth, measured, authoritative female — slow cadence, slightly lowered pitch.
 * Priority: Google UK English Female → Microsoft Aria → Samantha → Karen →
 *           Moira → Microsoft Zira → any female → first English.
 */
function pickNasaVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const priority = [
    "Google UK English Female",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Aria",
    "Samantha",
    "Karen",
    "Moira",
    "Tessa",
    "Microsoft Zira Desktop",
    "Microsoft Zira",
    "Google US English",
  ];
  for (const name of priority) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  const femaleGuess = voices.find((v) => /female/i.test(v.name));
  if (femaleGuess) return femaleGuess;
  const en = voices.find((v) => v.lang.startsWith("en"));
  return en ?? voices[0] ?? null;
}

function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    // NASA documentary cadence — slow, awe-inspiring, clear female voice
    utter.rate   = 0.82;  // deliberate, like narrating deep space imagery
    utter.pitch  = 0.96;  // authoritative female — not robotic, not squeaky
    utter.volume = 1.0;

    // Chrome anti-jitter: nudge every 10s to prevent silent pause bug
    let keepAlive: ReturnType<typeof setInterval> | null = null;
    utter.onstart = () => {
      keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) { clearInterval(keepAlive!); return; }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10_000);
    };
    utter.onend   = () => { if (keepAlive) clearInterval(keepAlive); };
    utter.onerror = () => { if (keepAlive) clearInterval(keepAlive); };

    const applyAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const chosen = pickNasaVoice(voices);
      if (chosen) utter.voice = chosen;
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      applyAndSpeak();
    } else {
      // Voices not yet loaded — wait for the event (fires once on first call)
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        applyAndSpeak();
      };
    }
  } catch {
    // ignore — voice is non-critical
  }
}

export default function DemoTourDirector({ enabled, terrainRef, onFinished }: Props) {
  const controlsRef = useRef<CameraControls>(null!);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pulseKey, setPulseKey] = useState("init");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const anchorElRef = useRef<HTMLDivElement | null>(null);
  const [spotlight, setSpotlight] = useState<{ x: number; y: number; r: number } | null>(null);

  const stop: DemoStop | null = useMemo(() => {
    if (!enabled) return null;
    return demoStops[index] ?? null;
  }, [enabled, index]);

  useEffect(() => {
    if (!enabled) {
      setPhase("idle");
      setIndex(0);
      setPulseKey("reset");
      setSpotlight(null);
      try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch { /* ignore */ }
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !stop) return;

    let cancelled = false;
    const isCancelled = () => cancelled;

    async function computeSpotlight() {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const el = anchorElRef.current;
      if (!el || !stop) return;
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const rPx = stop.spotlightRadiusPx ?? 150;
      setSpotlight({ x, y, r: rPx });
    }

    async function runStop() {
      const controls = controlsRef.current;
      if (!controls || !stop) return;

      const host: TerrainHost | null = terrainRef.current
        ? { getHeightAt: terrainRef.current.getHeightAt }
        : null;

      const lookAtP = host ? snapPoint(host, stop.camLookAt, 0.9) : stop.camLookAt;
      const camPos = v3(stop.camPos);
      const lookAt = v3(lookAtP);

      controls.smoothTime = 0.35;
      controls.dollySpeed = 0.0;
      controls.truckSpeed = 0.0;

      const cam = controls.camera;
      let baseFov = 42;
      if (isPerspectiveCamera(cam)) {
        baseFov = stop.fov ?? cam.fov ?? 42;
        cam.fov = baseFov;
        cam.updateProjectionMatrix();
      }

      setPhase("idle");
      setSpotlight(null);

      await controls.setLookAt(
        camPos.x, camPos.y, camPos.z,
        lookAt.x, lookAt.y, lookAt.z,
        true
      );
      if (isCancelled()) return;

      await new Promise((r) => setTimeout(r, DURATIONS.settle));
      if (isCancelled()) return;

      await computeSpotlight();
      if (isCancelled()) return;

      setPhase("flag");
      setPulseKey(`${stop.id}-${Date.now()}`);

      if (isPerspectiveCamera(cam)) {
        const delta = stop.zoomInFovDelta ?? 4;
        const target = clamp(baseFov - delta, 26, baseFov);
        await tweenFov(cam, baseFov, target, 1100, isCancelled);
        if (isCancelled()) return;
      }

      await new Promise((r) => setTimeout(r, DURATIONS.holdFlag));
      if (isCancelled()) return;

      setPhase("ai");

      if (voiceEnabled) {
        speak(`${stop.title}. ${stop.ai.what}`);
      }

      await new Promise((r) => setTimeout(r, DURATIONS.ai));
      if (isCancelled()) return;

      if (isPerspectiveCamera(cam)) {
        const current = cam.fov;
        await tweenFov(cam, current, baseFov, 700, isCancelled);
        if (isCancelled()) return;
      }

      setPhase("flag");
      await new Promise((r) => setTimeout(r, DURATIONS.fadeGap));
      if (isCancelled()) return;

      setPhase("idle");
      setSpotlight(null);
      await new Promise((r) => setTimeout(r, DURATIONS.between));
      if (isCancelled()) return;

      const next = index + 1;
      if (next >= demoStops.length) {
        setPhase("idle");
        setSpotlight(null);
        onFinished?.();
        return;
      }
      setIndex(next);
    }

    runStop();
    return () => { cancelled = true; };
  }, [enabled, stop, index, onFinished, terrainRef, voiceEnabled]);

  const snappedAnchor = useMemo(() => {
    if (!stop) return null;
    const host = terrainRef.current ? { getHeightAt: terrainRef.current.getHeightAt } : null;
    return host ? snapPoint(host, stop.anchor, 1.0) : stop.anchor;
  }, [stop, terrainRef]);

  return (
    <>
      <CameraControls ref={controlsRef} makeDefault />

      {enabled && snappedAnchor && (
        <Html position={[snappedAnchor.x, snappedAnchor.y, snappedAnchor.z]} center>
          <div
            ref={(el) => { anchorElRef.current = el; }}
            style={{ width: 12, height: 12, borderRadius: 999, background: "rgba(0,224,255,0.0)", pointerEvents: "none" }}
          />
        </Html>
      )}

      <Html fullscreen style={{ pointerEvents: "none" }}>
        <DemoOverlay
          activeStop={stop}
          phase={phase}
          pulseKey={pulseKey}
          spotlight={spotlight}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
        />
      </Html>
    </>
  );
}
