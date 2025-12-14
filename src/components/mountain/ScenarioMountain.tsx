// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — Mountain Engine Step 5
// The mountain must feel like it cannot lie.

import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS, useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// CONSTANTS — GEOLOGICAL AUTHORITY
// ============================================================================

const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

// Height scales — 8% increase for peak authority
const BASE_SCALE = 3.9;
const PEAK_SCALE = 6.5;        // +8% for drama
const MASSIF_SCALE = 5.4;      // +8% for presence
const RIDGE_SHARPNESS = 1.9;
const CLIFF_BOOST = 1.25;

const SOFT_CEILING = 10.8;
const CEILING_START = 8.0;

// Mass lag zones (0 = base, 1 = peak)
const MASS_LAG_BASE = 0.035;   // Base moves slowest
const MASS_LAG_MID = 0.055;    // Mid absorbs stress
const MASS_LAG_PEAK = 0.085;   // Peak reacts first

// ============================================================================
// DETERMINISTIC NOISE — GEOLOGICAL IMPERFECTION
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
  return base * 0.18 + detail * 0.25;
}

// Asymmetric ridge decay — left ≠ right
function asymmetricDecay(x: number, z: number): number {
  // Left side decays faster, right side holds longer
  const leftFactor = x < 0 ? 1.0 + Math.abs(x) * 0.015 : 1.0;
  const rightFactor = x > 0 ? 1.0 - x * 0.008 : 1.0;
  // Subtle inflection irregularities
  const inflection = Math.sin(x * 0.3 + z * 0.7) * 0.06;
  return leftFactor * rightFactor + inflection;
}

// Stress-dependent ruggedness
function stressRukkedness(x: number, z: number, riskLevel: number): number {
  const baseRough = Math.sin(x * 1.8 + z * 2.2) * Math.cos(x * 2.4 - z * 1.6);
  const microContour = Math.abs(Math.sin(x * 4.2 + z * 3.8)) * 0.12;
  const ridgeBreak = Math.sin(x * 0.9) * Math.sin(z * 1.3) * 0.08;
  
  // Risk amplifies internal roughness
  const riskFactor = clamp01(riskLevel / 100);
  const stressAmplifier = 0.15 + riskFactor * 0.35;
  
  return (baseRough * 0.1 + microContour + ridgeBreak) * stressAmplifier;
}

// Funding pressure — base compression
function fundingCompression(z: number, fundingPressure: number): number {
  const pressureFactor = clamp01(fundingPressure / 100);
  // Lower slopes feel tension under funding pressure
  const baseTension = z > 0 ? 1.0 - pressureFactor * 0.12 * (z / 10) : 1.0;
  return Math.max(0.75, baseTension);
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
// PALETTE — VERTICAL TONAL ZONING
// ============================================================================

function paletteForScenario(s: ScenarioId) {
  const colors = SCENARIO_COLORS[s];
  const primary = new THREE.Color(colors.primary);

  return {
    // Base: darker, denser (geological foundation)
    abyss: new THREE.Color("#050810"),
    low: new THREE.Color("#082832"),
    // Mid-ridge: neutral presence
    mid: primary.clone().multiplyScalar(0.85),
    // Upper: scenario-tinted
    high: primary.clone().lerp(new THREE.Color("#ffffff"), 0.25),
    // Peak: slightly exposed, authoritative
    peak: new THREE.Color("#ffffff").lerp(primary, 0.15),
    // Stress tint
    stress: new THREE.Color("#1a0a0a"),
  };
}

function heightColor(
  h01: number, 
  pal: ReturnType<typeof paletteForScenario>, 
  illumination: number = 0,
  riskLevel: number = 0
) {
  const t = clamp01(h01);
  const riskFactor = clamp01(riskLevel / 100);
  let c: THREE.Color;

  // Vertical tonal zoning with 5 distinct bands
  if (t < 0.1) {
    // Abyss — deep foundation
    c = pal.abyss.clone().lerp(pal.low, t / 0.1);
  } else if (t < 0.3) {
    // Low slopes — dense, grounded
    c = pal.low.clone().lerp(pal.mid, (t - 0.1) / 0.2);
  } else if (t < 0.55) {
    // Mid-ridge — neutral core
    c = pal.mid.clone().lerp(pal.high, (t - 0.3) / 0.25);
  } else if (t < 0.8) {
    // Upper ridge — exposed
    c = pal.high.clone().lerp(pal.peak, (t - 0.55) / 0.25);
  } else {
    // Peak — authority
    c = pal.peak.clone();
    // Peak gets slightly more saturation for drama
    c.lerp(pal.high, 0.1);
  }

  // Risk stress darkens mid-tones, not peaks
  if (riskFactor > 0.3 && t > 0.2 && t < 0.7) {
    c.lerp(pal.stress, riskFactor * 0.08);
  }

  // KPI illumination
  if (illumination > 0) {
    c.lerp(new THREE.Color("#ffffff"), illumination * 0.3);
  }

  return c;
}

// ============================================================================
// MASSIF PEAKS — ASYMMETRIC GEOLOGICAL HIERARCHY
// ============================================================================

interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
  sharpness?: number;
  hierarchy: "primary" | "secondary" | "tertiary" | "foothill";
}

