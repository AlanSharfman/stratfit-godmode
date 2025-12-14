// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — Mountain with 4-6 Visible Peaks
// Rugged ridgelines, depth, deterministic, no flicker

import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 55;
const MESH_D = 28;
const ISLAND_RADIUS = 24;

const BASE_SCALE = 3.5;
const PEAK_SCALE = 5.5;
const MASSIF_SCALE = 4.8;
const RIDGE_SHARPNESS = 1.8;
const CLIFF_BOOST = 1.25;

const SOFT_CEILING = 10.0;
const CEILING_START = 7.5;

// ============================================================================
// DETERMINISTIC NOISE (No random flicker)
// ============================================================================

function noise2(x: number, z: number): number {
  // Multi-frequency deterministic noise
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

function ridgeNoise(x: number, z: number): number {
  // Creates rugged ridgeline detail
  const base = Math.sin(x * 0.5) * Math.cos(z * 0.3);
  const detail = Math.abs(Math.sin(x * 2.5 + z * 1.5)) * 0.3;
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
    low: new THREE.Color("#0a3d47"),
    mid: primary.clone(),
    high: new THREE.Color("#ffffff").lerp(primary, 0.3),
    peak: new THREE.Color("#ffffff"),
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
// MASSIF DEFINITION — 6 Distinct Peaks
// ============================================================================

interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
  sharpness?: number;
}

const MASSIF_PEAKS: MassifPeak[] = [
  // MAIN PEAK — Tallest, slightly off-center
  { x: 2, z: -3, amplitude: 1.6, sigmaX: 3.2, sigmaZ: 2.8, sharpness: 1.3 },
  
  // SECONDARY PEAK — Left
  { x: -12, z: -1, amplitude: 1.2, sigmaX: 3.8, sigmaZ: 3.2 },
  
  // TERTIARY PEAK — Right
  { x: 14, z: -2, amplitude: 1.1, sigmaX: 3.5, sigmaZ: 3.0 },
  
  // RIDGE PEAK — Behind main
  { x: -3, z: 4, amplitude: 0.85, sigmaX: 4.5, sigmaZ: 3.5 },
  
  // FOOTHILL — Far left
  { x: -18, z: 3, amplitude: 0.6, sigmaX: 5.0, sigmaZ: 4.0 },
  
  // FOOTHILL — Far right
  { x: 20, z: 2, amplitude: 0.55, sigmaX: 4.5, sigmaZ: 3.8 },
];

// ============================================================================
// TERRAIN COMPONENT
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

  useLayoutEffect(() => {
    if (!meshFillRef.current || !meshWireRef.current) return;

    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count;
    const wHalf = MESH_W / 2;

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

    const heights = new Float32Array(count);
    const illuminations = new Float32Array(count);
    let maxH = 0.01;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      // KPI ridges
      let ridge = 0;
      let illumination = 0;

      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.55);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;

        if (activeKpiIndex === idx) {
          illumination = Math.max(illumination, g * 0.65);
        }
      }

      let h = ridge * BASE_SCALE;

      // Add massif peaks
      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
        const sharpened = m.sharpness ? Math.pow(g, 1 / m.sharpness) : g;
        h += sharpened * m.amplitude * MASSIF_SCALE;
      }

      // Dynamic peaks from hover/slider
      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        h += gaussian2(x - peakX, z + 1.5, 0.9 + p.sigma, 0.8 + p.sigma) * p.amplitude * PEAK_SCALE;
      }

      // Rugged ridgeline detail
      const rugged = ridgeNoise(x, z);
      h += rugged * (0.5 + h * 0.15);

      // Island mask
      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.2));

      // Deterministic noise
      const n = noise2(x, z) * 0.4;

      const cliff = Math.pow(mask, 0.5) * CLIFF_BOOST;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      heights[i] = finalH;
      illuminations[i] = illumination;
      if (finalH > maxH) maxH = finalH;
    }

    for (let i = 0; i < count; i++) {
      const h = heights[i];
      pos.setZ(i, h);
      const h01 = clamp01(h / (maxH * 0.85));
      const c = heightColor(h01, pal, illuminations[i]);
      col.setXYZ(i, c.r, c.g, c.b);
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();

    const wireGeo = meshWireRef.current.geometry as THREE.PlaneGeometry;
    wireGeo.attributes.position.needsUpdate = true;
    wireGeo.computeVertexNormals();
  }, [dataPoints, peakModel, pal, activeKpiIndex]);

  // Subtle breathing animation
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.35) * 0.04;
    }
    if (meshFillRef.current) {
      const mat = meshFillRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.03 + Math.sin(t * 0.5) * 0.015;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.18}
          roughness={0.12}
          metalness={0.88}
          side={THREE.DoubleSide}
          emissive={pal.mid}
          emissiveIntensity={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial vertexColors wireframe transparent opacity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function ScenarioMountain(props: {
  dataPoints: number[];
  activeKpiIndex: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  scenario: ScenarioId;
  className?: string;
}) {
  const {
    dataPoints = [],
    activeKpiIndex = null,
    activeLeverId = null,
    leverIntensity01 = 0,
    scenario,
    className,
  } = props;

  const colors = SCENARIO_COLORS[scenario];

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: `radial-gradient(ellipse 70% 45% at 50% 60%, ${colors.glow}, transparent 55%), #080C14`,
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <PerspectiveCamera makeDefault position={[0, 14, 38]} fov={38} />
        <ambientLight intensity={0.1} />
        <pointLight position={[20, 30, 15]} intensity={1.0} />
        <pointLight position={[-20, 18, -12]} intensity={0.6} />
        <spotLight position={[0, 25, 0]} intensity={0.4} angle={0.6} penumbra={0.8} />

        <Terrain
          dataPoints={dataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenario}
        />

        <group position={[0, -4.8, 0]}>
          <gridHelper args={[90, 45, "#1a2838", "#0e1822"]} />
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.08}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 5.5}
        />
      </Canvas>
    </div>
  );
}
