/**
 * BaselineMountain.tsx — Cinematic Institutional Structural Instrument (God Mode v2)
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Capital war-room simulation surface.
 *
 * EMOTIONAL PROFILE:
 *   DEFAULT  — Calm. Analytical. Precise.
 *   STRESSED — Subtle intensification. Controlled pressure visibility. No alarms.
 *
 * This is structural truth, not theatre.
 *
 * LAYERS:
 *  1. High-fidelity structural mesh (200×200, precision-machined material)
 *  2. Institutional contour system (ultra-thin cyan, stress-brightening)
 *  3. Dispersion atmosphere (variance-reactive, controlled cinematic)
 *  4. Capital stress illumination (cool→red gradient, subtle underglow)
 *  5. Runway horizon marker (authoritative, precision beam)
 *  6. Micro-surface detail (procedural noise, curvature shading)
 *  7. Lighting architecture (institutional: top cool, rim cyan, bloom)
 *
 * CONSTRAINTS:
 *  - 60fps target maintained
 *  - No heavy raymarching / no experimental volumetric shaders
 *  - No changes to Monte Carlo engine
 *  - Deterministic data binding preserved
 *  - Canonical ScenarioMountain is NOT modified
 */

import React, { useMemo, useRef, useLayoutEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ============================================================================
// CONSTANTS — HIGH-FIDELITY INSTITUTIONAL TERRAIN
// ============================================================================

const GRID_W = 200;             // 200×200 subdivisions — institutional grade
const GRID_D = 200;
const MESH_W = 50;
const MESH_D = 25;
const ISLAND_RADIUS = 22;

const BASE_SCALE = 4.5;
const PEAK_SCALE = 3.5;
const MASSIF_SCALE = 5.0;
const RIDGE_SHARPNESS = 1.4;
const CLIFF_BOOST = 1.15;

const SOFT_CEILING = 9.0;
const CEILING_START = 7.0;

// Contour system
const CONTOUR_LEVELS = 14;
const CONTOUR_COLOR = "#4fd1ff";  // Ice blue — institutional precision

// ============================================================================
// DETERMINISTIC NOISE (canonical heightfield math)
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
// MASSIF PEAKS (canonical)
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
// LAYER 1 + 4: PALETTE — Deep charcoal base + stress illumination
// ============================================================================

/**
 * Computes vertex color for a given normalized height and stress factor.
 * Default: institutional charcoal → ice blue structural highlights.
 * Under stress: smooth gradient toward muted deep red in affected regions.
 */
function heightColor(h01: number, stressFactor: number): THREE.Color {
  const t = clamp01(h01);

  // Institutional palette: deep charcoal → slate → muted cyan → ice peak
  const abyss = new THREE.Color("#0e1116");
  const low   = new THREE.Color("#1a2a35");
  const mid   = new THREE.Color("#22d3ee").multiplyScalar(0.28);
  const high  = new THREE.Color("#c8e6f0").lerp(new THREE.Color("#4fd1ff"), 0.2);
  const peak  = new THREE.Color("#e8f4fa");

  let c: THREE.Color;
  if (t < 0.12)      c = abyss.clone().lerp(low, t / 0.12);
  else if (t < 0.40) c = low.clone().lerp(mid, (t - 0.12) / 0.28);
  else if (t < 0.72) c = mid.clone().lerp(high, (t - 0.40) / 0.32);
  else                c = high.clone().lerp(peak, (t - 0.72) / 0.28);

  // LAYER 4: Capital stress illumination
  // Smooth transition from cool cyan → muted deep red accent
  if (stressFactor > 0) {
    const stressBase = new THREE.Color("#6b1a3a");   // Muted deep red
    const stressMid  = new THREE.Color("#8b2252");   // Slightly brighter at mid-height
    const stressTint = t > 0.4
      ? stressBase.clone().lerp(stressMid, (t - 0.4) / 0.6)
      : stressBase;
    // Smooth gradient blend — internal pressure, not alert graphics
    c.lerp(stressTint, stressFactor * 0.30);
  }

  return c;
}

// ============================================================================
// HEIGHTFIELD COMPUTATION — replays canonical math at 200×200
// ============================================================================

interface HeightfieldResult {
  maxHeight: number;
  heights: Float32Array;
  colors: Float32Array;
}

function computeHeightfield(
  dataPoints: number[],
  positions: THREE.BufferAttribute,
  stressFactor: number,
): HeightfieldResult {
  const count = positions.count;
  const wHalf = MESH_W / 2;
  const dp = dataPoints?.length === 7
    ? dataPoints
    : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

  const heights = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  let maxH = 0.01;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getY(i);
    const kpiX = ((x + wHalf) / MESH_W) * 6;

    // KPI ridge driven by data points
    let ridge = 0;
    for (let idx = 0; idx < 7; idx++) {
      const v = clamp01(dp[idx]);
      const g = gaussian1(kpiX, idx, 0.48);
      ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
    }

    let h = ridge * BASE_SCALE;

    // Massif formation
    for (const m of MASSIF_PEAKS) {
      const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
      h += g * m.amplitude * MASSIF_SCALE;
    }

    // Rugged detail
    const rugged = ridgeNoise(x, z);
    h += rugged * (0.3 + h * 0.08);

    // LAYER 6: Micro-surface detail — very small amplitude procedural noise
    const microA = noise2(x * 3.2, z * 3.2) * 0.06;
    const microB = noise2(x * 7.5, z * 7.5) * 0.025;
    // Under stress: micro-detail becomes marginally sharper
    const microScale = 1.0 + stressFactor * 0.15;
    h += (microA + microB) * microScale;

    // Island mask + cliff boost
    const dist = Math.sqrt(x * x + z * z * 1.4);
    const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
    const n = noise2(x, z) * 0.2;
    const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
    let finalH = Math.max(0, (h + n) * mask * cliff);
    finalH = applySoftCeiling(finalH);

    heights[i] = finalH;
    if (finalH > maxH) maxH = finalH;
  }

  // Vertex colors
  for (let i = 0; i < count; i++) {
    const h01 = clamp01(heights[i] / (maxH * 0.82));
    const c = heightColor(h01, stressFactor);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  return { maxHeight: maxH, heights, colors };
}

// ============================================================================
// LAYER 2: CONTOUR LINE EXTRACTION (marching horizontal rows)
// ============================================================================

interface ContourLineData {
  points: Float32Array;
  stressInfluence: number; // average local stress proximity (0–1)
}

function extractContours(
  positions: THREE.BufferAttribute,
  maxHeight: number,
  stressFactor: number,
): ContourLineData[] {
  if (maxHeight < 0.1) return [];

  const cols = GRID_W + 1;
  const rows = GRID_D + 1;
  const step = maxHeight / (CONTOUR_LEVELS + 1);
  const lines: ContourLineData[] = [];

  for (let level = 1; level <= CONTOUR_LEVELS; level++) {
    const threshold = step * level;
    const raw: THREE.Vector3[] = [];

    // Scan horizontal rows for threshold crossings
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i1 = r * cols + c;
        const i2 = r * cols + c + 1;
        const h1 = positions.getZ(i1);
        const h2 = positions.getZ(i2);

        if ((h1 < threshold && h2 >= threshold) || (h1 >= threshold && h2 < threshold)) {
          const t = (threshold - h1) / (h2 - h1);
          const x = lerp(positions.getX(i1), positions.getX(i2), t);
          const z = lerp(positions.getY(i1), positions.getY(i2), t);
          raw.push(new THREE.Vector3(x, z, threshold + 0.015));
        }
      }
    }

    // Also scan vertical columns for better contour coverage
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows - 1; r++) {
        const i1 = r * cols + c;
        const i2 = (r + 1) * cols + c;
        const h1 = positions.getZ(i1);
        const h2 = positions.getZ(i2);

        if ((h1 < threshold && h2 >= threshold) || (h1 >= threshold && h2 < threshold)) {
          const t = (threshold - h1) / (h2 - h1);
          const x = lerp(positions.getX(i1), positions.getX(i2), t);
          const z = lerp(positions.getY(i1), positions.getY(i2), t);
          raw.push(new THREE.Vector3(x, z, threshold + 0.015));
        }
      }
    }

    if (raw.length < 4) continue;

    // Sort by angle from centroid for closed-loop appearance
    const cx = raw.reduce((s, p) => s + p.x, 0) / raw.length;
    const cy = raw.reduce((s, p) => s + p.y, 0) / raw.length;
    raw.sort((a, b) =>
      Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
    );

    const flat = new Float32Array(raw.length * 3);
    for (let i = 0; i < raw.length; i++) {
      flat[i * 3] = raw[i].x;
      flat[i * 3 + 1] = raw[i].y;
      flat[i * 3 + 2] = raw[i].z;
    }

    // Stress influence: higher contours in low-height zones affected more
    const heightRatio = threshold / maxHeight;
    const stressInfluence = stressFactor * (1 - heightRatio * 0.5);

    lines.push({ points: flat, stressInfluence });
  }

  return lines;
}

