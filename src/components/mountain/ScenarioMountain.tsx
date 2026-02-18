/**
 * 🚨 STRATFIT CANONICAL MOUNTAIN — DO NOT MODIFY 🚨
 *
 * This file defines the mountain’s:
 * - Vertical amplitude
 * - Noise fields
 * - Silhouette
 * - Peak behaviour
 *
 * ❌ NO height clamping
 * ❌ NO normalisation
 * ❌ NO container-based scaling
 * ❌ NO UI-driven constraints
 *
 * Any layout or KPI changes MUST happen outside this system.
 */

// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — Stable Mountain with Atmospheric Haze

import React, { useMemo, useRef, useLayoutEffect, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Line as DreiLine, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { NeuralBackground } from "@/components/visuals/NeuralBackground";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { Scenario, ScenarioId, useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";
import { useSimulationStore } from "@/state/simulationStore";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { setStructuralHeatTint } from "@/logic/mountain/mountainSurfaceMaterial";

// ============================================================================
// MODE CONFIG
// ============================================================================

interface ModeConfig {
  terrainOpacity: number;
  wireframeOpacity: number;
  glowMultiplier: number;
  colorSaturation: number;
  animationSpeed: number;
  pulseEnabled: boolean;
  hazeOpacity: number;
  pathGlow: number;
  bloomIntensity: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  // Strategy-mode simulation-space calibration (optional — only set on strategy)
  visualDepthBoost?: number;
  pathCutBoost?: number;
  fogNear?: number;
  fogFar?: number;
  fogColor?: string;
  trajectoryHaloOpacity?: number;
  trajectoryHaloWidthMult?: number;
  forwardTargetZ?: number;
  forwardCamZMult?: number;
  divergenceOverlay?: boolean;
  divergenceOpacity?: number;
  divergenceColor?: string;
}

type MountainMode = "default" | "celebration" | "ghost" | "instrument" | "baseline" | "strategy";

const MODE_CONFIGS: Record<MountainMode, ModeConfig> = {
  default: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: false,
    autoRotateSpeed: 0,
  },
  celebration: {
    terrainOpacity: 1,
    wireframeOpacity: 0.8,
    glowMultiplier: 2.5,
    colorSaturation: 1.2,
    animationSpeed: 0.5,
    pulseEnabled: true,
    hazeOpacity: 0.15,
    pathGlow: 3,
    bloomIntensity: 0.8,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  ghost: {
    terrainOpacity: 0.15,
    wireframeOpacity: 0.1,
    glowMultiplier: 0,
    colorSaturation: 0.3,
    animationSpeed: 0.2,
    pulseEnabled: false,
    hazeOpacity: 0,
    pathGlow: 0.3,
    bloomIntensity: 0,
    autoRotate: false,
    autoRotateSpeed: 0,
  },
  // INSTRUMENT — Compact diagnostic terrain for Initialize page
  // Mesh + subtle wireframe, slow rotation, soft light, no overlays
  instrument: {
    terrainOpacity: 0.7,
    wireframeOpacity: 0.5,
    glowMultiplier: 0.15,
    colorSaturation: 0.6,
    animationSpeed: 0.2,
    pulseEnabled: false,
    hazeOpacity: 0,
    pathGlow: 0,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.1,
  },
  // BASELINE — Deterministic structural view (transparent scene, auto-rotate)
  baseline: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.3,
  },
  // STRATEGY — Strategy Studio lever-driven terrain (transparent scene, interactive)
  strategy: {
    terrainOpacity: 1,
    wireframeOpacity: 1,
    glowMultiplier: 1,
    colorSaturation: 1,
    animationSpeed: 1,
    pulseEnabled: false,
    hazeOpacity: 1,
    pathGlow: 1,
    bloomIntensity: 0,
    autoRotate: true,
    autoRotateSpeed: 0.3,
    // Simulation-space calibration
    visualDepthBoost: 1.12,
    pathCutBoost: 1.12,
    fogNear: 18,
    fogFar: 90,
    fogColor: "#0b1020",
    trajectoryHaloOpacity: 0.22,
    trajectoryHaloWidthMult: 1.8,
    forwardTargetZ: 1.2,
    forwardCamZMult: 1.08,
    divergenceOverlay: true,
    divergenceOpacity: 0.06,
    divergenceColor: "#312e81",
  },
};

// ============================================================================
// CONSTANTS — STABLE VERSION
// ============================================================================

const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

// ============================================================================
// CONTINUITY CUES — Reality anchor, origin marker, forward cue (strategy only)
// ============================================================================

function ContinuityCues(props: {
  enabled: boolean;
  origin?: [number, number, number];
  forward?: [number, number, number];
}) {
  const { enabled, origin = [0, 0.12, 0], forward = [0, 0.12, -6] } = props;
  if (!enabled) return null;

  return (
    <group renderOrder={20}>
      {/* Reality Anchor pin */}
      <group position={[origin[0], origin[1] + 0.18, origin[2]]}>
        <mesh>
          <sphereGeometry args={[0.10, 16, 16]} />
          <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.35} />
        </mesh>
        {/* small stem */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 10]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* Trajectory Origin marker ("You are here") */}
      <group position={origin}>
        <mesh>
          <ringGeometry args={[0.18, 0.28, 32]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Forward / North cue: faint arrow line */}
      <group>
        <mesh position={[(origin[0] + forward[0]) * 0.5, origin[1], (origin[2] + forward[2]) * 0.5]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, Math.abs(forward[2] - origin[2]) || 6, 8]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.25} />
        </mesh>
        <mesh position={forward}>
          <coneGeometry args={[0.08, 0.18, 10]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}

const BASE_SCALE = 4.5;      // Increased: data-driven shape dominates
const PEAK_SCALE = 3.5;      // Enhanced: taller, more dramatic peaks
const MASSIF_SCALE = 5.0;    // Enhanced: more variation in backdrop
const RIDGE_SHARPNESS = 1.4;
const CLIFF_BOOST = 1.15;

const SOFT_CEILING = 9.0;    // RESTORED: original ceiling (no table-top)
const CEILING_START = 7.0;   // RESTORED: original transition

// ============================================================================
// DETERMINISTIC NOISE
// ============================================================================

