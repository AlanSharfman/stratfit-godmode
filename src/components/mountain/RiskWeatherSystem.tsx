// src/components/mountain/RiskWeatherSystem.tsx
// ═══════════════════════════════════════════════════════════════════════════
// PHASE 230 — Risk Weather System (Controller)
//
// Reads engineResults.timeline[currentStep] from studioTimelineStore.
// Orchestrates: fog density, turbulence intensity, storm spawn,
//               lightning events, and camera shake.
//
// Performance limits:
//   - Max 4 storm cells (enforced in RiskStorm)
//   - Turbulence disabled if FPS < 45
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { useTerrainControls } from "@/terrain/useTerrainControls";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";

import RiskFogLayer from "@/components/mountain/RiskFogLayer";
import RiskTurbulence from "@/components/mountain/RiskTurbulence";
import RiskStorm from "@/components/mountain/RiskStorm";
import RiskLightning from "@/components/mountain/RiskLightning";

// ── FPS tracking for performance safety ──
const FPS_SAMPLE_WINDOW = 30;
const FPS_DISABLE_THRESHOLD = 45;

// ── Camera shake config ──
const SHAKE_MAGNITUDE = 0.2;
const SHAKE_DURATION = 0.2; // seconds

export default function RiskWeatherSystem() {
  // ── Store state ──
  const engineResults = useStudioTimelineStore((s) => s.engineResults);
  const currentStep = useStudioTimelineStore((s) => s.currentStep);

  // ── FPS tracking ──
  const fpsFrames = useRef<number[]>([]);
  const [turbulenceEnabled, setTurbulenceEnabled] = useState(true);

  // ── Camera shake ──
  const controls = useTerrainControls((s) => s.controls);
  const shakeTimer = useRef(0);
  const shakeActive = useRef(false);
  const originalTarget = useRef<{ x: number; y: number; z: number } | null>(null);

  // ── Current step data ──
  const timeline = engineResults?.timeline ?? [];
  const currentPoint = timeline[currentStep] ?? null;
  const riskIndex = currentPoint?.riskIndex ?? 0;

  // ── Lightning position: near current step on terrain ──
  const stepCount = timeline.length;
  const currentT = stepCount > 1 ? currentStep / (stepCount - 1) : 0.5;
  const lightningX = (currentT - 0.5) * TERRAIN_CONSTANTS.width * 0.7;
  const lightningZ = 0;

  // ── Camera shake handler ──
  const triggerShake = useCallback(() => {
    if (!controls) return;
    shakeActive.current = true;
    shakeTimer.current = SHAKE_DURATION;
    if (!originalTarget.current) {
      originalTarget.current = {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z,
      };
    }
  }, [controls]);

  // ── Frame loop: FPS monitor + camera shake ──
  useFrame((_state, delta) => {
    // FPS tracking
    const fps = delta > 0 ? 1 / delta : 60;
    fpsFrames.current.push(fps);
    if (fpsFrames.current.length > FPS_SAMPLE_WINDOW) {
      fpsFrames.current.shift();
    }
    if (fpsFrames.current.length === FPS_SAMPLE_WINDOW) {
      const avgFps =
        fpsFrames.current.reduce((a, b) => a + b, 0) / FPS_SAMPLE_WINDOW;
      const shouldEnable = avgFps >= FPS_DISABLE_THRESHOLD;
      if (shouldEnable !== turbulenceEnabled) {
        setTurbulenceEnabled(shouldEnable);
      }
    }

    // Camera shake
    if (shakeActive.current && controls && originalTarget.current) {
      shakeTimer.current -= delta;
      if (shakeTimer.current <= 0) {
        // Restore
        controls.target.set(
          originalTarget.current.x,
          originalTarget.current.y,
          originalTarget.current.z,
        );
        shakeActive.current = false;
        originalTarget.current = null;
      } else {
        const progress = shakeTimer.current / SHAKE_DURATION;
        const intensity = SHAKE_MAGNITUDE * progress;
        controls.target.set(
          originalTarget.current.x + (Math.random() - 0.5) * intensity * 2,
          originalTarget.current.y + (Math.random() - 0.5) * intensity,
          originalTarget.current.z + (Math.random() - 0.5) * intensity * 2,
        );
      }
    }
  });

  // No engine data → render nothing
  if (!engineResults || timeline.length === 0) return null;

  return (
    <group>
      {/* Step 1: Risk Fog Layer */}
      <RiskFogLayer riskIndex={riskIndex} />

      {/* Step 2: Turbulence Bands (disabled if FPS < 45) */}
      <RiskTurbulence riskIndex={riskIndex} enabled={turbulenceEnabled} />

      {/* Step 3: Storm Cells (max 4, threshold 0.65) */}
      <RiskStorm timeline={timeline} />

      {/* Step 4: Lightning Events (threshold 0.85, 120ms flash, camera shake) */}
      <RiskLightning
        riskIndex={riskIndex}
        worldX={lightningX}
        worldZ={lightningZ}
        onStrike={triggerShake}
      />
    </group>
  );
}