// ============================================================================
// LAYER 1: HIGH-FIDELITY STRUCTURAL MESH + ALL VISUAL LAYERS
// ============================================================================

interface InstitutionalTerrainProps {
  dataPoints: number[];
  stressFactor: number;       // 0–1: survival pressure (higher = more stressed)
  varianceWidth: number;      // 0–1: Monte Carlo dispersion width
  runwayMonths: number;       // Months of runway remaining
  maxHorizonMonths: number;   // Planning horizon (36)
}

function InstitutionalTerrain({
  dataPoints,
  stressFactor,
  varianceWidth,
  runwayMonths,
  maxHorizonMonths,
}: InstitutionalTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const dispersionRef = useRef<THREE.Mesh>(null);
  const runwayBeamRef = useRef<THREE.Mesh>(null);
  const stressGlowRef = useRef<THREE.PointLight>(null);
  const maxHeightRef = useRef(1);

  // ── LAYER 1: High-res geometry (200×200) ──────────────────────────────
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W, GRID_D);
    const count = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, []);

  // ── Compute heightfield and apply to geometry ─────────────────────────
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;

    const { maxHeight, heights, colors } = computeHeightfield(dataPoints, pos, stressFactor);
    maxHeightRef.current = maxHeight;

    // Apply heights to Z axis
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, heights[i]);
    }

    // Apply vertex colors
    col.set(colors);

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();
  }, [dataPoints, stressFactor]);

  // ── LAYER 2: Contour lines ────────────────────────────────────────────
  const contourLines = useMemo(() => {
    const geo = geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    return extractContours(pos, maxHeightRef.current, stressFactor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPoints, stressFactor, geometry]);

  // ── LAYER 5: Runway horizon marker X position ────────────────────────
  const runwayX = useMemo(() => {
    const t = clamp01(runwayMonths / maxHorizonMonths);
    return lerp(-MESH_W / 2, MESH_W / 2, t);
  }, [runwayMonths, maxHorizonMonths]);

  // ── LAYER 3 + 4: Dispersion and stress underglow animation ───────────
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;

    // LAYER 3: Dispersion atmosphere opacity — almost invisible at calm,
    // slightly denser under stress
    if (dispersionRef.current) {
      const mat = dispersionRef.current.material as THREE.MeshBasicMaterial;
      // Calm: 0.02 base. With variance: up to 0.10. Under stress: +0.04.
      const baseOpacity = 0.02 + varianceWidth * 0.08 + stressFactor * 0.04;
      // Barely perceptible idle micro-drift (not animated pulsing)
      const drift = Math.sin(timeRef.current * 0.3) * 0.005;
      mat.opacity = clamp01(baseOpacity + drift);
    }

    // LAYER 4: Stress underglow — subtle point light in high-risk regions
    if (stressGlowRef.current) {
      // Only visible when stress is present; intensity scales smoothly
      stressGlowRef.current.intensity = stressFactor * 0.6;
    }

    // LAYER 5: Runway beam — static, no animation (authoritative, engineered)
    // No-op: beam opacity is set once, no per-frame changes
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1: High-fidelity fill mesh — precision-machined material
          Deep charcoal base, subtle metallic roughness, institutional feel
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.38}
          roughness={0.45}              // Matte institutional — not chrome
          metalness={0.55}              // Subtle metallic without mirror effect
          side={THREE.DoubleSide}
          emissive={new THREE.Color("#0a2d45")}
          emissiveIntensity={0.05}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1b: Wireframe overlay — structural grid, precision read
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial
          vertexColors
          wireframe
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2: Institutional contour system — ultra-thin ice blue lines
          Under stress: lines brighten locally in affected regions.
          Parallax-responsive through camera angle, NOT animated.
          ═══════════════════════════════════════════════════════════════════ */}
      {contourLines.map((contour, i) => {
        // Base opacity: 0.20. Under stress: brighten proportionally.
        const baseOp = 0.18;
        const stressBrighten = contour.stressInfluence * 0.12;
        const opacity = clamp01(baseOp + stressBrighten);

        return (
          <line key={`contour-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[contour.points, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={CONTOUR_COLOR}
              transparent
              opacity={opacity}
              linewidth={1}
            />
          </line>
        );
      })}

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3: Probability dispersion atmosphere
          Semi-transparent structural variance field above surface.
          Calm state: almost invisible. Under stress: slightly denser.
          Indigo (#5b6cff) mixed with cyan — controlled cinematic.
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh ref={dispersionRef} position={[0, 0, maxHeightRef.current * 0.55]}>
        <planeGeometry args={[MESH_W * 0.75, MESH_D * 0.65]} />
        <meshBasicMaterial
          color="#5b6cff"
          transparent
          opacity={0.02 + varianceWidth * 0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4: Capital stress underglow — subtle internal pressure
          Only visible when survival probability is low.
          Deep red point light beneath the surface.
          ═══════════════════════════════════════════════════════════════════ */}
      <pointLight
        ref={stressGlowRef}
        color="#6b1a3a"
        intensity={0}
        distance={18}
        decay={2}
        position={[0, 0, -1.5]}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 5: Runway horizon marker — authoritative vertical beam
          Thin cyan line at capital exhaustion time index.
          Precision marker. Engineered. No animation.
          ═══════════════════════════════════════════════════════════════════ */}
      <group position={[runwayX, 0, 0]}>
        <mesh ref={runwayBeamRef}>
          <planeGeometry args={[0.06, maxHeightRef.current * 1.4]} />
          <meshBasicMaterial
            color="#4fd1ff"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Faint reflection — point light at mid-beam height */}
        <pointLight
          color="#4fd1ff"
          intensity={0.15}
          distance={6}
          decay={2}
          position={[0, 0, maxHeightRef.current * 0.35]}
        />
      </group>
    </group>
  );
}

// ============================================================================
// LAYER 8: ANALYTICAL GRID FOUNDATION
// ============================================================================

function AnalyticalGrid() {
  return (
    <Grid
      position={[0, -2.5, 0]}
      args={[60, 60]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#141e2d"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#4fd1ff"
      fadeDistance={35}
      fadeStrength={1.8}
      infiniteGrid
    />
  );
}

// ============================================================================
// IDLE MICRO-MOTION — barely perceptible, grounded, institutional
// ============================================================================

function IdleMicroMotion({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Very slow idle micro-motion — perceptible only if you stare
    // No rotation. No cinematic sweep. Confident. Grounded.
    const breathY = Math.sin(t * 0.25) * 0.04;
    const breathX = Math.sin(t * 0.18) * 0.01;
    groupRef.current.position.y = breathY;
    groupRef.current.position.x = breathX;

    // Micro tilt — barely perceptible depth cue
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.003;
    groupRef.current.rotation.y = Math.cos(t * 0.12) * 0.002;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// MAIN EXPORT — BaselineMountain
// ============================================================================

export interface BaselineMountainProps {
  dataPoints?: number[];
  survivalProbability?: number;     // 0–100 (for stress zones)
  varianceWidth?: number;           // 0–1 (for dispersion atmosphere)
  runwayMonths?: number;            // Months of runway remaining
  maxHorizonMonths?: number;        // Planning horizon (default: 36)
  showGrid?: boolean;               // Optional analytical grid foundation
  className?: string;
}

export default function BaselineMountain({
  dataPoints = [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35],
  survivalProbability = 72,
  varianceWidth = 0.3,
  runwayMonths = 24,
  maxHorizonMonths = 36,
  showGrid = true,
  className,
}: BaselineMountainProps) {

  // LAYER 4: Stress factor derived from survival probability
  // 0 = healthy (≥80%), 1 = maximum stress (≤30%)
  const stressFactor = useMemo(() => {
    if (survivalProbability >= 80) return 0;
    if (survivalProbability <= 30) return 1;
    return 1 - (survivalProbability - 30) / 50;
  }, [survivalProbability]);

  // Camera polar angle: ~35° from horizontal = Math.PI / 2 - (35° in rad)
  // 35° ≈ 0.611 rad → polar angle ≈ Math.PI / 2 - 0.611 ≈ 0.96
  const polarAngle = Math.PI / 2 - (35 * Math.PI) / 180; // ~0.96 rad

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: "linear-gradient(180deg, #0E1116 0%, #11161D 100%)",
        minHeight: "400px",
        height: "100%",
        width: "100%",
      }}
    >
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          background: "transparent",
        }}
        fallback={
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #0E1116 0%, #11161D 100%)",
            }}
          />
        }
      >
        <Suspense fallback={null}>
          {/* Deep institutional charcoal background */}
          <color attach="background" args={["#0E1116"]} />
          <fog attach="fog" args={["#0E1116", 38, 85]} />

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 7: Camera — slightly elevated 35° angle, institutional
              No spinning. No cinematic flyover. Confident. Grounded.
              ═══════════════════════════════════════════════════════════════ */}
          <PerspectiveCamera makeDefault position={[0, 10, 28]} fov={34} />

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 7: Lighting architecture — institutional grade
              ═══════════════════════════════════════════════════════════════ */}
          {/* Soft top directional — cool white, primary illumination */}
          <directionalLight position={[0, 22, 8]} intensity={0.45} color="#e4edf4" />
          {/* Cyan rim light — low intensity structural accent */}
          <directionalLight position={[-8, 14, -6]} intensity={0.10} color="#4fd1ff" />
          {/* Secondary fill — subtle, neutral */}
          <directionalLight position={[10, 16, -4]} intensity={0.05} color="#8898a8" />
          {/* Low ambient fill — keeps shadows readable without wash */}
          <ambientLight intensity={0.12} />

          {/* Idle micro-motion wrapper — barely perceptible, no rotation */}
          <IdleMicroMotion>
            {/* ALL TERRAIN LAYERS rendered inside this group */}
            <InstitutionalTerrain
              dataPoints={dataPoints}
              stressFactor={stressFactor}
              varianceWidth={varianceWidth}
              runwayMonths={runwayMonths}
              maxHorizonMonths={maxHorizonMonths}
            />
          </IdleMicroMotion>

          {/* Analytical grid foundation (optional) */}
          {showGrid && <AnalyticalGrid />}

          {/* Camera constraints: locked at ~35°, no rotation, no zoom */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            minPolarAngle={polarAngle}
            maxPolarAngle={polarAngle}
          />

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 7: Post-processing — controlled bloom, vignette
              No lens flare. No dramatic shadows.
              ═══════════════════════════════════════════════════════════════ */}
          <EffectComposer>
            <Bloom
              intensity={0.20}
              luminanceThreshold={0.45}
              luminanceSmoothing={0.85}
              mipmapBlur
            />
            <Vignette offset={0.45} darkness={0.30} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