function noise2(x: number, z: number): number {
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

function ridgeNoise(x: number, z: number): number {
  const base = Math.sin(x * 0.5) * Math.cos(z * 0.3);
  const detail = Math.abs(Math.sin(x * 2.5 + z * 1.5)) * 0.35;
  return base * 0.15 + detail * 0.2;
}

function gaussian1(x: number, c: number, s: number): number {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

function gaussian2(dx: number, dz: number, sx: number, sz: number): number {
  return Math.exp(-0.5 * ((dx * dx) / (sx * sx) + (dz * dz) / (sz * sz)));
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Smooth, deterministic "noise" for subtle camera/scene shake.
// Avoids per-frame Math.random() jitter (which reads as instability).
function smoothSeismicNoise(t: number, seed: number) {
  // Sum of sines at incommensurate-ish frequencies → organic but continuous.
  const a = Math.sin(t * 7.13 + seed * 1.7);
  const b = Math.sin(t * 12.77 + seed * 3.1);
  const c = Math.sin(t * 19.31 + seed * 5.3);
  // Normalize-ish to [-1, 1]
  return (a * 0.62 + b * 0.28 + c * 0.10);
}

function applySoftCeiling(h: number): number {
  if (h <= CEILING_START) return h;
  const excess = h - CEILING_START;
  const range = SOFT_CEILING - CEILING_START;
  return CEILING_START + range * (1 - Math.exp(-excess / range));
}

// ============================================================================
// PALETTE
// ============================================================================

// SCENARIO-AWARE COLOR PALETTES
// Each scenario has its own identity color while maintaining brightness
const SCENARIO_PALETTE_COLORS: Record<ScenarioId, { idle: string; active: string }> = {
  base: { 
    idle: '#22d3ee',   // Luminous Teal
    active: '#00D9FF'  // Electric Cyan
  },
  upside: { 
    idle: '#34d399',   // Emerald 400
    active: '#00ff9d'  // Neon Green
  },
  downside: { 
    idle: '#fbbf24',   // Amber 400
    active: '#fcd34d'  // Bright Amber
  },
  stress: { 
    idle: '#f87171',   // Red 400
    active: '#ff4444'  // Bright Red
  }
};

function paletteForScenario(s: ScenarioId, baseColor?: string, saturationMultiplier: number = 1) {
  // Scenario-specific primary color OR scenario-provided color
  const scenarioColor = SCENARIO_PALETTE_COLORS[s] || SCENARIO_PALETTE_COLORS.base;
  const primary = new THREE.Color(baseColor || scenarioColor.idle);

  if (saturationMultiplier !== 1) {
    const hsl = { h: 0, s: 0, l: 0 };
    primary.getHSL(hsl);
    primary.setHSL(hsl.h, Math.min(1, hsl.s * saturationMultiplier), hsl.l);
  }

  // Create a darkened version for shadows
  const shadow = primary.clone().multiplyScalar(0.3);

  return {
    sky: new THREE.Color("#071318"),
    low: shadow,
    mid: primary.clone().lerp(new THREE.Color("#1a2a35"), 0.3),
    high: new THREE.Color("#e0f0f5").lerp(primary, 0.25),
    peak: new THREE.Color("#f8fcff"),
  };
}

function heightColor(h01: number, pal: ReturnType<typeof paletteForScenario>, illumination: number = 0) {
  const t = clamp01(h01);
  let c: THREE.Color;

  if (t < 0.15) c = pal.sky.clone().lerp(pal.low, t / 0.15);
  else if (t < 0.45) c = pal.low.clone().lerp(pal.mid, (t - 0.15) / 0.3);
  else if (t < 0.75) c = pal.mid.clone().lerp(pal.high, (t - 0.45) / 0.3);
  else c = pal.high.clone().lerp(pal.peak, (t - 0.75) / 0.25);

  if (illumination > 0) {
    c.lerp(new THREE.Color("#ffffff"), illumination * 0.3);
  }

  return c;
}

// ============================================================================
// GOD MODE PALETTE — Deep charcoal, dense, institutional
// ============================================================================

function godModePalette(): ReturnType<typeof paletteForScenario> {
  return {
    sky: new THREE.Color("#050709"),
    low: new THREE.Color("#0a0d10"),
    mid: new THREE.Color("#0F1114"),    // Primary charcoal per spec
    high: new THREE.Color("#182028"),   // Slightly lighter for peaks
    peak: new THREE.Color("#1e2a38"),   // Peak hint of slate-blue
  };
}

// ============================================================================
// MASSIF PEAKS — STABLE
// ============================================================================

interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
}

const MASSIF_PEAKS: MassifPeak[] = [
  { x: 0, z: -2, amplitude: 1.5, sigmaX: 2.8, sigmaZ: 2.4 },
  { x: -10, z: -1, amplitude: 1.2, sigmaX: 3.0, sigmaZ: 2.6 },
  { x: 11, z: -1.5, amplitude: 1.1, sigmaX: 2.8, sigmaZ: 2.5 },
  { x: -3, z: 3, amplitude: 0.85, sigmaX: 3.5, sigmaZ: 3.0 },
  { x: -16, z: 2, amplitude: 0.6, sigmaX: 4.0, sigmaZ: 3.5 },
  { x: 17, z: 1, amplitude: 0.55, sigmaX: 3.8, sigmaZ: 3.2 },
];

// ============================================================================
// TERRAIN COMPONENT — STABLE, NO ERRATIC MOTION
// ============================================================================

interface TerrainProps {
  dataPoints: number[];
  activeKpiIndex: number | null;
  activeLeverId: LeverId | null;
  leverIntensity01: number;
  scenario: ScenarioId;
  baseColor?: string;
  mode?: MountainMode;
  glowIntensity?: number;
  modeConfig?: ModeConfig;
  isDragging?: boolean; // For dynamic brightness
  neuralPulse?: boolean; // NEURAL BOOT: Flash bright cyan when KPI boot completes
  opacityMultiplier?: number; // Mode control
  wireOpacityMultiplier?: number; // Mode control
  glowMultiplier?: number; // Mode control
  isRecalibrating?: boolean; // Structural recalibration — slows morph for settlement easing
  godMode?: boolean; // GOD MODE: dense charcoal material, high roughness, low metalness
  /** Structural Heat normalized 0..1 (1=strong). If undefined, tint is disabled. */
  structuralHeat01?: number;
  /** Optional: expose the terrain fill mesh for deterministic sampling. */
  onMeshReady?: (mesh: THREE.Mesh | null) => void;
  /** Baseline-only visibility profile (keeps mesh readable on dark photo backgrounds). */
  baselineHighVisibility?: boolean;
}

const Terrain: React.FC<TerrainProps> = ({
  dataPoints,
  activeKpiIndex,
  activeLeverId,
  leverIntensity01,
  scenario,
  baseColor,
  mode = "default",
  glowIntensity = 1,
  modeConfig = MODE_CONFIGS.default,
  isDragging = false,
  neuralPulse = false,
  opacityMultiplier = 1,
  wireOpacityMultiplier = 1,
  glowMultiplier = 1,
  isRecalibrating = false,
  godMode = false,
  structuralHeat01,
  onMeshReady,
  baselineHighVisibility = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);
  const targetHeightsRef = useRef<Float32Array | null>(null);
  const currentHeightsRef = useRef<Float32Array | null>(null);
  const targetColorsRef = useRef<Float32Array | null>(null);
  const currentColorsRef = useRef<Float32Array | null>(null);
  const maxHeightRef = useRef(1);

  const pal = useMemo(() => {
    if (godMode) return godModePalette();
    const sat = modeConfig?.colorSaturation ?? 1;
    return paletteForScenario(scenario, baseColor, sat);
  }, [scenario, baseColor, modeConfig, godMode]);

  // Build peak model - no caching to ensure immediate response
  const peakModel = buildPeakModel({
    kpiCount: 7,
    activeKpiIndex,
    activeLeverId,
    leverIntensity01: clamp01(leverIntensity01),
  });

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W, GRID_D);
    const count = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, []);

  // Calculate target heights
  useLayoutEffect(() => {
    if (!meshFillRef.current || !meshWireRef.current) return;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const count = pos.count;
    const wHalf = MESH_W / 2;

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

    if (!targetHeightsRef.current || targetHeightsRef.current.length !== count) {
      targetHeightsRef.current = new Float32Array(count);
      currentHeightsRef.current = new Float32Array(count);
      targetColorsRef.current = new Float32Array(count * 3);
      currentColorsRef.current = new Float32Array(count * 3);
    }

    const heights = targetHeightsRef.current;
    const targetColors = targetColorsRef.current!;
    const illuminations = new Float32Array(count);
    let maxH = 0.01;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      let ridge = 0;
      let illumination = 0;

      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.48);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;

        if (activeKpiIndex === idx) {
          illumination = Math.max(illumination, g * 0.6);
        }
      }

      let h = ridge * BASE_SCALE;

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        h += g * m.amplitude * MASSIF_SCALE;
      }

      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        h += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
      }

      const rugged = ridgeNoise(x, z);
      h += rugged * (0.3 + h * 0.08);

      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

      const n = noise2(x, z) * 0.2;

      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      heights[i] = finalH;
      illuminations[i] = illumination;
      if (finalH > maxH) maxH = finalH;
    }

    maxHeightRef.current = maxH;

    for (let i = 0; i < count; i++) {
      const h = heights[i];
      const h01 = clamp01(h / (maxH * 0.82));
      const c = heightColor(h01, pal, illuminations[i]);
      targetColors[i * 3] = c.r;
      targetColors[i * 3 + 1] = c.g;
      targetColors[i * 3 + 2] = c.b;
    }
  }, [dataPoints, peakModel, pal, activeKpiIndex]);

  // Smooth interpolation + BREATHING ANIMATION
  const breathTimeRef = useRef(0);
  const fxTimeRef = useRef(0);
  const normalsAccumRef = useRef(0);
  // Settlement easing: lambda ramps smoothly between recalibrating (slow) and idle (snappy)
  const settlementLambdaRef = useRef(10);
  
  useFrame((_, delta) => {
    if (!meshFillRef.current || !meshWireRef.current) return;
    if (!targetHeightsRef.current || !currentHeightsRef.current) return;
    if (!targetColorsRef.current || !currentColorsRef.current) return;

    // Celebration effects timing (R3F-safe: Terrain is inside Canvas)
    fxTimeRef.current += delta * (modeConfig.animationSpeed ?? 1);
    const pulse =
      mode === "celebration" && modeConfig.pulseEnabled
        ? 1 + Math.sin(fxTimeRef.current * 2) * 0.15 * glowIntensity
        : 1;
    const scalePulse =
      mode === "celebration" && modeConfig.pulseEnabled
        ? 1 + Math.sin(fxTimeRef.current * 1.5) * 0.075
        : 1;

    // Advance breath time
    breathTimeRef.current += delta;
    const breathTime = breathTimeRef.current;
    
    // Breathing parameters - slow, organic heave
    const breathCycle = Math.sin(breathTime * 0.4) * 0.5 + 0.5; // 0-1 oscillation, ~2.5s cycle
    const breathIntensity = 0.12; // How much the mountain heaves
    const breathWave = Math.sin(breathTime * 0.25); // Secondary slower wave

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count;

    const targets = targetHeightsRef.current;
    const currents = currentHeightsRef.current;
    const targetCols = targetColorsRef.current;
    const currentCols = currentColorsRef.current;

    // Frame-rate independent smoothing (prevents "jitter" when FPS varies).
    const dt = Math.min(0.05, Math.max(0.001, delta)); // cap delta to avoid jumps
    // ── SETTLEMENT EASING ──
    // During recalibration: lambda = 3.5 (slow, gravitational morph)
    // On completion: lambda eases back to 10 over ~500ms (cubic-bezier feel)
    // cubic-bezier(0.22, 0.61, 0.36, 1) ≈ ease-out-quart approximation
    const targetLambda = isRecalibrating ? 3.5 : 10;
    const lambdaEaseRate = isRecalibrating ? 6 : 2.5; // drops fast, recovers slow
    settlementLambdaRef.current += (targetLambda - settlementLambdaRef.current) * Math.min(1, dt * lambdaEaseRate);
    const lambda = settlementLambdaRef.current;
    const alpha = 1 - Math.exp(-lambda * dt);

    for (let i = 0; i < count; i++) {
      const baseTarget = targets[i];
      
      // Apply breathing offset based on height (taller peaks breathe more)
      const heightFactor = baseTarget / Math.max(maxHeightRef.current, 1);
      const breathOffset = breathIntensity * heightFactor * (breathCycle + breathWave * 0.3);
      const breathingTarget = baseTarget + breathOffset;
      
      const diff = breathingTarget - currents[i];
      if (Math.abs(diff) > 0.0001) currents[i] += diff * alpha;
      else currents[i] = breathingTarget;
      pos.setZ(i, currents[i]);

      for (let c = 0; c < 3; c++) {
        const ci = i * 3 + c;
        const colDiff = targetCols[ci] - currentCols[ci];
        if (Math.abs(colDiff) > 0.0003) currentCols[ci] += colDiff * alpha;
        else currentCols[ci] = targetCols[ci];
      }
      col.setXYZ(i, currentCols[i * 3], currentCols[i * 3 + 1], currentCols[i * 3 + 2]);
    }

    // Always update for continuous breathing
    pos.needsUpdate = true;
    col.needsUpdate = true;

    // Normals are expensive; updating them at a lower rate reduces stutter.
    // (Wireframe uses MeshBasicMaterial so normals are irrelevant there.)
    normalsAccumRef.current += dt;
    if (normalsAccumRef.current >= 0.05) { // ~20 Hz
      normalsAccumRef.current = 0;
      geo.computeVertexNormals();
    }

      // Apply material animation (God Mode: stable glow | Default: celebration pulse)
      const fillMat = meshFillRef.current.material as THREE.MeshStandardMaterial;
      // Structural Heat (Baseline composition) — subtle deterministic tint via shader hook.
      // We patch once per material and only update the uniform value on changes.
      if (structuralHeat01 !== undefined) {
        setStructuralHeatTint(fillMat, structuralHeat01);
      }
      if (godMode) {
        fillMat.emissiveIntensity = 0.04 * glowMultiplier;
      } else {
        fillMat.emissiveIntensity = (isDragging ? 0.2 : 0.1) * glowMultiplier * pulse;
      }

      const wireMat = meshWireRef.current.material as THREE.MeshBasicMaterial;
      if (godMode) {
        wireMat.opacity = 0.18 * wireOpacityMultiplier;
      } else {
        wireMat.opacity = (neuralPulse ? 1.0 : isDragging ? 1.0 : 0.85) * wireOpacityMultiplier * pulse;
      }

      // Celebration "breathing" scale (1.0 .. ~1.15)
      if (groupRef.current) {
        groupRef.current.scale.setScalar(0.9 * scalePulse);
      }
  });

  useEffect(() => {
    onMeshReady?.(meshFillRef.current);
    return () => onMeshReady?.(null);
  }, [onMeshReady]);

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* FILL — God Mode: dense charcoal mass | Default: subtle depth layer */}
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={
            godMode
              ? (0.92 * opacityMultiplier)
              : baselineHighVisibility
                ? ((isDragging ? 0.55 : 0.42) * opacityMultiplier)
                : ((isDragging ? 0.35 : 0.22) * opacityMultiplier)
          }
          roughness={(godMode ? 0.85 : baselineHighVisibility ? 0.65 : 0.2) * (mode === "strategy" ? 0.92 : 1)}
          metalness={godMode ? 0.05 : baselineHighVisibility ? 0.25 : 0.8}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={
            godMode
              ? (0.04 * glowMultiplier)
              : baselineHighVisibility
                ? ((isDragging ? 0.22 : 0.14) * glowMultiplier)
                : ((isDragging ? 0.2 : 0.1) * glowMultiplier)
          }
          depthWrite={godMode}
          toneMapped={godMode}
        />
      </mesh>
      {/* WIREFRAME — God Mode: subtle structural lines | Default: luminous teal */}
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial 
          vertexColors={godMode ? false : baselineHighVisibility ? false : !neuralPulse}
          color={godMode ? "#1a2e42" : baselineHighVisibility ? "#22d3ee" : (neuralPulse ? "#00ffff" : undefined)}
          wireframe 
          transparent 
          opacity={godMode
            ? (0.18 * wireOpacityMultiplier)
            : ((neuralPulse ? 1.0 : isDragging ? 1.0 : 0.85) * wireOpacityMultiplier)
          }
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// ============================================================================
// ATMOSPHERIC HAZE
// ============================================================================

