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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Line as DreiLine, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { NeuralBackground } from "@/components/visuals/NeuralBackground";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useShallow } from "zustand/react/shallow";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { StoreScenario as Scenario, ScenarioId, useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";
import { useSimulationStore } from "@/state/simulationStore";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { setStructuralHeatTint } from "@/logic/mountain/mountainSurfaceMaterial";

import { clamp01, lerp, smoothSeismicNoise } from "./helpers";
import { ContinuityCues } from "./markers";
import { SCENARIO_PALETTE_COLORS, paletteForScenario, heightColor, godModePalette } from "./materials";
import { MilestoneOrbs, StrategicPath } from "./paths";
import { sampleMountainHeight } from "./terrainSampler";
import { MODE_CONFIGS, type ModeConfig, type MountainMode } from "./types";
import {
  GRID_W, GRID_D, MESH_W, MESH_D, ISLAND_RADIUS,
  BASE_SCALE, PEAK_SCALE, MASSIF_SCALE, RIDGE_SHARPNESS, CLIFF_BOOST,
  SOFT_CEILING, CEILING_START,
  noise2, ridgeNoise, ridgeLayer, gaussian1, gaussian2, applySoftCeiling,
  type MassifPeak, MASSIF_PEAKS, ridgeSpineHeight, erosionHeight,
} from "./terrainGeometry";
import AtmosphericHaze from "./AtmosphericHaze";
import {
  GhostTerrain, RecalibrationScanLine, ConfidenceEnvelope,
  StructuralAxes, BaselineRefLine, TerrainRidgeLine,
  TerrainSurfaceAnnotations, DigitalHorizon,
  CinematicController, BaselineAutoRotate, CameraResetEffect,
} from "./ScenarioMountainOverlays";
import EVHeatLayer from "@/components/mountain/EVHeatLayer";
import ProbabilityFogLayer from "@/components/mountain/ProbabilityFogLayer";
import RiskWeatherLayer from "@/components/mountain/RiskWeatherLayer";

// Geometry constants, noise functions, and MassifPeaks → ./terrainGeometry.ts

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

      // Layer 1: MACRO
      let macro = ridge * BASE_SCALE;

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        macro += g * m.amplitude * MASSIF_SCALE;
      }

      // Structural ridge spines connecting peaks
      macro += ridgeSpineHeight(x, z) * MASSIF_SCALE;

      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        macro += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
      }

      // Layer 2: RIDGE STRUCTURE sculpt — carves valleys, lifts crests
      const ridgeMod = ridgeLayer(x, z);
      let h = macro * (0.80 + ridgeMod * 0.40);

      // Layer 3: MICRO DETAIL
      h += ridgeNoise(x, z) * (0.18 + h * 0.03);

      // Left-face erosion (positive X)
      h += erosionHeight(x, z);

      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.5));

      const n = noise2(x, z) * 0.25;

      const cliff = Math.pow(mask, 0.40) * CLIFF_BOOST;
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
          color={godMode ? "#1a2e42" : baselineHighVisibility ? (baseColor ?? "#22d3ee") : (neuralPulse ? "#00ffff" : undefined)}
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

// AtmosphericHaze → ./AtmosphericHaze.tsx
// GhostTerrain, RecalibrationScanLine, ConfidenceEnvelope, StructuralAxes,
// BaselineRefLine, TerrainRidgeLine, TerrainSurfaceAnnotations, DigitalHorizon,
// CinematicController, BaselineAutoRotate, CameraResetEffect → ./ScenarioMountainOverlays.tsx


// ============================================================================
// MAIN EXPORT
// ============================================================================