// Asymmetric peak configuration — one dominant, one secondary offset
const MASSIF_PEAKS: MassifPeak[] = [
  // PRIMARY PEAK — dominant, authoritative, slightly off-center left
  { x: -1.5, z: -2.5, amplitude: 2.5, sigmaX: 2.3, sigmaZ: 2.0, sharpness: 1.75, hierarchy: "primary" },
  
  // SECONDARY PEAK — lower, offset right, creates asymmetry
  { x: 10, z: -1.8, amplitude: 1.85, sigmaX: 2.5, sigmaZ: 2.2, sharpness: 1.5, hierarchy: "secondary" },
  
  // TERTIARY — supporting ridge, left flank
  { x: -12, z: -0.5, amplitude: 1.45, sigmaX: 2.8, sigmaZ: 2.5, sharpness: 1.35, hierarchy: "tertiary" },
  
  // RIDGE SADDLE — connects primary and secondary
  { x: 4, z: -1, amplitude: 1.15, sigmaX: 3.2, sigmaZ: 2.6, sharpness: 1.2, hierarchy: "tertiary" },
  
  // FOOTHILLS — asymmetric decay
  { x: -18, z: 2, amplitude: 0.75, sigmaX: 4.0, sigmaZ: 3.5, hierarchy: "foothill" },
  { x: 16, z: 2.5, amplitude: 0.65, sigmaX: 3.8, sigmaZ: 3.2, hierarchy: "foothill" },
  
  // IRREGULAR INFLECTION — breaks perfect curves
  { x: -6, z: 1.5, amplitude: 0.55, sigmaX: 2.5, sigmaZ: 2.8, hierarchy: "foothill" },
];

// ============================================================================
// TERRAIN COMPONENT — GEOLOGICAL TRUTH
// ============================================================================

interface TerrainProps {
  dataPoints: number[];
  activeKpiIndex: number | null;
  activeLeverId: LeverId | null;
  leverIntensity01: number;
  scenario: ScenarioId;
  riskLevel: number;
  fundingPressure: number;
}

