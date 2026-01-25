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
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { NeuralBackground } from "@/components/visuals/NeuralBackground";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, useScenarioStore } from "@/state/scenarioStore";
import { useUIStore } from "@/state/uiStore";

// ============================================================================
// CONSTANTS — STABLE VERSION
// ============================================================================

const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

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

function paletteForScenario(s: ScenarioId) {
  // Get scenario-specific primary color
  const scenarioColor = SCENARIO_PALETTE_COLORS[s] || SCENARIO_PALETTE_COLORS.base;
  const primary = new THREE.Color(scenarioColor.idle);

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
  isDragging?: boolean; // For dynamic brightness
  neuralPulse?: boolean; // NEURAL BOOT: Flash bright cyan when KPI boot completes
}

const Terrain: React.FC<TerrainProps> = ({
  dataPoints,
  activeKpiIndex,
  activeLeverId,
  leverIntensity01,
  scenario,
  isDragging = false,
  neuralPulse = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);
  const targetHeightsRef = useRef<Float32Array | null>(null);
  const currentHeightsRef = useRef<Float32Array | null>(null);
  const targetColorsRef = useRef<Float32Array | null>(null);
  const currentColorsRef = useRef<Float32Array | null>(null);
  const maxHeightRef = useRef(1);

  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);

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
  
  useFrame((_, delta) => {
    if (!meshFillRef.current || !meshWireRef.current) return;
    if (!targetHeightsRef.current || !currentHeightsRef.current) return;
    if (!targetColorsRef.current || !currentColorsRef.current) return;

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

    const smoothing = 0.7;

    for (let i = 0; i < count; i++) {
      const baseTarget = targets[i];
      
      // Apply breathing offset based on height (taller peaks breathe more)
      const heightFactor = baseTarget / Math.max(maxHeightRef.current, 1);
      const breathOffset = breathIntensity * heightFactor * (breathCycle + breathWave * 0.3);
      const breathingTarget = baseTarget + breathOffset;
      
      const diff = breathingTarget - currents[i];
      if (Math.abs(diff) > 0.0001) {
        currents[i] += diff * smoothing;
      } else {
        currents[i] = breathingTarget;
      }
      pos.setZ(i, currents[i]);

      for (let c = 0; c < 3; c++) {
        const ci = i * 3 + c;
        const colDiff = targetCols[ci] - currentCols[ci];
        if (Math.abs(colDiff) > 0.0003) {
          currentCols[ci] += colDiff * smoothing;
        } else {
          currentCols[ci] = targetCols[ci];
        }
      }
      col.setXYZ(i, currentCols[i * 3], currentCols[i * 3 + 1], currentCols[i * 3 + 2]);
    }

    // Always update for continuous breathing
      pos.needsUpdate = true;
      col.needsUpdate = true;
      geo.computeVertexNormals();

      const wireGeo = meshWireRef.current.geometry as THREE.PlaneGeometry;
      wireGeo.attributes.position.needsUpdate = true;
      wireGeo.computeVertexNormals();
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* FILL — Subtle depth layer, brighter when engaged */}
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={isDragging ? 0.25 : 0.12}
          roughness={0.2}
          metalness={0.8}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={isDragging ? 0.15 : 0.06}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* WIREFRAME — Luminous Teal at rest, Electric Cyan when active */}
      {/* NEURAL BOOT: Bright pulse when neuralPulse is true */}
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial 
          vertexColors={!neuralPulse} // Override colors during pulse
          color={neuralPulse ? "#00ffff" : undefined}
          wireframe 
          transparent 
          // VISIBILITY BOOST: 0.6 idle, 1.0 active, 1.0 during neural pulse
          opacity={neuralPulse ? 1.0 : isDragging ? 1.0 : 0.6}
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
}

