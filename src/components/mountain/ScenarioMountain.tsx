// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — Premium Mountain with Enhanced Peaks, Rim Light, and Refined Atmosphere

import React, { useMemo, useRef, useLayoutEffect, Suspense, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS, useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// TUNING CONSTANTS — Adjust these to fine-tune appearance
// ============================================================================

// A) PEAK & RIDGE TUNING
const EXTRA_PEAK_STRENGTH = 0.9;      // Secondary peak amplitude (0.5 = subtle, 1.2 = prominent)
const RIDGE_SHARPNESS_FACTOR = 1.55;  // Higher = sharper summit (1.4 = soft, 1.8 = sharp)
const MICRO_VARIATION_AMP = 0.12;     // Tiny deterministic roughness (0 = smooth, 0.2 = textured)

// B) RIM LIGHT TUNING
const RIM_LIGHT_INTENSITY = 0.35;     // Skyline brightness boost (0 = off, 0.5 = strong)
const RIM_LIGHT_FALLOFF = 0.7;        // How quickly rim fades (0.5 = wide, 1.0 = tight)

// C) ATMOSPHERE TUNING
const ATMOSPHERE_INTENSITY = 0.12;    // Upper haze opacity (0 = none, 0.2 = visible)
const VIGNETTE_INTENSITY = 0.25;      // Corner darkening (0 = none, 0.4 = strong)

// D) BASE HAZE TUNING
const BASE_HAZE_OPACITY = 0.08;       // Fog at mountain base (0 = none, 0.2 = heavy)
const BASE_HAZE_HEIGHT = 0.4;         // How high fog reaches (0.3 = low, 0.6 = high)

// ============================================================================
// CORE CONSTANTS — Don't change these
// ============================================================================

const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

const BASE_SCALE = 4.5;
const PEAK_SCALE = 3.0;
const MASSIF_SCALE = 4.5;
const RIDGE_SHARPNESS = RIDGE_SHARPNESS_FACTOR;
const CLIFF_BOOST = 1.15;

const SOFT_CEILING = 9.0;
const CEILING_START = 7.0;

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

// Deterministic micro-variation for surface texture (no frame-to-frame jitter)
function microVariation(x: number, z: number): number {
  const v1 = Math.sin(x * 3.7 + z * 2.1) * 0.4;
  const v2 = Math.cos(x * 5.3 - z * 4.2) * 0.3;
  const v3 = Math.sin(x * 8.1 + z * 6.5) * 0.2;
  return (v1 + v2 + v3) * MICRO_VARIATION_AMP;
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
// PALETTE WITH RIM LIGHT SUPPORT
// ============================================================================

function paletteForScenario(s: ScenarioId) {
  const colors = SCENARIO_COLORS[s];
  const primary = new THREE.Color(colors.primary);

  return {
    sky: new THREE.Color("#080C14"),
    low: new THREE.Color("#0a2830"),
    mid: primary.clone().lerp(new THREE.Color("#1a2a35"), 0.3),
    high: new THREE.Color("#ffffff").lerp(primary, 0.18),
    peak: new THREE.Color("#f0f5f8"),
    // Rim light colors
    rimWhite: new THREE.Color("#ffffff"),
    rimCyan: new THREE.Color("#60e0f0"),
  };
}

// Enhanced height color with rim light effect
function heightColor(
  h01: number, 
  pal: ReturnType<typeof paletteForScenario>, 
  illumination: number = 0,
  isRim: boolean = false
) {
  const t = clamp01(h01);
  let c: THREE.Color;

  if (t < 0.15) c = pal.sky.clone().lerp(pal.low, t / 0.15);
  else if (t < 0.45) c = pal.low.clone().lerp(pal.mid, (t - 0.15) / 0.3);
  else if (t < 0.75) c = pal.mid.clone().lerp(pal.high, (t - 0.45) / 0.3);
  else c = pal.high.clone().lerp(pal.peak, (t - 0.75) / 0.25);

  // Apply rim light to high points
  if (isRim && t > 0.6) {
    const rimStrength = Math.pow((t - 0.6) / 0.4, RIM_LIGHT_FALLOFF) * RIM_LIGHT_INTENSITY;
    // Blend toward white with cyan tint at edge
    c.lerp(pal.rimWhite, rimStrength * 0.7);
    c.lerp(pal.rimCyan, rimStrength * 0.3);
  }

  if (illumination > 0) {
    c.lerp(new THREE.Color("#ffffff"), illumination * 0.3);
  }

  return c;
}

// ============================================================================
// MASSIF PEAKS — With Additional Secondary Peak
// ============================================================================

interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
}

const MASSIF_PEAKS: MassifPeak[] = [
  // Main central peak
  { x: 0, z: -2, amplitude: 1.5, sigmaX: 2.8, sigmaZ: 2.4 },
  // Left major peak
  { x: -10, z: -1, amplitude: 1.2, sigmaX: 3.0, sigmaZ: 2.6 },
  // Right major peak  
  { x: 11, z: -1.5, amplitude: 1.1, sigmaX: 2.8, sigmaZ: 2.5 },
  // *** NEW: Secondary peak (slightly off-center, creates more interesting silhouette) ***
  { x: 5, z: -2.5, amplitude: EXTRA_PEAK_STRENGTH, sigmaX: 2.2, sigmaZ: 2.0 },
  // Supporting ridges
  { x: -3, z: 3, amplitude: 0.85, sigmaX: 3.5, sigmaZ: 3.0 },
  { x: -16, z: 2, amplitude: 0.6, sigmaX: 4.0, sigmaZ: 3.5 },
  { x: 17, z: 1, amplitude: 0.55, sigmaX: 3.8, sigmaZ: 3.2 },
  // Small accent ridge for sharper definition
  { x: -6, z: -3, amplitude: 0.45, sigmaX: 1.8, sigmaZ: 1.5 },
];

// ============================================================================
// TERRAIN COMPONENT — Enhanced with Rim Light
// ============================================================================

interface TerrainProps {
  dataPoints: number[];
  activeKpiIndex: number | null;
  activeLeverId: LeverId | null;
  leverIntensity01: number;
  scenario: ScenarioId;
  onFirstRender?: () => void;
}

const Terrain: React.FC<TerrainProps> = ({
  dataPoints,
  activeKpiIndex,
  activeLeverId,
  leverIntensity01,
  scenario,
  onFirstRender,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);
  const targetHeightsRef = useRef<Float32Array | null>(null);
  const currentHeightsRef = useRef<Float32Array | null>(null);
  const targetColorsRef = useRef<Float32Array | null>(null);
  const currentColorsRef = useRef<Float32Array | null>(null);
  const maxHeightRef = useRef(1);
  const hasRenderedRef = useRef(false);

  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);

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

  // Calculate target heights with enhanced sharpness
  useLayoutEffect(() => {
    if (!meshFillRef.current || !meshWireRef.current) return;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const count = pos.count;
    const wHalf = MESH_W / 2;
    const dHalf = MESH_D / 2;

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
    const rimFactors = new Float32Array(count);
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
        // Enhanced ridge sharpness with power curve
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;

        if (activeKpiIndex === idx) {
          illumination = Math.max(illumination, g * 0.6);
        }
      }

      let h = ridge * BASE_SCALE;

      // Apply massif peaks including new secondary peak
      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        h += g * m.amplitude * MASSIF_SCALE;
      }

      // Dynamic peaks from slider interaction
      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        h += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
      }

      // Ridge texture
      const rugged = ridgeNoise(x, z);
      h += rugged * (0.3 + h * 0.08);

      // Add deterministic micro-variation for surface realism
      h += microVariation(x, z) * Math.max(0.1, h * 0.15);

      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

      const n = noise2(x, z) * 0.2;

      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      heights[i] = finalH;
      illuminations[i] = illumination;
      
      // Calculate rim factor based on position relative to peak
      // Points near the "back" edge (negative z) get more rim light
      const zNorm = (z + dHalf) / MESH_D;
      rimFactors[i] = zNorm < 0.4 ? (0.4 - zNorm) / 0.4 : 0;
      
      if (finalH > maxH) maxH = finalH;
    }

    maxHeightRef.current = maxH;

    // Apply colors with rim light
    for (let i = 0; i < count; i++) {
      const h = heights[i];
      const h01 = clamp01(h / (maxH * 0.82));
      const isRim = rimFactors[i] > 0.2 && h01 > 0.5;
      const c = heightColor(h01, pal, illuminations[i], isRim);
      
      // Apply subtle depth falloff for far slopes
      const depthFade = 1 - rimFactors[i] * 0.15;
      
      targetColors[i * 3] = c.r * depthFade;
      targetColors[i * 3 + 1] = c.g * depthFade;
      targetColors[i * 3 + 2] = c.b * depthFade;
    }
  }, [dataPoints, peakModel, pal, activeKpiIndex]);

  // Smooth interpolation + subtle breathing
  const breathRef = useRef(0);
  
  useFrame((_, delta) => {
    if (!meshFillRef.current || !meshWireRef.current) return;
    if (!targetHeightsRef.current || !currentHeightsRef.current) return;
    if (!targetColorsRef.current || !currentColorsRef.current) return;

    // Subtle breathing - very slow heave
    breathRef.current += delta * 0.15; // Very slow cycle (~42 seconds full cycle)
    const breathAmount = Math.sin(breathRef.current) * 0.035; // Tiny amplitude

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count;

    const targets = targetHeightsRef.current;
    const currents = currentHeightsRef.current;
    const targetCols = targetColorsRef.current;
    const currentCols = currentColorsRef.current;

    const smoothing = 0.18;
    let needsUpdate = false;

    for (let i = 0; i < count; i++) {
      const diff = targets[i] - currents[i];
      if (Math.abs(diff) > 0.0005) {
        currents[i] += diff * smoothing;
        needsUpdate = true;
      } else {
        currents[i] = targets[i];
      }
      // Apply breathing to height - scales with current height so peaks breathe more
      const breathOffset = breathAmount * Math.max(0.1, currents[i] * 0.5);
      pos.setZ(i, currents[i] + breathOffset);

      for (let c = 0; c < 3; c++) {
        const ci = i * 3 + c;
        const colDiff = targetCols[ci] - currentCols[ci];
        if (Math.abs(colDiff) > 0.001) {
          currentCols[ci] += colDiff * smoothing;
        } else {
          currentCols[ci] = targetCols[ci];
        }
      }
      col.setXYZ(i, currentCols[i * 3], currentCols[i * 3 + 1], currentCols[i * 3 + 2]);
    }

    // Always update for breathing animation
    pos.needsUpdate = true;
    if (needsUpdate) {
      col.needsUpdate = true;
      geo.computeVertexNormals();

      const wireGeo = meshWireRef.current.geometry as THREE.PlaneGeometry;
      wireGeo.attributes.position.needsUpdate = true;
      wireGeo.computeVertexNormals();
    }

    if (!hasRenderedRef.current) {
      hasRenderedRef.current = true;
      onFirstRender?.();
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={0.02}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial vertexColors wireframe transparent opacity={0.75} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ============================================================================
// REFINED ATMOSPHERIC HAZE — Reduced base fog, premium upper atmosphere
// ============================================================================

interface AtmosphericHazeProps {
  riskLevel: number;
  viewMode: "operator" | "investor";
  scenario: ScenarioId;
}

// Deterministic particle positions (seeded, never changes)
const CORNER_PARTICLES = [
  // Top-left corner (3 particles)
  { x: 8, y: 6, size: 1.5, opacity: 0.10 },
  { x: 15, y: 12, size: 1, opacity: 0.08 },
  { x: 5, y: 18, size: 2, opacity: 0.12 },
  // Top-right corner (3 particles)
  { x: 92, y: 8, size: 1.5, opacity: 0.09 },
  { x: 85, y: 15, size: 1, opacity: 0.11 },
  { x: 95, y: 20, size: 2, opacity: 0.08 },
];

function AtmosphericHaze({ riskLevel, viewMode, scenario }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = viewMode === "investor" ? 0.7 : 1.0;
  
  const scenarioTone = scenario === "extreme" ? 1.15 : 
                       scenario === "downside" ? 1.08 : 
                       scenario === "upside" ? 0.9 : 1.0;
  
  // REDUCED: Base haze significantly lowered
  const baseHazeOpacity = BASE_HAZE_OPACITY * (1 + riskFactor * 0.3) * scenarioTone * viewFactor;
  
  // Upper atmosphere - subtle premium fill
  const atmosphereOpacity = ATMOSPHERE_INTENSITY * viewFactor;
  const vignetteOpacity = VIGNETTE_INTENSITY * viewFactor;

  return (
    <div className="atmospheric-haze">
      {/* ULTRA-SPARSE CORNER PARTICLES - Top corners only, behind everything */}
      <div className="corner-particles">
        {CORNER_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="corner-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity * viewFactor,
            }}
          />
        ))}
      </div>
      
      {/* UPPER ATMOSPHERE - Subtle cool haze fills stark black */}
      <div className="haze-layer atmosphere-upper" style={{ opacity: atmosphereOpacity }} />
      
      {/* VIGNETTE - Frames the mountain, darkens corners */}
      <div className="haze-layer atmosphere-vignette" style={{ opacity: vignetteOpacity }} />
      
      {/* HORIZON GLOW - Very subtle warmth at horizon line */}
      <div className="haze-layer atmosphere-horizon" style={{ opacity: atmosphereOpacity * 0.5 }} />
      
      {/* REDUCED BASE HAZE - Tight to mountain contact zone only */}
      <div className="haze-layer base-haze" style={{ opacity: baseHazeOpacity }} />

      <style>{`
        .atmospheric-haze {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        
        /* ULTRA-SPARSE CORNER PARTICLES */
        .corner-particles {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        
        .corner-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(200, 215, 230, 0.9);
          filter: blur(0.5px);
          /* Extremely slow drift - imperceptible */
          animation: particle-drift 120s linear infinite;
        }
        
        @keyframes particle-drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(2px, 3px); }
          100% { transform: translate(0, 0); }
        }
        
        .haze-layer { 
          position: absolute; 
          inset: 0; 
        }
        
        /* UPPER ATMOSPHERE - Cool gradient from top */
        .atmosphere-upper {
          background: linear-gradient(
            to bottom,
            rgba(15, 25, 40, 0.4) 0%,
            rgba(12, 20, 32, 0.25) 15%,
            rgba(10, 16, 26, 0.12) 35%,
            transparent 55%
          );
        }
        
        /* VIGNETTE - Dark corners for premium framing */
        .atmosphere-vignette {
          background: radial-gradient(
            ellipse 85% 75% at 50% 50%,
            transparent 40%,
            rgba(4, 8, 14, 0.4) 80%,
            rgba(2, 4, 8, 0.6) 100%
          );
        }
        
        /* HORIZON - Subtle glow line */
        .atmosphere-horizon {
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(20, 35, 50, 0.08) 62%,
            rgba(15, 28, 42, 0.05) 68%,
            transparent 78%
          );
        }
        
        /* BASE HAZE - REDUCED: Tight contact zone only */
        .base-haze {
          background: radial-gradient(
            ellipse 90% ${BASE_HAZE_HEIGHT * 100}% at 50% 85%,
            rgba(8, 16, 26, 0.35) 0%,
            rgba(6, 12, 20, 0.15) 50%,
            transparent 80%
          );
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// GRID HELPER
// ============================================================================

function SubtleGrid() {
  return (
    <gridHelper 
      args={[60, 40, "#0a1520", "#0a1520"]} 
      position={[0, -2.5, 0]} 
      rotation={[0, 0, 0]}
    />
  );
}

// ============================================================================
// SCENE CONTENT — Enhanced lighting for rim effect
// ============================================================================

interface SceneContentProps {
  scenario: ScenarioId;
  dataPoints: number[];
  activeKpiIndex: number | null;
  activeLeverId: LeverId | null;
  leverIntensity01: number;
  onFirstRender: () => void;
}

function SceneContent({ 
  scenario, 
  dataPoints, 
  activeKpiIndex, 
  activeLeverId, 
  leverIntensity01,
  onFirstRender 
}: SceneContentProps) {
  const colors = SCENARIO_COLORS[scenario];
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 6, 32]} fov={38} />
      
      {/* Ambient fill */}
      <ambientLight intensity={0.12} />
      
      {/* Main key light */}
      <directionalLight position={[8, 20, 10]} intensity={0.4} color="#ffffff" />
      
      {/* Colored accent light */}
      <directionalLight position={[-6, 12, -8]} intensity={0.08} color={colors.primary} />
      
      {/* Top glow */}
      <pointLight position={[0, 8, 0]} intensity={0.1} color={colors.primary} distance={30} decay={2} />
      
      {/* Bottom-left fill */}
      <pointLight position={[-18, 2, 8]} intensity={0.25} color="#a0c0d0" distance={35} decay={2} />
      
      {/* RIM LIGHT - Behind mountain for skyline emphasis */}
      <directionalLight 
        position={[0, 15, -20]} 
        intensity={RIM_LIGHT_INTENSITY * 0.8} 
        color="#e0f0ff" 
      />
      
      <Terrain
        dataPoints={dataPoints}
        activeKpiIndex={activeKpiIndex}
        activeLeverId={activeLeverId}
        leverIntensity01={leverIntensity01}
        scenario={scenario}
        onFirstRender={onFirstRender}
      />
      
      <SubtleGrid />
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
    </>
  );
}

// ============================================================================
// MAIN EXPORT — Anti-Flicker Protected
// ============================================================================

interface ScenarioMountainProps {
  scenario: ScenarioId;
  dataPoints: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
}

export default function ScenarioMountain({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  activeLeverId = null,
  leverIntensity01 = 0,
  className,
}: ScenarioMountainProps) {
  const colors = SCENARIO_COLORS[scenario];
  const viewMode = useScenarioStore((s) => s.viewMode);
  const kpiValues = useScenarioStore((s) => s.kpiValues);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [hasValidSize, setHasValidSize] = useState(false);
  
  const riskLevel = kpiValues.riskIndex?.value ?? 25;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 10 && height > 10) {
        setHasValidSize(true);
      }
    };

    checkSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 10 && height > 10) {
          setHasValidSize(true);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleFirstRender = useCallback(() => {
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(new THREE.Color("#060a10"), 0);
    
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("WebGL context lost");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      console.info("WebGL context restored");
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`mountain-container-wrapper ${className ?? ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: `radial-gradient(ellipse 70% 50% at 50% 60%, ${colors.glow}, transparent 60%), #060a10`,
      }}
    >
      <AtmosphericHaze 
        riskLevel={riskLevel}
        viewMode={viewMode}
        scenario={scenario}
      />
      
      <div
        className="canvas-wrapper"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.3s ease-out",
          contain: "strict",
        }}
      >
        {hasValidSize && (
          <Canvas
            gl={{ 
              antialias: true, 
              alpha: true, 
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
            }}
            dpr={[1, Math.min(2, window.devicePixelRatio)]}
            style={{ 
              position: "absolute",
              inset: 0,
              background: "transparent",
            }}
            onCreated={handleCreated}
          >
            <Suspense fallback={null}>
              <SceneContent
                scenario={scenario}
                dataPoints={dataPoints}
                activeKpiIndex={activeKpiIndex}
                activeLeverId={activeLeverId}
                leverIntensity01={leverIntensity01}
                onFirstRender={handleFirstRender}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {!isReady && (
        <div
          className="loading-placeholder"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: "transparent",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