const Terrain: React.FC<TerrainProps> = ({
  dataPoints,
  activeKpiIndex,
  activeLeverId,
  leverIntensity01,
  scenario,
  riskLevel,
  fundingPressure,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);
  const targetHeightsRef = useRef<Float32Array | null>(null);
  const currentHeightsRef = useRef<Float32Array | null>(null);
  const targetColorsRef = useRef<Float32Array | null>(null);
  const currentColorsRef = useRef<Float32Array | null>(null);
  const heightZonesRef = useRef<Float32Array | null>(null); // 0=base, 0.5=mid, 1=peak
  const maxHeightRef = useRef(1);

  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);

  const peakModel = useMemo(
    () =>
      buildPeakModel({
        kpiCount: 7,
        activeKpiIndex,
        activeLeverId,
        leverIntensity01: clamp01(leverIntensity01),
      }),
    [activeKpiIndex, activeLeverId, leverIntensity01]
  );

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W, GRID_D);
    const count = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, []);

  // Calculate target heights with geological authority
  useLayoutEffect(() => {
    if (!meshFillRef.current || !meshWireRef.current) return;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const count = pos.count;
    const wHalf = MESH_W / 2;

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

    // Initialize arrays if needed
    if (!targetHeightsRef.current || targetHeightsRef.current.length !== count) {
      targetHeightsRef.current = new Float32Array(count);
      currentHeightsRef.current = new Float32Array(count);
      targetColorsRef.current = new Float32Array(count * 3);
      currentColorsRef.current = new Float32Array(count * 3);
      heightZonesRef.current = new Float32Array(count);
    }

    const heights = targetHeightsRef.current;
    const targetColors = targetColorsRef.current!;
    const heightZones = heightZonesRef.current!;
    const illuminations = new Float32Array(count);
    let maxH = 0.01;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      let ridge = 0;
      let illumination = 0;

      // KPI ridge contribution
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.48);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;

        if (activeKpiIndex === idx) {
          illumination = Math.max(illumination, g * 0.7);
        }
      }

      let h = ridge * BASE_SCALE;

      // Massif peaks with hierarchy-based amplitude boost
      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        const sharpened = m.sharpness ? Math.pow(g, 1 / m.sharpness) : g;
        
        // Hierarchy affects peak response strength
        let hierarchyBoost = 1.0;
        if (m.hierarchy === "primary") hierarchyBoost = 1.15;
        else if (m.hierarchy === "secondary") hierarchyBoost = 1.08;
        
        h += sharpened * m.amplitude * MASSIF_SCALE * hierarchyBoost;
      }

      // Dynamic peak model response (stronger at peaks)
      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        const peakContrib = gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
        h += peakContrib;
      }

      // Asymmetric decay
      const asymmetry = asymmetricDecay(x, z);
      h *= asymmetry;

      // Stress-dependent ruggedness
      const stressRough = stressRukkedness(x, z, riskLevel);
      h += stressRough * h * 0.15;

      // Base ruggedness
      const rugged = ridgeNoise(x, z);
      h += rugged * (0.5 + h * 0.15);

      // Island mask
      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

      // Deterministic noise
      const n = noise2(x, z) * 0.3;

      // Funding pressure compression at base
      const fundingComp = fundingCompression(z, fundingPressure);

      // Final height
      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      let finalH = Math.max(0, (h + n) * mask * cliff * fundingComp);
      finalH = applySoftCeiling(finalH);

      heights[i] = finalH;
      illuminations[i] = illumination;
      if (finalH > maxH) maxH = finalH;
    }

    maxHeightRef.current = maxH;

    // Calculate height zones for mass lag
    for (let i = 0; i < count; i++) {
      heightZones[i] = clamp01(heights[i] / (maxH * 0.9));
    }

    // Calculate target colors with vertical tonal zoning
    for (let i = 0; i < count; i++) {
      const h = heights[i];
      const h01 = clamp01(h / (maxH * 0.82));
      const c = heightColor(h01, pal, illuminations[i], riskLevel);
      targetColors[i * 3] = c.r;
      targetColors[i * 3 + 1] = c.g;
      targetColors[i * 3 + 2] = c.b;
    }
  }, [dataPoints, peakModel, pal, activeKpiIndex, riskLevel, fundingPressure]);

  // Smooth interpolation with MASS LAG — peak first, base last
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Subtle breathing
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.03;
    }
    if (meshFillRef.current) {
      const mat = meshFillRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.04 + Math.sin(t * 0.45) * 0.015;
    }

    // Mass-lagged interpolation
    if (!meshFillRef.current || !meshWireRef.current) return;
    if (!targetHeightsRef.current || !currentHeightsRef.current) return;
    if (!targetColorsRef.current || !currentColorsRef.current) return;
    if (!heightZonesRef.current) return;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count;

    const targets = targetHeightsRef.current;
    const currents = currentHeightsRef.current;
    const targetCols = targetColorsRef.current;
    const currentCols = currentColorsRef.current;
    const zones = heightZonesRef.current;

    let needsUpdate = false;

    for (let i = 0; i < count; i++) {
      // Mass lag based on height zone
      const zone = zones[i];
      const smoothing = lerp(
        MASS_LAG_BASE,
        MASS_LAG_PEAK,
        zone * zone // Quadratic for more dramatic peak-first effect
      );

      const diff = targets[i] - currents[i];
      if (Math.abs(diff) > 0.0003) {
        currents[i] += diff * smoothing;
        needsUpdate = true;
      } else {
        currents[i] = targets[i];
      }
      pos.setZ(i, currents[i]);

      // Color interpolation (faster than height)
      const colorSmoothing = smoothing * 1.5;
      for (let c = 0; c < 3; c++) {
        const ci = i * 3 + c;
        const colDiff = targetCols[ci] - currentCols[ci];
        if (Math.abs(colDiff) > 0.0008) {
          currentCols[ci] += colDiff * colorSmoothing;
        } else {
          currentCols[ci] = targetCols[ci];
        }
      }
      col.setXYZ(i, currentCols[i * 3], currentCols[i * 3 + 1], currentCols[i * 3 + 2]);
    }

    if (needsUpdate) {
      pos.needsUpdate = true;
      col.needsUpdate = true;
      geo.computeVertexNormals();

      const wireGeo = meshWireRef.current.geometry as THREE.PlaneGeometry;
      wireGeo.attributes.position.needsUpdate = true;
      wireGeo.computeVertexNormals();
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.2, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.2}
          roughness={0.15}
          metalness={0.85}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial vertexColors wireframe transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ============================================================================