export interface ScenarioMountainProps {
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
  /** Optional: force camera + controls to reset to defaults when changed. */
  resetViewKey?: number;
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

function CameraDebugExpose() {
  const { camera, controls } = useThree((state: any) => ({
    camera: state.camera,
    controls: (state as any).controls,
  }))

  useEffect(() => {
    ;(window as any).__STRATFIT_CAMERA__ = camera
    ;(window as any).__STRATFIT_CONTROLS__ = controls
    console.log('STRATFIT camera exposed', camera)
    console.log('STRATFIT controls exposed', controls)
  }, [camera, controls])

  return null
}

export function ScenarioMountainImpl({
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
  resetViewKey,
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

  // Timeline: map resolvedDataPoints to a 3D polyline above the terrain surface.
  // Points run left→right (X axis), height from data, slight Y lift for visibility.
  const timelinePoints = useMemo((): [number, number, number][] => {
    if (!timelineEnabled || !resolvedDataPoints?.length) return []
    const pts = resolvedDataPoints
    const count = pts.length
    const xRange = 840  // matches terrain plane width * scaleX
    return pts.map((v, i): [number, number, number] => {
      const x = (i / Math.max(count - 1, 1)) * xRange - xRange / 2
      const y = (v / 100) * 18 + 2.5  // normalized height + float above surface
      return [x, y, 0]
    })
  }, [timelineEnabled, resolvedDataPoints])

  // Heatmap: derive per-segment intensity from data to drive color opacity overlay
  const heatmapSegments = useMemo(() => {
    if (!heatmapEnabled || !resolvedDataPoints?.length) return []
    const pts = resolvedDataPoints
    const count = pts.length
    const xRange = 840
    return pts.map((v, i) => ({
      x: (i / Math.max(count - 1, 1)) * xRange - xRange / 2,
      intensity: Math.max(0, Math.min(1, v / 100)),
    }))
  }, [heatmapEnabled, resolvedDataPoints])

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

  // OrbitControls ref (used for deterministic Reset View)
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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
          ? [0, 16, 31]
          : [0, 6, 32 * (mode === "strategy" ? (MODE_CONFIGS.strategy.forwardCamZMult ?? 1) : 1)]
      ) as [number, number, number],
      fov: isGodMode ? 34 : 38,
    }),
    [isGodMode, mode]
  );

  const orbitTarget = useMemo(
    () => (mode === "strategy"
      ? ([0, 0, (config.forwardTargetZ ?? 0)] as [number, number, number])
      : ([0, 0, 0] as [number, number, number])
    ),
    [config.forwardTargetZ, mode]
  );

  const allowStrategyZoom = mode === "strategy" && !isGodMode;
  const strategyDistance = useMemo(() => {
    if (!allowStrategyZoom) return null;
    const [cx, cy, cz] = cameraConfig.position;
    const [tx, ty, tz] = orbitTarget;
    const dx = cx - tx;
    const dy = cy - ty;
    const dz = cz - tz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [allowStrategyZoom, cameraConfig.position, orbitTarget]);

  const strategyMinDistance = strategyDistance ? strategyDistance * 0.85 : undefined;
  const strategyMaxDistance = strategyDistance ? strategyDistance * 1.75 : undefined;

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
        <CameraDebugExpose />
        {/* Scene clear + fog (Baseline can opt into transparentScene for photo-backed stages) */}
        {!transparentScene && <color attach="background" args={[isGodMode ? '#0a0f16' : '#081828']} />}
        {mode === "strategy" ? (
          <fog attach="fog" args={[config.fogColor ?? "#0b1020", config.fogNear ?? 18, config.fogFar ?? 90]} />
        ) : !transparentScene ? (
          <fog attach="fog" args={[isGodMode ? '#0a0f16' : '#081828', godFogNear, godFogFar]} />
        ) : null}

        <ambientLight intensity={mode === "strategy" ? 0.95 : 1.0} color="#1a4a6a" />
        <directionalLight
          position={[6, 10, 6]}
          intensity={mode === "strategy" ? 1.35 : 1.3}
          color="#5ad0ff"
          castShadow
        />
        <directionalLight
          position={[-4, 6, -4]}
          intensity={mode === "strategy" ? 0.72 : 0.62}
          color="#3aafee"
        />
        <directionalLight
          position={[0, 4, 8]}
          intensity={0.34}
          color="#2090cc"
        />
        <hemisphereLight args={["#3aafee", "#081828", 0.52]} />

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

        {/* GOD MODE: Terrain Intelligence Overlays (T-INT-2) */}
        {isGodMode && (
          <>
            <EVHeatLayer
              enterpriseValueMedian={kpiValues.enterpriseValue?.value ?? 0}
              baselineEV={godModeMetrics.evFactor * 10_000_000}
            />
            <ProbabilityFogLayer
              p10={fullSimResult?.arrPercentiles?.p10 ?? (kpiValues.enterpriseValue?.value ?? 0) * 0.6}
              p50={fullSimResult?.arrPercentiles?.p50 ?? (kpiValues.enterpriseValue?.value ?? 0)}
              p90={fullSimResult?.arrPercentiles?.p90 ?? (kpiValues.enterpriseValue?.value ?? 0) * 1.4}
            />
            <RiskWeatherLayer
              riskIndex={kpiValues.riskIndex?.value ?? 50}
              runwayMonths={kpiValues.runway?.value ?? 24}
              volatility={clamp01((godModeMetrics.envelopeSpread - 0.05) / 0.45)}
            />
          </>
        )}

        {/* Structural recalibration scan line — single sweep during simulation */}
        <RecalibrationScanLine active={isRecalibrating} />

        {/* ── TIMELINE OVERLAY — historical progression polyline above terrain surface ── */}
        {timelineEnabled && timelinePoints.length >= 2 && (
          <DreiLine
            points={timelinePoints}
            color="#22d3ee"
            lineWidth={1.5}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        )}

        {/* ── HEATMAP OVERLAY — flat intensity columns at data positions ── */}
        {heatmapEnabled && heatmapSegments.length > 0 && heatmapSegments.map((seg, i) => (
          <mesh
            key={i}
            position={[seg.x, (seg.intensity * 9), 0]}
            renderOrder={10}
          >
            <boxGeometry args={[840 / Math.max(heatmapSegments.length, 1) * 0.8, seg.intensity * 18, 2]} />
            <meshBasicMaterial
              color={new THREE.Color().setHSL(0.56 - seg.intensity * 0.56, 0.9, 0.5)}
              transparent
              opacity={0.18 + seg.intensity * 0.22}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        
        <DigitalHorizon
          scenarioId={scenarioId}
          glowMultiplier={isGodMode ? glowMultiplier * 0.5 : glowMultiplier}
          baseOpacity={terrainOpacityMultiplier}
          isRecalibrating={isRecalibrating}
        />

        {/* Strategic Path + Milestones overlays: always on in God Mode */}
        {(showPath || isGodMode) ? (
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
            dataPoints={resolvedDataPoints}
          />
        ) : null}

        {/* Continuity cues: reality anchor + origin marker + forward cue (strategy / god mode) */}
        <ContinuityCues
          enabled={mode === "strategy" || isGodMode}
          origin={(() => {
            const sp = solverPath?.length ? solverPath : [{ riskIndex: 60, enterpriseValue: 1, runway: 12 }];
            const p = sp[0];
            const maxR = Math.max(...sp.map(s => s.runway || 0), 1);
            const minEV = Math.min(...sp.map(s => s.enterpriseValue || 0));
            const maxEV = Math.max(...sp.map(s => s.enterpriseValue || 0), minEV + 1);
            const r01 = (p.runway ?? 0) / maxR;
            const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
            const risk01 = Math.max(0, Math.min(1, (p.riskIndex ?? 50) / 100));
            const mesh_x = -0.5 * 10;
            const mesh_y = -1.2;
            const terrainH = sampleMountainHeight(mesh_x, mesh_y, resolvedDataPoints);
            const mesh_z = terrainH + 0.35 + (r01 * 0.3 + ev01 * 0.15 - risk01 * 0.1);
            // mesh-local → world: rotation[-π/2,0,0], pos[0,-2,0], scale 0.9
            return [mesh_x * 0.9, mesh_z * 0.9 - 2, -mesh_y * 0.9] as [number, number, number];
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
            // Forward point: same x, advance depth by 6 mesh units
            const mesh_x = -0.5 * 10;
            const mesh_y_fwd = -1.2 - 6; // 6 mesh units deeper
            const terrainH = sampleMountainHeight(mesh_x, mesh_y_fwd, resolvedDataPoints);
            const mesh_z = terrainH + 0.35 + (r01 * 0.3 + ev01 * 0.15 - risk01 * 0.1);
            return [mesh_x * 0.9, mesh_z * 0.9 - 2, -mesh_y_fwd * 0.9] as [number, number, number];
          })()}
        />
        {(showMilestones || isGodMode) ? (
          <MilestoneOrbs
            color={pathColor ?? SCENARIO_PALETTE_COLORS[scenarioId]?.active ?? "#22d3ee"}
            mode={mode}
            glowIntensity={glowIntensity}
            solverPath={solverPath}
            dataPoints={resolvedDataPoints}
          />
        ) : null}

        {/* Guard: skip camera reset when god mode / cinematic camera is driving */}
        {!isGodMode && (
          <CameraResetEffect
            resetKey={resetViewKey}
            controlsRef={controlsRef}
            cameraPosition={cameraConfig.position}
            target={orbitTarget}
          />
        )}
        
        {/* GOD MODE: Subtle auto-rotation + locked zoom | Default: standard controls */}
        <OrbitControls 
          ref={controlsRef}
          enabled={controlsEnabled}
          enableZoom={allowStrategyZoom && controlsEnabled}
          {...(allowStrategyZoom && strategyMinDistance !== undefined && strategyMaxDistance !== undefined
            ? { minDistance: strategyMinDistance, maxDistance: strategyMaxDistance, zoomSpeed: 0.9 }
            : {})}
          enablePan={false}
          enableRotate={controlsEnabled ? (mode !== "ghost") : false}
          autoRotate={controlsEnabled ? (controlsAutoRotate ?? (isGodMode ? true : config.autoRotate)) : false}
          autoRotateSpeed={isGodMode ? 0.3 : config.autoRotateSpeed}
          rotateSpeed={0.8}
          minPolarAngle={isGodMode ? Math.PI / 3.5 : Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={undefined}
          maxAzimuthAngle={undefined}
          onStart={() => setIsOrbiting(true)}
          onEnd={() => setIsOrbiting(false)}
          {...(mode === "strategy" ? { target: orbitTarget } : {})}
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

export default ScenarioMountainImpl;
