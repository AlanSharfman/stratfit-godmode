/**
 * BaselineMountain.tsx — God Mode Institutional Cinematic Instrument
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Bloomberg-grade / Palantir-grade structural terrain visualization.
 * NOT gaming. NOT playful. Capital truth rendered spatially.
 *
 * LAYERS:
 *  1. High-resolution structural mesh (200×200 subdivisions)
 *  2. Institutional contour line system (subtle cyan, equidistant)
 *  3. Probability dispersion atmosphere (variance-reactive)
 *  4. Capital stress zones (survival → color shift)
 *  5. Runway horizon marker (vertical beam at exhaustion index)
 *  6. Surface micro-detailing (noise displacement, metallic material)
 *  7. Camera & lighting (institutional: soft top, rim, ambient, bloom)
 *  8. Grid foundation (faint analytical base)
 *
 * CONSTRAINTS:
 *  - 60fps target
 *  - No heavy shaders / no volumetric raymarching
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
// CONSTANTS — HIGH-RES INSTITUTIONAL TERRAIN
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

// Number of equidistant contour levels
const CONTOUR_LEVELS = 12;

// ============================================================================
// DETERMINISTIC NOISE (identical to canonical mountain)
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
// MASSIF PEAKS (identical to canonical)
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
// PALETTE — Institutional charcoal + cyan structural highlights
// ============================================================================

function heightColor(h01: number, stressFactor: number): THREE.Color {
  const t = clamp01(h01);

  // Base palette: dark charcoal → slate → ice blue → white peak
  const sky = new THREE.Color("#071318");
  const low = new THREE.Color("#1a2a35");
  const mid = new THREE.Color("#22d3ee").multiplyScalar(0.35);
  const high = new THREE.Color("#e0f0f5").lerp(new THREE.Color("#22d3ee"), 0.25);
  const peak = new THREE.Color("#f8fcff");

  let c: THREE.Color;
  if (t < 0.15) c = sky.clone().lerp(low, t / 0.15);
  else if (t < 0.45) c = low.clone().lerp(mid, (t - 0.15) / 0.3);
  else if (t < 0.75) c = mid.clone().lerp(high, (t - 0.45) / 0.3);
  else c = high.clone().lerp(peak, (t - 0.75) / 0.25);

  // LAYER 4: Capital stress zones — tint toward muted red when survival drops
  if (stressFactor > 0) {
    const stressColor = new THREE.Color("#8b2252"); // Muted deep red
    c.lerp(stressColor, stressFactor * 0.35);
  }

  return c;
}

// ============================================================================
// HEIGHTFIELD COMPUTATION (replicates canonical math at 200×200)
// ============================================================================

function computeHeightfield(
  dataPoints: number[],
  positions: THREE.BufferAttribute,
  stressFactor: number
): { maxHeight: number; heights: Float32Array; colors: Float32Array } {
  const count = positions.count;
  const wHalf = MESH_W / 2;
  const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

  const heights = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  let maxH = 0.01;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getY(i);
    const kpiX = ((x + wHalf) / MESH_W) * 6;

    let ridge = 0;
    for (let idx = 0; idx < 7; idx++) {
      const v = clamp01(dp[idx]);
      const g = gaussian1(kpiX, idx, 0.48);
      ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
    }

    let h = ridge * BASE_SCALE;

    for (const m of MASSIF_PEAKS) {
      const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
      h += g * m.amplitude * MASSIF_SCALE;
    }

    const rugged = ridgeNoise(x, z);
    h += rugged * (0.3 + h * 0.08);

    // Micro-detailing noise displacement (LAYER 6)
    const microNoise = noise2(x * 3, z * 3) * 0.08 + noise2(x * 7, z * 7) * 0.03;
    h += microNoise;

    const dist = Math.sqrt(x * x + z * z * 1.4);
    const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));

    const n = noise2(x, z) * 0.2;
    const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
    let finalH = Math.max(0, (h + n) * mask * cliff);
    finalH = applySoftCeiling(finalH);

    heights[i] = finalH;
    if (finalH > maxH) maxH = finalH;
  }

  // Compute vertex colors
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
// LAYER 1: HIGH-RES STRUCTURAL MESH
// ============================================================================

interface InstitutionalTerrainProps {
  dataPoints: number[];
  stressFactor: number;       // 0–1: survival pressure (higher = more red)
  varianceWidth: number;      // 0–1: probability dispersion width
  runwayMonths: number;       // Runway in months (for horizon marker position)
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
  const contourGroupRef = useRef<THREE.Group>(null);
  const dispersionRef = useRef<THREE.Mesh>(null);
  const runwayRef = useRef<THREE.Mesh>(null);
  const maxHeightRef = useRef(1);

  // LAYER 1: High-res geometry (200×200)
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W, GRID_D);
    const count = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, []);

  // Compute heightfield and apply to geometry
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;

    const { maxHeight, heights, colors } = computeHeightfield(dataPoints, pos, stressFactor);
    maxHeightRef.current = maxHeight;

    // Apply heights
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, heights[i]);
    }

    // Apply colors
    col.set(colors);

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();
  }, [dataPoints, stressFactor]);

  // LAYER 2: Contour lines (generated from heightfield)
  const contourLines = useMemo(() => {
    if (!meshRef.current) return [];

    const geo = geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const maxH = maxHeightRef.current;
    if (maxH < 0.1) return [];

    const lines: THREE.Vector3[][] = [];
    const step = maxH / (CONTOUR_LEVELS + 1);

    // March through rows to find contour crossings
    const cols = GRID_W + 1;
    const rows = GRID_D + 1;

    for (let level = 1; level <= CONTOUR_LEVELS; level++) {
      const threshold = step * level;
      const pts: THREE.Vector3[] = [];

      // Simple marching: scan horizontal rows for threshold crossings
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const i1 = r * cols + c;
          const i2 = r * cols + c + 1;
          const h1 = pos.getZ(i1);
          const h2 = pos.getZ(i2);

          if ((h1 < threshold && h2 >= threshold) || (h1 >= threshold && h2 < threshold)) {
            const t = (threshold - h1) / (h2 - h1);
            const x = lerp(pos.getX(i1), pos.getX(i2), t);
            const z = lerp(pos.getY(i1), pos.getY(i2), t);
            pts.push(new THREE.Vector3(x, z, threshold + 0.02));
          }
        }
      }

      if (pts.length > 3) {
        // Sort points by angle from center for closed contour appearance
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
        lines.push(pts);
      }
    }

    return lines;
  }, [dataPoints, geometry]);

  // LAYER 5: Runway horizon marker position (maps months → X position)
  const runwayX = useMemo(() => {
    const t = clamp01(runwayMonths / maxHorizonMonths);
    return lerp(-MESH_W / 2, MESH_W / 2, t);
  }, [runwayMonths, maxHorizonMonths]);

  // Breathing animation (subtle, institutional)
  const breathRef = useRef(0);

  useFrame((_, delta) => {
    breathRef.current += delta;
    const t = breathRef.current;

    // Micro-idle camera movement (barely perceptible)
    if (meshRef.current) {
      const breathCycle = Math.sin(t * 0.3) * 0.5 + 0.5;
      const scale = 1 + breathCycle * 0.008; // 0.8% max scale pulse
      meshRef.current.scale.setScalar(scale);
    }

    // Dispersion layer opacity pulsing (subtle)
    if (dispersionRef.current) {
      const mat = dispersionRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = 0.06 + varianceWidth * 0.12;
      mat.opacity = baseOpacity + Math.sin(t * 0.5) * 0.015;
    }

    // Runway marker glow pulse
    if (runwayRef.current) {
      const mat = runwayRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* LAYER 1: High-res fill mesh — dark charcoal metallic */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.32}
          roughness={0.15}           // Low roughness — institutional metallic
          metalness={0.85}           // High metalness — premium finish
          side={THREE.DoubleSide}
          emissive={new THREE.Color("#0a3d5c")}
          emissiveIntensity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* LAYER 1b: Wireframe overlay — structural grid visible */}
      <mesh ref={wireRef} geometry={geometry}>
        <meshBasicMaterial
          vertexColors
          wireframe
          transparent
          opacity={0.65}
          toneMapped={false}
        />
      </mesh>

      {/* LAYER 2: Contour lines — equidistant, subtle cyan */}
      <group ref={contourGroupRef}>
        {contourLines.map((pts, i) =>
          pts.length > 2 ? (
            <line key={`contour-${i}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[
                    new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z])),
                    3,
                  ]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#22d3ee"
                transparent
                opacity={0.15 + (i / CONTOUR_LEVELS) * 0.1}
                linewidth={1}
              />
            </line>
          ) : null
        )}
      </group>

      {/* LAYER 3: Probability dispersion atmosphere */}
      <mesh ref={dispersionRef} position={[0, 0, maxHeightRef.current * 0.6]}>
        <planeGeometry args={[MESH_W * 0.8, MESH_D * 0.7]} />
        <meshBasicMaterial
          color="#4338ca"                  // Indigo / ice blue
          transparent
          opacity={0.06 + varianceWidth * 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* LAYER 5: Runway horizon marker — vertical cyan beam */}
      <group position={[runwayX, 0, 0]}>
        <mesh ref={runwayRef}>
          <planeGeometry args={[0.08, maxHeightRef.current * 1.5]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Runway glow point light */}
        <pointLight
          color="#22d3ee"
          intensity={0.3}
          distance={8}
          decay={2}
          position={[0, 0, maxHeightRef.current * 0.5]}
        />
      </group>
    </group>
  );
}

// ============================================================================
// LAYER 8: GRID FOUNDATION
// ============================================================================

function AnalyticalGrid() {
  return (
    <Grid
      position={[0, -2.5, 0]}
      args={[60, 60]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#1a2332"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#22d3ee"
      fadeDistance={35}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
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
  showGrid?: boolean;               // Optional grid foundation
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
  // LAYER 4: Capital stress factor (0 = no stress, 1 = maximum)
  const stressFactor = useMemo(() => {
    if (survivalProbability >= 80) return 0;
    if (survivalProbability <= 30) return 1;
    return 1 - (survivalProbability - 30) / 50;
  }, [survivalProbability]);

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
          {/* Background color — deep institutional charcoal */}
          <color attach="background" args={["#0E1116"]} />
          <fog attach="fog" args={["#0E1116", 35, 80]} />

          {/* LAYER 7: Camera — slightly elevated, calm authority */}
          <PerspectiveCamera makeDefault position={[0, 8, 30]} fov={36} />

          {/* LAYER 7: Lighting — institutional grade */}
          {/* Soft top directional (cool tone) */}
          <directionalLight position={[0, 20, 8]} intensity={0.5} color="#e8f0f6" />
          {/* Low-intensity cyan rim light */}
          <directionalLight position={[-8, 12, -5]} intensity={0.12} color="#22d3ee" />
          {/* Secondary rim (warm neutral) */}
          <directionalLight position={[10, 15, -3]} intensity={0.06} color="#94a3b8" />
          {/* Subtle ambient fill */}
          <ambientLight intensity={0.15} />
          {/* Subsurface structural glow */}
          <pointLight position={[0, -4, 0]} intensity={0.4} color="#22d3ee" distance={20} decay={2} />

          {/* THE TERRAIN — all layers rendered together */}
          <InstitutionalTerrain
            dataPoints={dataPoints}
            stressFactor={stressFactor}
            varianceWidth={varianceWidth}
            runwayMonths={runwayMonths}
            maxHorizonMonths={maxHorizonMonths}
          />

          {/* LAYER 8: Grid foundation (optional) */}
          {showGrid && <AnalyticalGrid />}

          {/* Calm institutional orbit — barely perceptible idle movement */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            rotateSpeed={0.3}
            autoRotate
            autoRotateSpeed={0.08}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.4}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />

          {/* LAYER 7: Controlled bloom — low threshold, institutional */}
          <EffectComposer>
            <Bloom
              intensity={0.25}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette offset={0.4} darkness={0.35} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