interface AtmosphericHazeProps {
  riskLevel: number;
  viewMode: "data" | "terrain" | "operator" | "investor";
  scenario: ScenarioId;
  isSeismicActive?: boolean;
  opacityMultiplier?: number;
}

function AtmosphericHaze({ riskLevel, viewMode, scenario, isSeismicActive = false, opacityMultiplier = 1 }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = (viewMode === "investor" || viewMode === "data") ? 0.5 : 0.7;
  
  const scenarioTone = scenario === "stress" ? 1.1 : 
                       scenario === "downside" ? 1.0 : 
                       scenario === "upside" ? 0.7 : 0.85;
  
  // BRIGHTENED: Reduced base opacity significantly
  const baseOpacity = 0.08 + (riskFactor * 0.05 * scenarioTone);
  const finalOpacity = baseOpacity * viewFactor * opacityMultiplier;
  
  // Altitude haze opacity (above mountain) - reduced
  const altitudeOpacity = 0.04 * viewFactor * opacityMultiplier;
  
  // SEISMIC: Amber warning overlay when risk is being actively manipulated
  const seismicIntensity = isSeismicActive ? Math.min(1, riskFactor * 1.5) : 0;

  return (
    <div className="atmospheric-haze">
      {/* SEISMIC OVERLAY - Amber warning pulse when risk sliders active */}
      {isSeismicActive && (
        <div 
          className="haze-layer haze-seismic"
          style={{ 
            opacity: seismicIntensity * 0.4,
            animation: 'seismic-pulse 150ms ease-in-out infinite'
          }}
        />
      )}
      
      {/* ALTITUDE HAZE - Above mountain (new) */}
      <div 
        className="haze-layer haze-altitude"
        style={{ opacity: altitudeOpacity }}
      />
      {/* PRESSURE BAND - Subtle horizontal band above peak */}
      <div 
        className="haze-layer haze-pressure-band"
        style={{ opacity: altitudeOpacity * 0.6 }}
      />
      {/* MINIMAL bottom haze layers - brightened */}
      <div 
        className="haze-layer haze-deep"
        style={{ opacity: finalOpacity * 0.2 }}
      />
      <div 
        className="haze-layer haze-mid"
        style={{ opacity: finalOpacity * 0.15 }}
      />

      <style>{`
        .atmospheric-haze {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .haze-layer {
          position: absolute;
          inset: 0;
        }

        /* ALTITUDE HAZE - lighter vertical gradient above mountain */
        .haze-altitude {
          background: linear-gradient(
            to bottom,
            rgba(20, 35, 55, 0.15) 0%,
            rgba(18, 30, 48, 0.08) 20%,
            transparent 40%
          );
        }

        /* PRESSURE BAND - very subtle horizontal band */
        .haze-pressure-band {
          background: linear-gradient(
            to bottom,
            transparent 20%,
            rgba(30, 50, 70, 0.06) 28%,
            transparent 38%
          );
          filter: blur(6px);
        }

        /* BRIGHTENED: Bottom haze layers - much lighter */
        .haze-deep {
          background: radial-gradient(
            ellipse 120% 60% at 50% 75%,
            rgba(15, 30, 50, 0.2) 0%,
            rgba(12, 25, 40, 0.08) 40%,
            transparent 60%
          );
        }

        .haze-mid {
          background: radial-gradient(
            ellipse 100% 50% at 45% 70%,
            rgba(20, 38, 58, 0.12) 0%,
            rgba(15, 30, 48, 0.05) 35%,
            transparent 50%
          );
        }
        
        /* SEISMIC OVERLAY - Amber warning when risk active */
        .haze-seismic {
          background: radial-gradient(
            ellipse 100% 80% at 50% 60%,
            rgba(245, 158, 11, 0.25) 0%,
            rgba(245, 158, 11, 0.1) 40%,
            transparent 70%
          );
          mix-blend-mode: screen;
        }
        
        @keyframes seismic-pulse {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(2px, 1px); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// GRID HELPER
// ============================================================================

// ============================================================================
// GHOST TERRAIN — Static Baseline (Doesn't react to sliders)
// Shows "Where you started" vs "Where you're going"
// Only visible after user starts interacting
// ============================================================================

function GhostTerrain({ isVisible, opacityMultiplier = 1 }: { isVisible: boolean; opacityMultiplier?: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W / 2, GRID_D / 2);
    const pos = geo.attributes.position;
    const count = pos.count;
    const wHalf = MESH_W / 2;
    
    // Static baseline datapoints (neutral values)
    const baselineDP = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;
      
      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = baselineDP[idx];
        const g = gaussian1(kpiX, idx, 0.48);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }
      
      let h = ridge * BASE_SCALE * 0.6; // Slightly lower than main
      
      // Add basic massif shape
      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX * 1.2, m.sigmaZ * 1.2);
        h += g * m.amplitude * MASSIF_SCALE * 0.5;
      }
      
      // Island mask
      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
      h = Math.max(0, h * mask * 0.8);
      
      pos.setZ(i, h);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  // TACTICAL GREY: Ghost is a faint blueprint schematic
  const targetOpacity = (isVisible ? 0.08 : 0) * opacityMultiplier;  // 8% wireframe — subtle reference
  const fillOpacity = (isVisible ? 0.02 : 0) * opacityMultiplier;    // 2% fill — barely there
  
  return (
    <group 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2.15, 0]}
      scale={[0.995, 0.995, 0.995]} // Slightly smaller to avoid Z-fighting
    >
      {/* Ghost Wireframe — Tactical Silver baseline (blueprint look) */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#cbd5e1"       // Silver/Light Slate — neutral reference
          wireframe 
          transparent 
          opacity={targetOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle fill for depth */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#94a3b8"       // Slate Grey — neutral fill
          transparent 
          opacity={fillOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// RECALIBRATION SCAN LINE — Thin horizontal sweep (structural signal)
// Passes once across the mountain during recalibration. No glow burst.
// ============================================================================

function RecalibrationScanLine({ active }: { active: boolean }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const wasActiveRef = useRef(false);

  useFrame((_, delta) => {
    if (!lineRef.current) return;

    // Reset sweep on new activation
    if (active && !wasActiveRef.current) {
      progressRef.current = 0;
    }
    wasActiveRef.current = active;

    if (active && progressRef.current < 1) {
      // Single sweep: y = -4 → +7 over ~2.2 seconds
      progressRef.current = Math.min(1, progressRef.current + delta / 2.2);
      const y = -4 + progressRef.current * 11;
      lineRef.current.position.y = y;

      // Fade envelope: soft in, hold, soft out — no abrupt edges
      const t = progressRef.current;
      const envelope = t < 0.06 ? t / 0.06
        : t > 0.90 ? (1 - t) / 0.10
        : 1;
      const mat = lineRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = envelope * 0.30;
      lineRef.current.visible = true;
    } else {
      lineRef.current.visible = false;
    }
  });

  return (
    <mesh ref={lineRef} visible={false}>
      <planeGeometry args={[55, 0.05]} />
      <meshBasicMaterial
        color="#22d3ee"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// GOD MODE: INTERQUARTILE CONFIDENCE ENVELOPE (Section 3)
// Translucent mesh showing P25-P75 dispersion band around median mountain
// ============================================================================

function ConfidenceEnvelope({
  dataPoints,
  spread,
  enabled,
}: {
  dataPoints: number[];
  spread: number;
  enabled: boolean;
}) {
  const geometry = useMemo(() => {
    if (!enabled) return null;

    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, Math.floor(GRID_W / 2), Math.floor(GRID_D / 2));
    const pos = geo.attributes.position;
    const count = pos.count;
    const wHalf = MESH_W / 2;

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    // Expand data points by spread factor (upper IQR bound)
    const expanded = dp.map((v) => clamp01(v * (1 + spread * 0.8)));

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(expanded[idx]);
        const g = gaussian1(kpiX, idx, 0.55); // Slightly wider sigma for envelope
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }

      let h = ridge * BASE_SCALE;

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX * 1.1, m.sigmaZ * 1.1);
        h += g * m.amplitude * MASSIF_SCALE;
      }

      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      const n = noise2(x, z) * 0.2;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      pos.setZ(i, finalH);
    }

    geo.computeVertexNormals();
    return geo;
  }, [dataPoints, spread, enabled]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.97, 0]} scale={[0.902, 0.902, 0.902]}>
      {/* Upper envelope wireframe — desaturated cyan */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#3a8fa8"
          wireframe
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle fill for depth perception */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#2d7a94"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// GOD MODE: STRUCTURAL AXES (Section 4)
// Enterprise Value ↑ (left) + Time Horizon → (ground)
// Institutional, engraved, low opacity
// ============================================================================

function StructuralAxes() {
  return (
    <group>
      {/* Vertical axis — left side of terrain */}
      <DreiLine
        points={[
          new THREE.Vector3(-24, -2.5, 0),
          new THREE.Vector3(-24, 7, 0),
        ]}
        color="#334155"
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
      {/* Vertical axis ticks */}
      {[0, 1.5, 3.0, 4.5, 6.0].map((offset) => (
        <DreiLine
          key={offset}
          points={[
            new THREE.Vector3(-24, -2.5 + offset, 0),
            new THREE.Vector3(-23.4, -2.5 + offset, 0),
          ]}
          color="#334155"
          lineWidth={0.4}
          transparent
          opacity={0.15}
        />
      ))}
      {/* Label: Enterprise Value ↑ */}
      <Html position={[-26.5, 2, 0]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.25)",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            userSelect: "none",
          }}
        >
          Enterprise Value ↑
        </div>
      </Html>
      {/* Ground plane label: Time Horizon → */}
      <Html position={[0, -2.7, 14]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.25)",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          Time Horizon →
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// GOD MODE: BASELINE REFERENCE LINE (Section 5)
// Thin horizontal line across terrain representing current state
// ============================================================================

function BaselineRefLine({ height }: { height: number }) {
  return (
    <group>
      {/* Thin horizontal plane */}
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.015]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Subtle glow line */}
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.06]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Label */}
      <Html position={[24.5, height + 0.4, 0]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "rgba(34, 211, 238, 0.3)",
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          Baseline
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// GOD MODE: TERRAIN SURFACE RIDGE LINE (Mountain Clarity)
// DreiLine that follows the actual terrain heightfield along the ridge spine.
// Replaces 2D TrajectoryOverlay which couldn't match the 3D projection.
// ============================================================================

/**
 * Compute terrain height at a specific (x, z) position using the SAME algorithm
 * as the Terrain component's useLayoutEffect. This MUST stay in sync.
 * Does not include peakModel dynamic peaks (activeKpi / activeLever) — only
 * the signature backbone + data-driven shape + massif + noise.
 */
function computeStaticTerrainHeight(x: number, z: number, dp: number[]): number {
  const wHalf = MESH_W / 2;
  const kpiX = ((x + wHalf) / MESH_W) * 6;

  let ridge = 0;
  for (let idx = 0; idx < 7; idx++) {
    const v = clamp01(dp[idx]);
    const g = gaussian1(kpiX, idx, 0.48);
    ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
  }

  let h = ridge * BASE_SCALE;

  // Massif backdrop peaks
  for (const m of MASSIF_PEAKS) {
    const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
    h += g * m.amplitude * MASSIF_SCALE;
  }

  // Signature peakModel backbone (always present, even with no active KPI)
  const signaturePeaks = [
    { index: 3.1, amplitude: 0.55, sigma: 2.5 },
    { index: 2.0, amplitude: 0.38, sigma: 2.0 },
    { index: 4.3, amplitude: 0.38, sigma: 2.0 },
    { index: 1.0, amplitude: 0.25, sigma: 1.6 },
    { index: 5.2, amplitude: 0.25, sigma: 1.6 },
  ];
  for (const p of signaturePeaks) {
    const pidx = clamp01(p.index / 6);
    const peakX = lerp(-wHalf, wHalf, pidx);
    h += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
  }

  // Ruggedness + noise
  const rugged = ridgeNoise(x, z);
  h += rugged * (0.3 + h * 0.08);

  const dist = Math.sqrt(x * x + z * z * 1.4);
  const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
  const n = noise2(x, z) * 0.2;
  const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
  let finalH = Math.max(0, (h + n) * mask * cliff);
  finalH = applySoftCeiling(finalH);

  return finalH;
}

// Annotation definitions for the 7 mountain zones
const KPI_ANNOTATION_DEFS = [
  { key: "revenue",    label: "REVENUE",  color: "#22d3ee" },
  { key: "margin",     label: "MARGIN",   color: "#34d399" },
  { key: "runway",     label: "RUNWAY",   color: "#60a5fa" },
  { key: "cash",       label: "CASH",     color: "#a78bfa" },
  { key: "burn",       label: "BURN",     color: "#fbbf24" },
  { key: "efficiency", label: "LTV/CAC",  color: "#22d3ee" },
  { key: "risk",       label: "RISK",     color: "#f87171" },
];

/**
 * 3D ridge line that traces the actual terrain surface along planeY=-1.5
 * (where peakModel peaks are centered). Replaces the 2D TrajectoryOverlay.
 */
function TerrainRidgeLine({
  dataPoints,
  enabled,
}: {
  dataPoints: number[];
  enabled: boolean;
}) {
  const points = useMemo(() => {
    if (!enabled) return [];
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    const wHalf = MESH_W / 2;
    const ridgeZ = -1.5; // planeY where signature peaks center (z + 1.5 = 0)
    const pts: THREE.Vector3[] = [];
    const numSamples = 120;

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const x = lerp(-wHalf, wHalf, t);
      const h = computeStaticTerrainHeight(x, ridgeZ, dp);
      // Place slightly above surface to avoid z-fighting
      pts.push(new THREE.Vector3(x, ridgeZ, h + 0.15));
    }

    return pts;
  }, [dataPoints, enabled]);

  if (!enabled || !points.length) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* Subtle glow underline */}
      <DreiLine
        points={points}
        color="#00E0FF"
        lineWidth={2.5}
        transparent
        opacity={0.08}
      />
      {/* Primary ridge line — thin, precise */}
      <DreiLine
        points={points}
        color="#00E0FF"
        lineWidth={1}
        transparent
        opacity={0.35}
      />
    </group>
  );
}

// ============================================================================
// GOD MODE: TERRAIN SURFACE ANNOTATIONS (Mountain Clarity)
// Permanent 3D-positioned labels at each KPI zone on the mountain surface.
// Always visible. Explains shape + numbers. Reconciles with right-hand panel.
// Uses Html from drei to project 3D positions to screen automatically.
// ============================================================================

function TerrainSurfaceAnnotations({
  dataPoints,
  kpiValues,
  enabled,
}: {
  dataPoints: number[];
  kpiValues: Record<string, { value?: number; label?: string }>;
  enabled: boolean;
}) {
  const annotations = useMemo(() => {
    if (!enabled) return [];
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    const wHalf = MESH_W / 2;
    const ridgeZ = -1.5;

    const runway = kpiValues?.runway?.value ?? 24;
    const ltvCac = kpiValues?.ltvCac?.value ?? 3;
    const riskIndex = kpiValues?.riskIndex?.value ?? 70;

    return KPI_ANNOTATION_DEFS.map((def, idx) => {
      const x = lerp(-wHalf, wHalf, idx / 6);
      const h = computeStaticTerrainHeight(x, ridgeZ, dp);
      const value = dp[idx];

      // Format value + shape description based on metric type
      let displayValue: string;
      let description: string;

      switch (def.key) {
        case "revenue":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.6 ? "Strong growth drives upward slope" : "Revenue pressure flattens terrain";
          break;
        case "margin":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.55 ? "Healthy margins support elevation" : "Margin compression limits peak";
          break;
        case "runway":
          displayValue = `${Math.round(runway)}mo`;
          description = runway >= 18 ? "Capital buffer maintains ridge height" : "Short runway erodes formation";
          break;
        case "cash":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.5 ? "Cash reserves sustain mountain mass" : "Low reserves weaken structure";
          break;
        case "burn":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.5 ? "Disciplined burn maintains form" : "Excessive burn erodes base";
          break;
        case "efficiency":
          displayValue = `${ltvCac.toFixed(1)}x`;
          description = ltvCac >= 3 ? "Efficient acquisition builds height" : "High CAC suppresses elevation";
          break;
        case "risk":
          displayValue = `${Math.round(riskIndex)}%`;
          description = riskIndex > 50 ? "Low risk sharpens ridgeline" : "High risk softens peak";
          break;
        default:
          displayValue = `${Math.round(value * 100)}%`;
          description = "";
      }

      return { ...def, x, z: ridgeZ, h: h + 0.5, value, displayValue, description };
    });
  }, [dataPoints, kpiValues, enabled]);

  if (!enabled || !annotations.length) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {annotations.map((ann) => (
        <group key={ann.key} position={[ann.x, ann.z, ann.h]}>
          {/* Node sphere — on the surface */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial
              color={ann.color}
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>
          {/* Glow halo */}
          <mesh>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshBasicMaterial
              color={ann.color}
              transparent
              opacity={0.1}
              depthWrite={false}
            />
          </mesh>
          {/* Vertical connector down to surface */}
          <DreiLine
            points={[
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, 0, -0.5),
            ]}
            color={ann.color}
            lineWidth={0.5}
            transparent
            opacity={0.2}
          />
          {/* Html label — ALWAYS VISIBLE, projected from 3D */}
          <Html
            position={[0, 0, 1.2]}
            center
            style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
            distanceFactor={14}
            occlude={false}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}>
              {/* Metric label */}
              <span style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: ann.color,
                opacity: 0.7,
                fontFamily: "'Inter', sans-serif",
                textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)",
              }}>
                {ann.label}
              </span>
              {/* Value — prominent */}
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.92)",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                textShadow: "0 1px 8px rgba(0,0,0,0.98), 0 0 4px rgba(0,0,0,0.9)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}>
                {ann.displayValue}
              </span>
              {/* Description — explains what this zone means */}
              <span style={{
                fontSize: 7,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.4)",
                fontFamily: "'Inter', sans-serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.95)",
                maxWidth: 110,
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {ann.description}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// DIGITAL HORIZON — Infinite Floor Grid + Data Dust (Scenario-Aware)
// ============================================================================

// Grid colors that complement each scenario
const SCENARIO_GRID_COLORS: Record<ScenarioId, string> = {
  base: "#38bdf8",     // Sky Blue
  upside: "#34d399",   // Emerald
  downside: "#fbbf24", // Amber
  stress: "#f87171",   // Red
};

function DigitalHorizon({ scenarioId, glowMultiplier = 1, baseOpacity = 1, isRecalibrating = false }: { scenarioId: ScenarioId; glowMultiplier?: number; baseOpacity?: number; isRecalibrating?: boolean }) {
  const gridColor = SCENARIO_GRID_COLORS[scenarioId] || SCENARIO_GRID_COLORS.base;
  const lightColor = SCENARIO_PALETTE_COLORS[scenarioId]?.idle || "#22d3ee";
  const gridGroupRef = useRef<THREE.Group>(null);

  // Grid micro-shift during recalibration — very subtle structural signal
  useFrame((_, delta) => {
    if (!gridGroupRef.current) return;
    const targetX = isRecalibrating ? 0.035 : 0;
    const targetZ = isRecalibrating ? 0.025 : 0;
    const ease = Math.min(1, delta * 3);
    gridGroupRef.current.position.x += (targetX - gridGroupRef.current.position.x) * ease;
    gridGroupRef.current.position.z += (targetZ - gridGroupRef.current.position.z) * ease;
  });
  
  return (
    <>
      {/* 1. The Infinite Floor Grid — Color matches scenario */}
      <group ref={gridGroupRef}>
        <Grid 
        position={[0, -2.5, 0]} 
          args={[50, 50]}
          cellSize={1} 
          cellThickness={0.8} 
          cellColor="#1e293b"
          sectionSize={5} 
          sectionThickness={1.5} 
          sectionColor={gridColor}  // Dynamic scenario color
          fadeDistance={40}
          fadeStrength={1.2}
          infiniteGrid
        />
      </group>
      
      {/* 2. NEURAL CONSTELLATION — Floating nodes that connect when simulating */}
      <NeuralBackground />
      
      {/* 3. SUBSURFACE GLOW — Color matches scenario */}
      <pointLight 
        position={[0, -4, 0]} 
        intensity={1.2 * glowMultiplier * baseOpacity}
        color={lightColor}        // Dynamic scenario color
        distance={25} 
        decay={2}
      />
      <pointLight 
        position={[0, -3, 5]} 
        intensity={0.7 * glowMultiplier * baseOpacity}
        color={lightColor}        // Dynamic scenario color
        distance={18} 
        decay={2}
      />
    </>
  );
}

// ============================================================================
// CINEMATIC CONTROLLER — Zoomed-Out Undulation View
// ============================================================================
// Video mode: stays at standard camera distance, shows terrain undulation
// through subtle rotation only (no zoom, no bobbing, no dramatic movement)

interface CinematicControllerProps {
  children: React.ReactNode;
  riskLevel?: number;
}

function CinematicController({ children, riskLevel = 0 }: CinematicControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hasInteracted = useUIStore((s) => s.hasInteracted);
  const riskShakeRef = useRef(0);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // 1. RISK REACTION (Seismic Shake) — Always active when risk is high
    const dt = Math.min(0.05, Math.max(0.001, delta));
    const riskShakeTarget =
      riskLevel > 40
        ? smoothSeismicNoise(t, 0.37) * 0.015 * (riskLevel / 100)
        : 0;
    riskShakeRef.current = THREE.MathUtils.damp(riskShakeRef.current, riskShakeTarget, 10, dt);
    const riskShake = riskShakeRef.current;
    
    if (!hasInteracted) {
      // 2. IDLE MODE: SUBTLE UNDULATION (ZOOMED OUT)
      // Gentle horizontal rotation to show terrain from different angles
      // NO bobbing, NO zoom changes, NO dramatic pitch/roll movements
      
      // Yaw (Left <-> Right): Very gentle horizontal sweep
      const yaw = Math.sin(t * 0.10) * 0.25 + Math.sin(t * 0.05) * 0.10;
      groupRef.current.rotation.y = yaw;
      
      // Pitch: Minimal (maintain consistent viewing angle)
      groupRef.current.rotation.x = 0;
      
      // Roll: None (keep horizon level)
      groupRef.current.rotation.z = 0;
      
      // Position: Only seismic shake (no vertical bobbing)
      groupRef.current.position.y = riskShake;
      
    } else {
      // 3. ACTIVE MODE: LOCK TO STATION
      // Smoothly return to center for data analysis
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y, 
        0, 
        3.5, 
        delta
      ) + riskShake;
    }
  });
  
  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// BASELINE AUTO ROTATE — Institutional crawl (pausable)
// ============================================================================

function BaselineAutoRotate({ children, paused }: { children: React.ReactNode; paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (paused) return;
    // ~0.6°/sec
    groupRef.current.rotation.y += delta * 0.0105;
  });
  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

interface ScenarioMountainProps {
  scenario: Scenario | ScenarioId;
  dataPoints?: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  mode?: MountainMode;
  glowIntensity?: number;
  showPath?: boolean;
  showMilestones?: boolean;
  pathColor?: string;
  /** 
   * GOD MODE — Transforms terrain into spatial Monte Carlo decision engine
   * 
   * When enabled, God Mode:
   * - Positions camera closer & higher for 70-80% viewport fill
   * - Adds confidence envelope (IQR spread visualization)
   * - Shows structural axes (EV ↑, Time →)
   * - Displays baseline reference line
   * - Adds ridge line & surface annotations
   * - Uses darker materials (charcoal) with higher roughness
   * - Enables subtle auto-rotation with locked zoom
   * - Adds cyan rim lighting linked to EV metrics
   * - Shows model credibility footnote
   */
  godMode?: boolean;
  /** Optional: render additional in-canvas overlays (e.g., Baseline anchors/lines). */
  overlay?: React.ReactNode;
  /** Optional: Baseline-only very slow auto rotation (pausable). */
  baselineAutoRotate?: boolean;
  baselineAutoRotatePaused?: boolean;
  /** Baseline-only: allow full 360° user rotation (no azimuth clamp). */
  baselineAllow360Rotate?: boolean;
  /** Optional: enable/disable user camera controls (OrbitControls). */
  controlsEnabled?: boolean;
  /** Optional: override OrbitControls autoRotate (defaults to mode config). */
  controlsAutoRotate?: boolean;
  /** Baseline-only: make container background transparent (lets parent show through). */
  transparentContainer?: boolean;
  /** Baseline-only: make scene background/fog transparent (no clear color). */
  transparentScene?: boolean;
  /** Optional: access the terrain fill mesh for deterministic sampling (uv -> height). */
  onTerrainMeshReady?: (mesh: THREE.Mesh | null) => void;
  /** Baseline-only visibility profile (keeps mesh readable on dark photo backgrounds). */
  baselineHighVisibility?: boolean;
  /**
   * STRUCTURAL HEAT (0–100)
   * Baseline composition quality. Drives a subtle, deterministic surface tint.
   */
  structuralHeatScore?: number;
}

export function ScenarioMountain({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  activeLeverId = null,
  leverIntensity01 = 0,
  className,
  timelineEnabled = false,
  heatmapEnabled = false,
  mode = 'default',
  glowIntensity = 1,
  showPath = false,
  showMilestones = false,
  pathColor,
  godMode: godModeProp = false,
  overlay,
  baselineAutoRotate = false,
  baselineAutoRotatePaused = false,
  baselineAllow360Rotate = false,
  controlsEnabled = true,
  controlsAutoRotate,
  transparentContainer = false,
  transparentScene = false,
  onTerrainMeshReady,
  baselineHighVisibility = false,
  structuralHeatScore,
}: ScenarioMountainProps) {
  const viewMode = useScenarioStore((s) => s.viewMode);

  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS.default;
  const [isOrbiting, setIsOrbiting] = useState(false);

  const scenarioKey = typeof scenario === "string" ? scenario : scenario.id;
  const scenarioColor = typeof scenario === "string" ? undefined : (scenario as any)?.color;
  const scenarioId: ScenarioId = (
    scenarioKey === "base" || scenarioKey === "upside" || scenarioKey === "downside" || scenarioKey === "stress"
      ? (scenarioKey as ScenarioId)
      : "base"
  );

  const glowMultiplier = config.glowMultiplier * glowIntensity;
  const terrainOpacityMultiplier = config.terrainOpacity;
  const wireOpacityMultiplier = config.wireframeOpacity;
  const hazeOpacityMultiplier = config.hazeOpacity;

  // Structural heat -> normalized 0..1 (strong=1)
  const structuralHeat01 = structuralHeatScore !== undefined
    ? Math.max(0, Math.min(1, structuralHeatScore / 100))
    : undefined;
  
  // TODO: Implement timeline and heatmap rendering logic
  // - timelineEnabled: Show historical progression overlay
  // - heatmapEnabled: Show intensity/concentration visualization
  
  const {
    activeScenarioId,
    engineResults,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
    }))
  );

  // BUG FIX #1: Use scenario.id (NOT activeScenarioId). Supports ScenarioId strings too.
  const engineResult =
    (engineResults as Record<string, any> | undefined)?.[
      typeof scenario === "string" ? scenario : scenario.id
    ];
  const kpiValues = engineResult?.kpis || {};

  const resolvedDataPoints = useMemo(() => {
    if (Array.isArray(dataPoints) && dataPoints.length > 0) return dataPoints;
    return engineResultToMountainForces((engineResult ?? null) as any);
  }, [dataPoints, engineResult]);
  
  // riskLevel = danger score (higher = more dangerous)
  // riskIndex is health (higher = healthier), so invert it
  const riskLevel = 100 - (kpiValues.riskIndex?.value ?? 50);
  
  // SEISMIC WIRE: Read from UI store for active risk interaction
  // NEURAL BOOT: neuralBootComplete signals the mountain to pulse
  const { activeGroup, isDragging, riskLevel: uiRiskLevel, hasInteracted, neuralBootComplete } = useUIStore(
    useShallow((s) => ({
      activeGroup: s.activeGroup,
      isDragging: s.isDragging,
      riskLevel: s.riskLevel,
      hasInteracted: s.hasInteracted,
      neuralBootComplete: s.neuralBootComplete,
    }))
  );
  
  // Is risk actively being manipulated?
  const isSeismicActive = activeGroup === 'risk' && isDragging;
  
  // Use UI store's riskLevel when actively dragging risk sliders
  const effectiveRiskLevel = isSeismicActive ? uiRiskLevel : riskLevel;

  const solverPath = useScenarioStore((s) => s.solverPath);

  // ── RECALIBRATION STATE — structural signal from simulation engine (single source of truth) ──
  // Key off simulationStatus to prevent any accidental "stuck" pointer-events dim if isSimulating desyncs.
  const simulationStatus = useSimulationStore((s) => s.simulationStatus);
  const isRecalibrating = simulationStatus === "running";

  // ── GOD MODE SIMULATION DATA — for confidence envelope + metric linkage ──
  const fullSimResult = useSimulationStore((s) => s.fullResult);

  // ── GOD MODE: Resolve flag (only active in 'default' mode) ──
  const isGodMode = mode === "default" && Boolean(godModeProp);

  // ── GOD MODE: Metric Linkage + Confidence Envelope spread ──
  const godModeMetrics = useMemo(() => {
    if (!isGodMode) return { survivalFactor: 0.5, evFactor: 0.5, envelopeSpread: 0.15 };

    const k = kpiValues;
    // Survival: riskIndex is "health" (higher = safer), map to 0-1
    const riskIdx = k.riskIndex?.value ?? 50;
    const survivalFactor = clamp01(riskIdx / 100);

    // Enterprise Value: normalize to 0-1
    const evRaw = k.enterpriseValue?.value ?? 0;
    const evFactor = clamp01(evRaw / 10_000_000);

    // IQR spread from simulation results
    let envelopeSpread = 0.15;
    if (fullSimResult?.arrPercentiles) {
      const p50 = Math.max(1, fullSimResult.arrPercentiles.p50);
      const iqr = (fullSimResult.arrPercentiles.p75 - fullSimResult.arrPercentiles.p25) / p50;
      envelopeSpread = clamp01(Math.max(0.05, Math.min(0.5, iqr)));
    }

    return { survivalFactor, evFactor, envelopeSpread };
  }, [isGodMode, kpiValues, fullSimResult]);

  const instrumentMode = mode === 'instrument';
  const cameraConfig = useMemo(
    () => ({
      position: (
        isGodMode
          ? [0, 10, 22]
          : [0, 6, 32 * (mode === "strategy" ? (MODE_CONFIGS.strategy.forwardCamZMult ?? 1) : 1)]
      ) as [number, number, number],
      fov: isGodMode ? 36 : 38,
    }),
    [isGodMode, mode]
  );

  // ── GOD MODE: Fog density linked to survival (Section 6 — Metric Linkage) ──
  const godFogNear = isGodMode ? (25 + (1 - godModeMetrics.survivalFactor) * 15) : 40;
  const godFogFar = isGodMode ? (70 - (1 - godModeMetrics.survivalFactor) * 20) : 100;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: transparentContainer
          ? "transparent"
          : isGodMode
            ? "radial-gradient(circle at 50% 55%, #0e131d 0%, #0a0f16 60%, #07090d 100%)"
            : "radial-gradient(circle at 50% 55%, #1e2d4d 0%, #122038 60%, #0d1628 100%)",
        minHeight: '400px',
        height: '100%',
        width: '100%',
      }}
    >
      {/* THE VIGNETTE — Deeper in God Mode */}
      <div 
        className="absolute inset-0 pointer-events-none z-2"
        style={{
          boxShadow: isGodMode
            ? "inset 0 0 120px rgba(5, 7, 9, 0.6)"
            : "inset 0 0 80px rgba(11, 18, 32, 0.4)",
        }}
      />
      
      <AtmosphericHaze 
        riskLevel={effectiveRiskLevel}
        viewMode={viewMode}
        scenario={scenarioId}
        isSeismicActive={isSeismicActive}
        opacityMultiplier={isGodMode ? hazeOpacityMultiplier * 0.5 : hazeOpacityMultiplier}
      />
      
      <Canvas
        camera={cameraConfig}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, background: "transparent" }}
        fallback={<div style={{ width: "100%", height: "100%", background: isGodMode ? "#07090d" : "#101520" }} />}
        onCreated={({ gl }) => {
          if (transparentScene) gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
        {/* Scene clear + fog (Baseline can opt into transparentScene for photo-backed stages) */}
        {!transparentScene && <color attach="background" args={[isGodMode ? '#0a0f16' : '#122038']} />}
        {mode === "strategy" ? (
          <fog attach="fog" args={[config.fogColor ?? "#0b1020", config.fogNear ?? 18, config.fogFar ?? 90]} />
        ) : !transparentScene ? (
          <fog attach="fog" args={[isGodMode ? '#0a0f16' : '#122038', godFogNear, godFogFar]} />
        ) : null}
        
        <ambientLight intensity={mode === "strategy" ? 0.50 : 0.45} />
        <directionalLight
          position={[6, 10, 6]}
          intensity={mode === "strategy" ? 1.15 : 1.05}
          castShadow
        />
        <directionalLight
          position={[-4, 6, -4]}
          intensity={mode === "strategy" ? 0.90 : 0.35}
        />

        {instrumentMode ? (
          <>
            {/* INSTRUMENT MODE — Compact diagnostic terrain (Initialize page) */}
            {/* No overlays, no haze, no grid, no paths. Mesh + wireframe + slow rotation. */}

            {/* Scale Y to 0.45 — flattens the terrain so only peaks & dips are visible,
                not a towering mountain. Position lowered for correct framing. */}
            <group scale={[1, 0.45, 1]} position={[0, -3, 0]}>
              <Terrain
                dataPoints={resolvedDataPoints}
                activeKpiIndex={null}
                activeLeverId={null}
                leverIntensity01={0}
                scenario={scenarioId}
                baseColor={scenarioColor}
                mode="instrument"
                glowIntensity={0.3}
                modeConfig={config}
                isDragging={false}
                neuralPulse={false}
                opacityMultiplier={config.terrainOpacity}
                wireOpacityMultiplier={config.wireframeOpacity}
                glowMultiplier={config.glowMultiplier}
                structuralHeat01={structuralHeat01}
              />
            </group>

            {/* Slow rotation (0.1 deg/sec), no user interaction */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              autoRotate
              autoRotateSpeed={config.autoRotateSpeed}
              minPolarAngle={Math.PI / 3.5}
              maxPolarAngle={Math.PI / 3.5}
            />
          </>
        ) : (
          <>
            <GhostTerrain isVisible={showPath && hasInteracted} opacityMultiplier={config.pathGlow} />

            {/* Strategy: faint divergence band overlay */}
            {mode === "strategy" && config.divergenceOverlay && (
              <mesh
                position={[0, 0.02, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={5}
              >
                <planeGeometry args={[MESH_W, MESH_D]} />
                <meshBasicMaterial
                  color={config.divergenceColor ?? "#312e81"}
                  transparent
                  opacity={config.divergenceOpacity ?? 0.06}
                  depthWrite={false}
                />
              </mesh>
            )}
        
        {/* CAMERA CONTROL MODES:
          * GOD MODE: Static authoritative pose (no idle animation, locked zoom, subtle auto-rotation via OrbitControls)
          * BASELINE: Slow institutional auto-rotate (~0.6°/sec, pausable when user interacts)
          * DEFAULT (Video/Cinematic): Zoomed-out view with gentle undulation (subtle horizontal rotation only)
        */}
        {/* IMPORTANT: overlay is rendered INSIDE the rotation wrapper so orbs/lines rotate with the terrain */}
        {isGodMode ? (
          <>
            <Terrain
              dataPoints={resolvedDataPoints}
              activeKpiIndex={activeKpiIndex}
              activeLeverId={activeLeverId}
              leverIntensity01={leverIntensity01}
              scenario={scenarioId}
              baseColor={pathColor ?? scenarioColor}
              mode={mode}
              glowIntensity={glowIntensity}
              modeConfig={config}
              isDragging={isDragging}
              neuralPulse={neuralBootComplete}
              opacityMultiplier={terrainOpacityMultiplier}
              wireOpacityMultiplier={wireOpacityMultiplier}
              glowMultiplier={glowMultiplier}
              isRecalibrating={isRecalibrating}
              godMode
              structuralHeat01={structuralHeat01}
            />
            {overlay}
          </>
        ) : (
          baselineAutoRotate ? (
            <BaselineAutoRotate paused={baselineAutoRotatePaused || isOrbiting}>
              <Terrain
                dataPoints={resolvedDataPoints}
                activeKpiIndex={activeKpiIndex}
                activeLeverId={activeLeverId}
                leverIntensity01={leverIntensity01}
                scenario={scenarioId}
                baseColor={pathColor ?? scenarioColor}
                mode={mode}
                glowIntensity={glowIntensity}
                modeConfig={config}
                isDragging={isDragging}
                neuralPulse={neuralBootComplete}
                opacityMultiplier={terrainOpacityMultiplier}
                wireOpacityMultiplier={wireOpacityMultiplier}
                glowMultiplier={glowMultiplier}
                isRecalibrating={isRecalibrating}
                structuralHeat01={structuralHeat01}
                onMeshReady={onTerrainMeshReady}
                baselineHighVisibility={baselineHighVisibility}
              />
              {overlay}
            </BaselineAutoRotate>
          ) : (
            <CinematicController riskLevel={effectiveRiskLevel}>
              <Terrain
                dataPoints={resolvedDataPoints}
                activeKpiIndex={activeKpiIndex}
                activeLeverId={activeLeverId}
                leverIntensity01={leverIntensity01}
                scenario={scenarioId}
                baseColor={pathColor ?? scenarioColor}
                mode={mode}
                glowIntensity={glowIntensity}
                modeConfig={config}
                isDragging={isDragging}
                neuralPulse={neuralBootComplete}
                opacityMultiplier={terrainOpacityMultiplier}
                wireOpacityMultiplier={wireOpacityMultiplier}
                glowMultiplier={glowMultiplier}
                isRecalibrating={isRecalibrating}
                structuralHeat01={structuralHeat01}
                onMeshReady={onTerrainMeshReady}
                baselineHighVisibility={baselineHighVisibility}
              />
              {overlay}
            </CinematicController>
          )
        )}

        {/* GOD MODE: Interquartile Confidence Envelope (Section 3) */}
        {isGodMode && (
          <ConfidenceEnvelope
            dataPoints={resolvedDataPoints}
            spread={godModeMetrics.envelopeSpread}
            enabled
          />
        )}

        {/* GOD MODE: Structural Axes — EV ↑ + Time Horizon → (Section 4) */}
        {isGodMode && <StructuralAxes />}

        {/* GOD MODE: Baseline Reference Line (Section 5) */}
        {isGodMode && <BaselineRefLine height={-0.5} />}

        {/* GOD MODE: Ridge Line + Surface Annotations (Mountain Clarity) */}
        {isGodMode && (
          <>
            <TerrainRidgeLine dataPoints={resolvedDataPoints} enabled />
            <TerrainSurfaceAnnotations
              dataPoints={resolvedDataPoints}
              kpiValues={kpiValues}
              enabled
            />
          </>
        )}

        {/* Structural recalibration scan line — single sweep during simulation */}
        <RecalibrationScanLine active={isRecalibrating} />
        
        <DigitalHorizon
          scenarioId={scenarioId}
          glowMultiplier={isGodMode ? glowMultiplier * 0.5 : glowMultiplier}
          baseOpacity={terrainOpacityMultiplier}
          isRecalibrating={isRecalibrating}
        />

        {/* Strategic Path + Milestones overlays */}
        {showPath ? (
          <StrategicPath
            solverPath={solverPath?.length ? solverPath : [
              { riskIndex: 60, enterpriseValue: 1, runway: 12 },
              { riskIndex: 55, enterpriseValue: 2, runway: 16 },
              { riskIndex: 50, enterpriseValue: 3, runway: 20 },
              { riskIndex: 45, enterpriseValue: 4, runway: 26 },
              { riskIndex: 40, enterpriseValue: 5, runway: 32 },
            ]}
            color={pathColor ?? scenarioColor ?? SCENARIO_PALETTE_COLORS[scenarioId]?.active ?? "#22d3ee"}
            mode={mode}
            glowIntensity={glowIntensity}
          />
        ) : null}

        {/* Continuity cues: reality anchor + origin marker + forward cue (strategy only) */}
        <ContinuityCues
          enabled={mode === "strategy"}
          origin={(() => {
            const sp = solverPath?.length ? solverPath : [{ riskIndex: 60, enterpriseValue: 1, runway: 12 }];
            const p = sp[0];
            const maxR = Math.max(...sp.map(s => s.runway || 0), 1);
            const minEV = Math.min(...sp.map(s => s.enterpriseValue || 0));
            const maxEV = Math.max(...sp.map(s => s.enterpriseValue || 0), minEV + 1);
            const r01 = (p.runway ?? 0) / maxR;
            const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
            const risk01 = Math.max(0, Math.min(1, (p.riskIndex ?? 50) / 100));
            const x = -0.5 * 10;
            const y = -1.2;
            const z = (0.3 + r01 * 2.2 + ev01 * 1.2 - risk01 * 0.8) / (config.pathCutBoost ?? 1);
            return [x, y, z] as [number, number, number];
          })()}
          forward={(() => {
            const sp = solverPath?.length ? solverPath : [{ riskIndex: 60, enterpriseValue: 1, runway: 12 }];
            const p = sp[0];
            const maxR = Math.max(...sp.map(s => s.runway || 0), 1);
            const minEV = Math.min(...sp.map(s => s.enterpriseValue || 0));
            const maxEV = Math.max(...sp.map(s => s.enterpriseValue || 0), minEV + 1);
            const r01 = (p.runway ?? 0) / maxR;
            const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
            const risk01 = Math.max(0, Math.min(1, (p.riskIndex ?? 50) / 100));
            const x = -0.5 * 10;
            const y = -1.2;
            const z = (0.3 + r01 * 2.2 + ev01 * 1.2 - risk01 * 0.8) / (config.pathCutBoost ?? 1);
            return [x, y, z - 6] as [number, number, number];
          })()}
        />
        {showMilestones ? (
          <MilestoneOrbs
            color={pathColor ?? SCENARIO_PALETTE_COLORS[scenarioId]?.active ?? "#22d3ee"}
            mode={mode}
            glowIntensity={glowIntensity}
            solverPath={solverPath}
          />
        ) : null}
        
        {/* GOD MODE: Subtle auto-rotation + locked zoom | Default: standard controls */}
        <OrbitControls 
          enabled={controlsEnabled}
          enableZoom={false}
          enablePan={false}
          enableRotate={controlsEnabled ? (mode !== "ghost") : false}
          autoRotate={controlsEnabled ? (controlsAutoRotate ?? (isGodMode ? true : config.autoRotate)) : false}
          autoRotateSpeed={isGodMode ? 0.3 : config.autoRotateSpeed}
          rotateSpeed={0.4}
          minPolarAngle={isGodMode ? Math.PI / 3.5 : Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={baselineAllow360Rotate ? undefined : -Math.PI / 5}
          maxAzimuthAngle={baselineAllow360Rotate ? undefined : Math.PI / 5}
          onStart={() => setIsOrbiting(true)}
          onEnd={() => setIsOrbiting(false)}
          {...(mode === "strategy" ? { target: [0, 0, config.forwardTargetZ ?? 0] as [number, number, number] } : {})}
        />

        {/* Post-processing — God Mode: subtle bloom for rim glow | Default: celebration */}
        <EffectComposer enabled={isGodMode || (config.bloomIntensity > 0 && mode !== "ghost")}>
          <Bloom
            intensity={isGodMode ? 0.3 : config.bloomIntensity * glowIntensity}
            luminanceThreshold={isGodMode ? 0.4 : 0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette
            offset={0.5}
            darkness={isGodMode ? 0.5 : (mode === "celebration" ? 0.35 : 0)}
          />
        </EffectComposer>
          </>
        )}
        </Suspense>
      </Canvas>

      {/* GOD MODE: Model Credibility Footnote (Section 7) */}
      {isGodMode && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 12,
            zIndex: 5,
            fontSize: 9,
            fontWeight: 500,
            color: "rgba(148, 163, 184, 0.4)",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.02em",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          Model: 10,000 Monte Carlo runs | Median shown | IQR displayed
        </div>
      )}
    </div>
  );
}

export default ScenarioMountain;

// ============================================================================
// STRATEGIC PATH + MILESTONES (lightweight overlays; no terrain rewrite)
// ============================================================================

function StrategicPath({
  solverPath,
  color,
  mode,
  glowIntensity,
}: {
  solverPath: { riskIndex: number; enterpriseValue: number; runway: number }[];
  color: string;
  mode: MountainMode;
  glowIntensity: number;
}) {
  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS.default;
  const lineRef = useRef<any>(null);
  const glowRef = useRef<any>(null);

  // Map solverPath points into a compact, stable curve above the mountain.
  // This is intentionally heuristic: it gives a consistent "trajectory" overlay
  // without needing to know the terrain heightfield in world-space.
  const points = useMemo(() => {
    if (!solverPath?.length) return [];
    const maxRunway = Math.max(...solverPath.map((p) => p.runway || 0), 1);
    const minEV = Math.min(...solverPath.map((p) => p.enterpriseValue || 0));
    const maxEV = Math.max(...solverPath.map((p) => p.enterpriseValue || 0), minEV + 1);

    return solverPath.map((p, i) => {
      const t = solverPath.length <= 1 ? 0 : i / (solverPath.length - 1);
      const runway01 = (p.runway ?? 0) / maxRunway;
      const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
      const risk01 = clamp01((p.riskIndex ?? 50) / 100);

      const x = (t - 0.5) * 10;                 // left↔right across the scene
      const y = -1.2 + t * 0.8;                 // slightly forward over time
      const cutBoost = config.pathCutBoost ?? 1;
      const z = (0.3 + runway01 * 2.2 + ev01 * 1.2 - risk01 * 0.8) / cutBoost; // lift (deeper embed in strategy)
      return new THREE.Vector3(x, y, z);
    });
  }, [solverPath, config]);

  const curvePoints = useMemo(() => {
    if (points.length < 2) return points;
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
    return curve.getPoints(120);
  }, [points]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = mode === "celebration" ? (0.8 + Math.sin(t * 2) * 0.2) : 1;
    if (lineRef.current) {
      const m = lineRef.current.material as { opacity?: number } | undefined;
      if (m) m.opacity = (mode === "ghost" ? 0.2 : 0.95) * pulse;
      // Flow feel in celebration mode (dashed line offset)
      const md = lineRef.current.material as any;
      if (mode === "celebration" && md) md.dashOffset = -t * 0.8;
    }
    if (glowRef.current) {
      const m = glowRef.current.material as { opacity?: number } | undefined;
      if (m) m.opacity = 0.5 * config.pathGlow * glowIntensity * pulse;
      const mg = glowRef.current.material as any;
      if (mode === "celebration" && mg) mg.dashOffset = -t * 0.8;
    }
  });

  if (!curvePoints.length) return null;
  if (mode === "ghost" && config.pathGlow <= 0) return null;

  return (
    <group>
      {/* Outer glow layer for depth and realism */}
      <DreiLine
        ref={glowRef}
        points={curvePoints}
        color={color}
        transparent
        opacity={0.5 * config.pathGlow * glowIntensity}
        lineWidth={6}
        dashed={mode === "celebration"}
        dashScale={1}
        dashSize={0.8}
        gapSize={0.6}
      />
      {/* Core path line - thicker and more solid */}
      <DreiLine
        ref={lineRef}
        points={curvePoints}
        color={color}
        transparent
        opacity={mode === "ghost" ? 0.2 : 0.95}
        lineWidth={3}
        dashed={mode === "celebration"}
        dashScale={1}
        dashSize={0.8}
        gapSize={0.6}
      />
      {/* Strategy: trajectory halo (wider, semi-transparent glow) */}
      {mode === "strategy" && (
        <DreiLine
          points={curvePoints}
          color="#7dd3fc"
          lineWidth={3 * (config.trajectoryHaloWidthMult ?? 1.8)}
          transparent
          opacity={config.trajectoryHaloOpacity ?? 0.22}
        />
      )}
    </group>
  );
}

function MilestoneOrbs({
  color,
  mode,
  glowIntensity,
  solverPath,
}: {
  color: string;
  mode: MountainMode;
  glowIntensity: number;
  solverPath?: { riskIndex: number; enterpriseValue: number; runway: number }[];
}) {
  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS.default;

  const milestones = useMemo(() => {
    if (mode === "ghost") return [];
    const sp = solverPath?.length
      ? solverPath
      : [
          { riskIndex: 60, enterpriseValue: 1, runway: 12 },
          { riskIndex: 55, enterpriseValue: 2, runway: 16 },
          { riskIndex: 50, enterpriseValue: 3, runway: 20 },
          { riskIndex: 45, enterpriseValue: 4, runway: 26 },
          { riskIndex: 40, enterpriseValue: 5, runway: 32 },
        ];

    const maxRunway = Math.max(...sp.map((p) => p.runway || 0), 1);
    const minEV = Math.min(...sp.map((p) => p.enterpriseValue || 0));
    const maxEV = Math.max(...sp.map((p) => p.enterpriseValue || 0), minEV + 1);

    const pts = sp.map((p, i) => {
      const t = sp.length <= 1 ? 0 : i / (sp.length - 1);
      const runway01 = (p.runway ?? 0) / maxRunway;
      const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
      const risk01 = clamp01((p.riskIndex ?? 50) / 100);
      const x = (t - 0.5) * 10;
      const y = -1.2 + t * 0.8;
      const z = 0.3 + runway01 * 2.2 + ev01 * 1.2 - risk01 * 0.8;
      return new THREE.Vector3(x, y, z);
    });

    const typeOrder = ["revenue", "funding", "team", "revenue", "product"] as const;
    const picks = [0.15, 0.35, 0.55, 0.75, 0.92];

    return picks.map((t, idx) => {
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(t * (pts.length - 1))));
      return { pos: pts[i], type: typeOrder[idx] };
    });
  }, [solverPath, mode]);

  if (mode === "ghost") return null;

  const typeColors: Record<string, string> = {
    revenue: "#10b981",
    team: "#3b82f6",
    product: "#f59e0b",
    funding: "#a855f7",
    risk: "#ef4444",
  };

  return (
    <group>
      {milestones.map((m, i) => (
        <MilestoneOrb
          key={i}
          position={m.pos}
          color={typeColors[m.type] ?? color}
          mode={mode}
          glowIntensity={glowIntensity}
          glowMultiplier={config.glowMultiplier}
        />
      ))}
    </group>
  );
}

function MilestoneOrb({
  position,
  color,
  mode,
  glowIntensity,
  glowMultiplier,
}: {
  position: THREE.Vector3;
  color: string;
  mode: MountainMode;
  glowIntensity: number;
  glowMultiplier: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = position.y + Math.sin(t * 2) * 0.05;
    if (mode === "celebration") {
      const s = 1 + Math.sin(t * 3) * 0.2 * glowIntensity;
      meshRef.current.scale.setScalar(s);
      if (glowRef.current) glowRef.current.scale.setScalar(s * 2);
    }
  });

  return (
    <group position={position}>
      {mode === "celebration" ? (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.15 * glowMultiplier} depthWrite={false} />
        </mesh>
      ) : null}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glowMultiplier * glowIntensity * 0.35}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>
      {mode === "celebration" ? <pointLight color={color} intensity={glowIntensity * 0.35} distance={2} decay={2} /> : null}
    </group>
  );
}
