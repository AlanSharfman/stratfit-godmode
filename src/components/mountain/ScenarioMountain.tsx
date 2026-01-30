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

import React, { useMemo, useRef, useLayoutEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS, useScenarioStore, type Scenario } from "@/state/scenarioStore";
import { engineResultToMountainForces } from "@/logic/mountainForces";

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

function paletteForScenario(s: ScenarioId) {
  const colors = SCENARIO_COLORS[s];
  const primary = new THREE.Color(colors.primary);

  return {
    sky: new THREE.Color("#080C14"),
    low: new THREE.Color("#0a2830"),  // Less cyan, more neutral dark
    mid: primary.clone().lerp(new THREE.Color("#1a2a35"), 0.3),  // Desaturated mid
    high: new THREE.Color("#ffffff").lerp(primary, 0.18),  // Less color at peaks
    peak: new THREE.Color("#f0f5f8"),  // Slightly warm white
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
}

const Terrain: React.FC<TerrainProps> = ({
  dataPoints,
  activeKpiIndex,
  activeLeverId,
  leverIntensity01,
  scenario,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);
  const fillMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const wireMatRef = useRef<THREE.MeshBasicMaterial>(null);
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

  // Reactivity signal: drives “spectacle” (clarity + stars + subtle motion) without randomness.
  const reactivityTarget01 = clamp01(
    clamp01(leverIntensity01) * 1.2 + (activeKpiIndex !== null ? 0.25 : 0)
  );
  const reactivity01Ref = useRef(0);

  // Smooth interpolation - NO erratic motion
  useFrame((state) => {
    if (!meshFillRef.current || !meshWireRef.current) return;
    if (!targetHeightsRef.current || !currentHeightsRef.current) return;
    if (!targetColorsRef.current || !currentColorsRef.current) return;

    // Smooth reactivity ramp to avoid pops when sliders start moving
    reactivity01Ref.current += (reactivityTarget01 - reactivity01Ref.current) * 0.08;
    const react01 = reactivity01Ref.current;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count;

    const targets = targetHeightsRef.current;
    const currents = currentHeightsRef.current;
    const targetCols = targetColorsRef.current;
    const currentCols = currentColorsRef.current;

    const smoothing = 0.7; // 🔥 INCREASED from 0.6 - tiny bit more heave/breathing
    let needsUpdate = false;

    for (let i = 0; i < count; i++) {
      const diff = targets[i] - currents[i];
      if (Math.abs(diff) > 0.0001) { // 🔥 tighter threshold (was 0.0002) - less settling delay
        currents[i] += diff * smoothing;
        needsUpdate = true;
      } else {
        currents[i] = targets[i];
      }
      pos.setZ(i, currents[i]);

      for (let c = 0; c < 3; c++) {
        const ci = i * 3 + c;
        const colDiff = targetCols[ci] - currentCols[ci];
        if (Math.abs(colDiff) > 0.0003) { // 🔥 tighter threshold (was 0.0005)
          currentCols[ci] += colDiff * smoothing;
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

    // Subtle deterministic “alive” motion during interaction (no jitter)
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      const sway = Math.sin(t * 1.35) * 0.02 * react01;
      const lift = Math.sin(t * 1.8 + 1.2) * 0.12 * react01;
      groupRef.current.rotation.z = sway;
      groupRef.current.position.y = -2 + lift;
    }

    // Clarity + “lights up” on interaction (material-only: safe & stable)
    if (fillMatRef.current) {
      const m = fillMatRef.current;
      const targetOpacity = 0.22 + 0.20 * react01;
      const targetEmissive = 0.02 + 0.26 * react01;
      m.opacity += (targetOpacity - m.opacity) * 0.10;
      m.emissiveIntensity += (targetEmissive - m.emissiveIntensity) * 0.10;
    }

    if (wireMatRef.current) {
      const m = wireMatRef.current;
      const targetWire = 0.78 + 0.18 * react01;
      m.opacity += (targetWire - m.opacity) * 0.12;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          ref={fillMatRef}
          vertexColors
          transparent
          opacity={0.22}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={0.02}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial
          ref={wireMatRef}
          vertexColors
          wireframe
          transparent
          opacity={0.78}
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
  viewMode: "terrain" | "data" | "operator" | "investor";
  scenario: ScenarioId;
  reactivity01?: number;
}

function AtmosphericHaze({ riskLevel, viewMode, scenario, reactivity01 = 0 }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = viewMode === "investor" || viewMode === "data" ? 0.7 : 1.0;
  const react01 = clamp01(reactivity01);
  
  const scenarioTone = scenario === "stress" ? 1.2 : 
                       scenario === "downside" ? 1.1 : 
                       scenario === "upside" ? 0.85 : 1.0;
  
  // Reduced base opacity for bottom haze
  const baseOpacity = 0.18 + (riskFactor * 0.08 * scenarioTone);
  const finalOpacity = baseOpacity * viewFactor;
  
  // Altitude haze opacity (above mountain)
  const altitudeOpacity = 0.08 * viewFactor;
  const starsOpacity = clamp01(Math.pow(react01, 0.65)) * 0.85 * viewFactor;

  return (
    <div className="atmospheric-haze">
      {/* STARS — appear when sliders move / interaction ramps */}
      <div className="haze-layer haze-stars" style={{ opacity: starsOpacity }} />

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

        /* STARS - subtle point field, visible on interaction */
        .haze-stars {
          background-image:
            radial-gradient(circle at 12% 18%, rgba(214, 235, 255, 0.95) 0px, rgba(214, 235, 255, 0.0) 2px),
            radial-gradient(circle at 28% 10%, rgba(214, 235, 255, 0.75) 0px, rgba(214, 235, 255, 0.0) 1.8px),
            radial-gradient(circle at 46% 22%, rgba(214, 235, 255, 0.9) 0px, rgba(214, 235, 255, 0.0) 2.2px),
            radial-gradient(circle at 63% 14%, rgba(214, 235, 255, 0.8) 0px, rgba(214, 235, 255, 0.0) 2px),
            radial-gradient(circle at 78% 26%, rgba(214, 235, 255, 0.85) 0px, rgba(214, 235, 255, 0.0) 2.1px),
            radial-gradient(circle at 88% 12%, rgba(214, 235, 255, 0.65) 0px, rgba(214, 235, 255, 0.0) 1.8px),
            radial-gradient(circle at 18% 32%, rgba(214, 235, 255, 0.7) 0px, rgba(214, 235, 255, 0.0) 2px),
            radial-gradient(circle at 40% 35%, rgba(214, 235, 255, 0.6) 0px, rgba(214, 235, 255, 0.0) 1.6px),
            radial-gradient(circle at 70% 34%, rgba(214, 235, 255, 0.7) 0px, rgba(214, 235, 255, 0.0) 1.9px);
          filter: blur(0.25px);
          transform: translateZ(0);
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
// MAIN EXPORT
// ============================================================================

interface ScenarioMountainProps {
  scenario: Scenario | ScenarioId | (Record<string, any> & { id?: string; color?: string });
  dataPoints?: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
  timelineEnabled?: boolean;
  heatmapEnabled?: boolean;
  mode?: "default" | "celebration" | "ghost";
  glowIntensity?: number;
  showPath?: boolean;
  showMilestones?: boolean;
  pathColor?: string;
}

function normalizeScenarioId(input: unknown): ScenarioId {
  const key =
    typeof input === "string"
      ? input
      : typeof input === "object" && input && "id" in (input as any)
        ? String((input as any).id)
        : "base";

  return key === "base" || key === "upside" || key === "downside" || key === "stress"
    ? (key as ScenarioId)
    : "base";
}

function ScenarioMountainComponent({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  activeLeverId = null,
  leverIntensity01 = 0,
  className,
  timelineEnabled = false,
  heatmapEnabled = false,
  // Accepted for compatibility with newer call sites; this renderer ignores these for now.
  mode: _mode = "default",
  glowIntensity: _glowIntensity = 1,
  showPath: _showPath = false,
  showMilestones: _showMilestones = false,
  pathColor: _pathColor,
}: ScenarioMountainProps) {
  const scenarioId = normalizeScenarioId(scenario);
  const colors = SCENARIO_COLORS[scenarioId];
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

  const engineResult = engineResults?.[scenarioId] ?? engineResults?.[activeScenarioId];
  const kpiValues = engineResult?.kpis || {};
  
  // riskLevel = danger score (higher = more dangerous)
  // riskIndex is health (higher = healthier), so invert it
  const riskLevel = 100 - (kpiValues.riskIndex?.value ?? 50);
  const reactivity01 = clamp01(
    clamp01(leverIntensity01 ?? 0) * 1.2 + (activeKpiIndex !== null ? 0.25 : 0)
  );

  const resolvedDataPoints = useMemo(() => {
    if (Array.isArray(dataPoints) && dataPoints.length) return dataPoints;
    return engineResultToMountainForces((engineResult ?? null) as any);
  }, [dataPoints, engineResult]);

  const backgroundCss = useMemo(() => {
    // Navy “spectacle” sky when interacting; otherwise keep the neutral base.
    const base = new THREE.Color("#060a10");
    const navy = new THREE.Color("#07142a");
    base.lerp(navy, reactivity01 * 0.9);
    const bg = base.getStyle();
    return `radial-gradient(ellipse 70% 50% at 50% 60%, ${colors.glow}, transparent 60%), ${bg}`;
  }, [colors.glow, reactivity01]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: backgroundCss,
      }}
    >
      <AtmosphericHaze 
        riskLevel={riskLevel}
        viewMode={viewMode}
        scenario={scenarioId}
        reactivity01={reactivity01}
      />
      
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ position: "relative", zIndex: 1, background: "transparent" }}
        fallback={<div style={{ width: "100%", height: "100%", background: "#0d1117" }} />}
      >
        <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 6, 32]} fov={38} />
        <ambientLight intensity={0.12 + 0.08 * reactivity01} />
        <directionalLight position={[8, 20, 10]} intensity={0.4 + 0.25 * reactivity01} color="#ffffff" />
        <directionalLight position={[-6, 12, -8]} intensity={0.08 + 0.16 * reactivity01} color={colors.primary} />
        <pointLight position={[0, 8, 0]} intensity={0.1 + 0.22 * reactivity01} color={colors.primary} distance={30} decay={2} />
        
        <Terrain
          dataPoints={resolvedDataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenarioId}
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
        </Suspense>
      </Canvas>
    </div>
  );
}

// Named export for newer call sites
export function ScenarioMountain(props: ScenarioMountainProps) {
  return <ScenarioMountainComponent {...props} />;
}

export default ScenarioMountainComponent;