function AtmosphericHaze({ riskLevel, viewMode, scenario, isSeismicActive = false }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = (viewMode === "investor" || viewMode === "data") ? 0.7 : 1.0;
  
  const scenarioTone = scenario === "stress" ? 1.2 : 
                       scenario === "downside" ? 1.1 : 
                       scenario === "upside" ? 0.85 : 1.0;
  
  // Reduced base opacity for bottom haze
  const baseOpacity = 0.18 + (riskFactor * 0.08 * scenarioTone);
  const finalOpacity = baseOpacity * viewFactor;
  
  // Altitude haze opacity (above mountain)
  const altitudeOpacity = 0.08 * viewFactor;
  
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
      {/* REDUCED bottom haze layers */}
      <div 
        className="haze-layer haze-deep"
        style={{ opacity: finalOpacity * 0.35 }}
      />
      <div 
        className="haze-layer haze-mid"
        style={{ opacity: finalOpacity * 0.25 }}
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

        /* ALTITUDE HAZE - vertical gradient above mountain */
        .haze-altitude {
          background: linear-gradient(
            to bottom,
            rgba(18, 28, 42, 0.35) 0%,
            rgba(14, 22, 34, 0.2) 20%,
            rgba(10, 18, 28, 0.08) 40%,
            transparent 55%
          );
        }

        /* PRESSURE BAND - subtle horizontal density above peak */
        .haze-pressure-band {
          background: linear-gradient(
            to bottom,
            transparent 15%,
            rgba(22, 34, 48, 0.15) 25%,
            rgba(18, 28, 42, 0.1) 32%,
            transparent 42%
          );
          filter: blur(8px);
        }

        /* REDUCED: Bottom haze layers */
        .haze-deep {
          background: radial-gradient(
            ellipse 120% 60% at 50% 70%,
            rgba(10, 20, 32, 0.5) 0%,
            rgba(8, 16, 26, 0.25) 40%,
            transparent 65%
          );
        }

        .haze-mid {
          background: radial-gradient(
            ellipse 100% 50% at 45% 65%,
            rgba(14, 26, 40, 0.35) 0%,
            rgba(10, 20, 32, 0.15) 35%,
            transparent 55%
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

function GhostTerrain({ isVisible }: { isVisible: boolean }) {
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
  const targetOpacity = isVisible ? 0.08 : 0;  // 8% wireframe — subtle reference
  const fillOpacity = isVisible ? 0.02 : 0;    // 2% fill — barely there
  
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
// DIGITAL HORIZON — Infinite Floor Grid + Data Dust (Scenario-Aware)
// ============================================================================

// Grid colors that complement each scenario
const SCENARIO_GRID_COLORS: Record<ScenarioId, string> = {
  base: "#38bdf8",     // Sky Blue
  upside: "#34d399",   // Emerald
  downside: "#fbbf24", // Amber
  stress: "#f87171",   // Red
};

function DigitalHorizon({ scenarioId }: { scenarioId: ScenarioId }) {
  const gridColor = SCENARIO_GRID_COLORS[scenarioId] || SCENARIO_GRID_COLORS.base;
  const lightColor = SCENARIO_PALETTE_COLORS[scenarioId]?.idle || "#22d3ee";
  
  return (
    <>
      {/* 1. The Infinite Floor Grid — Color matches scenario */}
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
      
      {/* 2. NEURAL CONSTELLATION — Floating nodes that connect when simulating */}
      <NeuralBackground />
      
      {/* 3. SUBSURFACE GLOW — Color matches scenario */}
      <pointLight 
        position={[0, -4, 0]} 
        intensity={1.2}
        color={lightColor}        // Dynamic scenario color
        distance={25} 
        decay={2}
      />
      <pointLight 
        position={[0, -3, 5]} 
        intensity={0.7}
        color={lightColor}        // Dynamic scenario color
        distance={18} 
        decay={2}
      />
    </>
  );
}

// ============================================================================
// CINEMATIC CONTROLLER — "Search Pattern" Idle Animation
// ============================================================================

interface CinematicControllerProps {
  children: React.ReactNode;
  riskLevel?: number;
}

function CinematicController({ children, riskLevel = 0 }: CinematicControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hasInteracted = useUIStore((s) => s.hasInteracted);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // 1. RISK REACTION (Seismic Shake) — Always active when risk is high
    const riskShake = riskLevel > 40 
      ? (Math.random() - 0.5) * 0.015 * (riskLevel / 100) 
      : 0;
    
    if (!hasInteracted) {
      // 2. IDLE MODE: THE "SEARCH PATTERN"
      // Creates a mesmerizing non-repeating orbit by mixing different frequencies
      
      // Yaw (Left <-> Right): Wide slow sweep with variation
      const yaw = Math.sin(t * 0.18) * 0.45 + Math.sin(t * 0.07) * 0.15;
      groupRef.current.rotation.y = yaw;
      
      // Pitch (Up <-> Down): Slight vertical tilt to show depth
      const pitch = Math.cos(t * 0.25) * 0.12 + Math.sin(t * 0.11) * 0.05;
      groupRef.current.rotation.x = pitch;
      
      // Roll (Tilt): Very subtle banking as it "flies"
      const roll = Math.sin(t * 0.3) * 0.03;
      groupRef.current.rotation.z = roll;
      
      // Bobbing (Floating): Gentle breathing + seismic shake
      const bobbing = Math.sin(t * 0.4) * 0.12 + Math.cos(t * 0.22) * 0.06;
      groupRef.current.position.y = bobbing + riskShake;
      
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
// MAIN EXPORT
// ============================================================================

interface ScenarioMountainProps {
  scenario: ScenarioId;
  dataPoints: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
}

export default function ScenarioMountain({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  activeLeverId = null,
  leverIntensity01 = 0,
  className,
  timelineEnabled = false,
  heatmapEnabled = false,
}: ScenarioMountainProps) {
  const viewMode = useScenarioStore((s) => s.viewMode);
  
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

  const engineResult = engineResults?.[activeScenarioId];
  const kpiValues = engineResult?.kpis || {};
  
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

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: "radial-gradient(circle at 50% 60%, #0f172a 0%, #0b1220 100%)",
        minHeight: '400px',
        height: '100%',
        width: '100%',
      }}
    >
      {/* THE VIGNETTE — Deep shadow frame */}
      <div 
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          boxShadow: "inset 0 0 120px rgba(11, 18, 32, 0.8)",
        }}
      />
      
      <AtmosphericHaze 
        riskLevel={effectiveRiskLevel}
        viewMode={viewMode}
        scenario={scenario}
        isSeismicActive={isSeismicActive}
      />
      
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, background: "transparent" }}
        fallback={<div style={{ width: "100%", height: "100%", background: "#0d1117" }} />}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <Suspense fallback={null}>
        <color attach="background" args={['#0b1220']} />
        <fog attach="fog" args={['#0b1220', 35, 95]} />
        
        <PerspectiveCamera makeDefault position={[0, 6, 32]} fov={38} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[8, 20, 10]} intensity={0.4} color="#ffffff" />
        <directionalLight position={[-6, 12, -8]} intensity={0.06} color="#0ea5e9" />
        <pointLight position={[0, 8, 0]} intensity={0.08} color="#0ea5e9" distance={30} decay={2} />
        
        <GhostTerrain isVisible={hasInteracted} />
        
        <CinematicController riskLevel={effectiveRiskLevel}>
        <Terrain
          dataPoints={dataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenario}
          isDragging={isDragging}
          neuralPulse={neuralBootComplete}
        />
        </CinematicController>
        
        <DigitalHorizon scenarioId={scenario} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={true}
          rotateSpeed={0.4}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 5}
          maxAzimuthAngle={Math.PI / 5}
        />
        </Suspense>
      </Canvas>
    </div>
  );
}