// ATMOSPHERIC HAZE — WHISPERS UNCERTAINTY
// ============================================================================

interface AtmosphericHazeProps {
  riskLevel: number;
  viewMode: "operator" | "investor";
  scenario: ScenarioId;
}

function AtmosphericHaze({ riskLevel, viewMode, scenario }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = viewMode === "investor" ? 0.7 : 1.0;
  
  const scenarioTone = scenario === "extreme" ? 1.4 : 
                       scenario === "downside" ? 1.2 : 
                       scenario === "upside" ? 0.85 : 1.0;
  
  // Substantial fog presence that responds to risk
  const baseOpacity = 0.25 + (riskFactor * 0.15 * scenarioTone);
  const finalOpacity = baseOpacity * viewFactor;

  return (
    <div className="atmospheric-haze">
      <div 
        className="haze-layer haze-deep"
        style={{ opacity: finalOpacity * 0.9 }}
      />
      <div 
        className="haze-layer haze-mid"
        style={{ opacity: finalOpacity * 1.1 }}
      />
      <div 
        className="haze-layer haze-near"
        style={{ opacity: finalOpacity * (1 + riskFactor * 0.35) }}
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
          will-change: transform;
        }

        .haze-deep {
          background: radial-gradient(
            ellipse 130% 90% at 50% 70%,
            rgba(12, 22, 35, 0.9) 0%,
            rgba(10, 18, 28, 0.55) 40%,
            transparent 75%
          );
          animation: haze-drift-deep 140s ease-in-out infinite;
        }

        .haze-mid {
          background: radial-gradient(
            ellipse 110% 70% at 45% 60%,
            rgba(15, 28, 42, 0.75) 0%,
            rgba(12, 22, 34, 0.4) 35%,
            transparent 65%
          );
          animation: haze-drift-mid 100s ease-in-out infinite reverse;
        }

        .haze-near {
          background: 
            radial-gradient(
              ellipse 95% 60% at 30% 65%,
              rgba(18, 32, 48, 0.55) 0%,
              transparent 55%
            ),
            radial-gradient(
              ellipse 85% 55% at 70% 60%,
              rgba(14, 26, 40, 0.45) 0%,
              transparent 50%
            );
          animation: haze-drift-near 160s ease-in-out infinite;
        }

        @keyframes haze-drift-deep {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-1.5%, 0.8%) scale(1.01); }
          66% { transform: translate(1%, -0.5%) scale(0.99); }
        }

        @keyframes haze-drift-mid {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(1.2%, -0.6%); }
        }

        @keyframes haze-drift-near {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-0.8%, 0.4%); }
          75% { transform: translate(0.6%, -0.3%); }
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
      position={[0, -5, 0]} 
      rotation={[0, 0, 0]}
    />
  );
}

// ============================================================================
// MAIN EXPORT — THE MOUNTAIN CANNOT LIE
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
  
  // Extract risk and funding pressure for geological response
  const riskLevel = kpiValues.riskIndex?.value ?? 25;
  const fundingPressure = kpiValues.runway?.value 
    ? Math.max(0, 100 - (kpiValues.runway.value / 24) * 100)
    : 20;

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: `radial-gradient(ellipse 70% 50% at 50% 60%, ${colors.glow}, transparent 60%), #060a10`,
      }}
    >
      <AtmosphericHaze 
        riskLevel={riskLevel}
        viewMode={viewMode}
        scenario={scenario}
      />
      
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ position: "relative", zIndex: 1 }}
      >
        <PerspectiveCamera makeDefault position={[0, 15, 40]} fov={38} />
        <ambientLight intensity={0.1} />
        <directionalLight position={[8, 20, 10]} intensity={0.4} color="#ffffff" />
        <directionalLight position={[-6, 12, -8]} intensity={0.15} color={colors.primary} />
        <pointLight position={[0, 8, 0]} intensity={0.2} color={colors.primary} distance={30} decay={2} />
        
        <Terrain
          dataPoints={dataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenario}
          riskLevel={riskLevel}
          fundingPressure={fundingPressure}
        />
        
        <SubtleGrid />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
