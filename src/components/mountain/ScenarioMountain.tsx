// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — 3D Mountain with FULL PEAK VISIBLE + More Rugged

import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

// ============================================================================
// CONSTANTS — TUNED FOR FULL VISIBILITY
// ============================================================================

const GRID_W = 150;
const GRID_D = 74;
const MESH_W = 46;
const MESH_D = 22;
const ISLAND_RADIUS = 19.5;

// REDUCED scales so peak fits in view
const BASE_SCALE = 7.0;       // Was 10.0
const PEAK_SCALE = 12.0;      // Was 18.0
const MASSIF_SCALE = 9.0;     // Was 12.0

const RIDGE_SHARPNESS = 1.8;  // Slightly sharper for more rugged look
const CLIFF_BOOST = 1.35;     // More dramatic cliffs

// ============================================================================
// HELPERS
// ============================================================================

function noise2(x: number, z: number) {
  const n1 = Math.sin(x * 0.68 + z * 0.33) * 0.22;
  const n2 = Math.cos(x * 1.18 - z * 0.57) * 0.14;
  const n3 = Math.sin((x + z) * 2.1) * 0.05;
  return n1 + n2 + n3;
}

// Extra noise layer for more ruggedness
function noise3(x: number, z: number) {
  const n1 = Math.sin(x * 1.5 + z * 0.8) * 0.12;
  const n2 = Math.cos(x * 2.3 - z * 1.2) * 0.08;
  return n1 + n2;
}

function gaussian1(x: number, c: number, s: number) {
  const sig = Math.max(0.12, s);
  const t = (x - c) / sig;
  return Math.exp(-0.5 * t * t);
}

function gaussian2(dx: number, dz: number, sx: number, sz: number) {
  const sx2 = Math.max(0.25, sx) ** 2;
  const sz2 = Math.max(0.25, sz) ** 2;
  return Math.exp(-0.5 * ((dx * dx) / sx2 + (dz * dz) / sz2));
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============================================================================
// PALETTE FROM SCENARIO
// ============================================================================

function paletteForScenario(s: ScenarioId) {
  const colors = SCENARIO_COLORS[s];
  const primary = new THREE.Color(colors.primary);
  const secondary = new THREE.Color(colors.secondary);
  
  return {
    sky: new THREE.Color("#0B0E14"),
    low: primary.clone(),
    mid: secondary.clone(),
    high: primary.clone().lerp(new THREE.Color("#ffffff"), 0.35),
    accent: primary.clone(),
  };
}

function heightColor(h01: number, pal: ReturnType<typeof paletteForScenario>) {
  const t = clamp01(h01);
  const deep = pal.sky.clone().lerp(new THREE.Color("#111827"), 0.35);
  if (t < 0.25) return deep.lerp(pal.low.clone(), t / 0.25);
  if (t < 0.60) return pal.low.clone().lerp(pal.mid.clone(), (t - 0.25) / 0.35);
  return pal.mid.clone().lerp(pal.high.clone(), (t - 0.60) / 0.40);
}

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

    const dp = dataPoints?.length === 7 ? dataPoints : [0.55, 0.55, 0.65, 0.40, 0.50, 0.45, 0.35];

    // Main massif (central peak + shoulders) — MORE DRAMATIC
    const massif = [
      { x: 0.0, z: -1.5, a: 1.2, sx: 5.0, sz: 3.5 },   // Central peak
      { x: -8.0, z: -0.5, a: 0.65, sx: 3.2, sz: 2.2 }, // Left shoulder
      { x: 8.0, z: -0.5, a: 0.65, sx: 3.2, sz: 2.2 },  // Right shoulder
      { x: -4.0, z: -2.0, a: 0.45, sx: 2.5, sz: 2.0 }, // Left sub-peak
      { x: 4.0, z: -2.0, a: 0.45, sx: 2.5, sz: 2.0 },  // Right sub-peak
    ];

    const heights = new Float32Array(count);
    let maxH = 0.001;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);

      const kpiX = ((x + wHalf) / MESH_W) * 6;

      // KPI-driven ridges
      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.75);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }
      let h = ridge * BASE_SCALE;

      // Add massif peaks
      for (const m of massif) {
        h += gaussian2(x - m.x, z - m.z, m.sx, m.sz) * m.a * MASSIF_SCALE;
      }

      // Add dynamic peaks from hover/interaction
      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        const peakZ = -0.5;
        const spread = 0.85 + p.sigma;
        h += gaussian2(x - peakX, z - peakZ, spread * 1.1, spread * 0.9) * p.amplitude * PEAK_SCALE;
      }

      // Island mask (circular falloff)
      const dist = Math.sqrt(x * x + z * z * 1.65);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 3.1));

      // Noise for ruggedness (TWO layers)
      const n1 = noise2(x, z) * 0.7;
      const n2 = noise3(x * 1.5, z * 1.5) * 0.4;
      const totalNoise = n1 + n2;

      // Cliff boost for dramatic edges
      const cliff = Math.pow(mask, 0.6) * CLIFF_BOOST;

      const finalH = Math.max(0, (h + totalNoise) * mask * cliff);

      heights[i] = finalH;
      if (finalH > maxH) maxH = finalH;
    }

    // Apply heights and colors
    for (let i = 0; i < count; i++) {
      const h = heights[i];
      pos.setZ(i, h);
      const h01 = clamp01(h / (maxH * 0.92));
      const c = heightColor(h01, pal);
      col.setXYZ(i, c.r, c.g, c.b);
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();

    (meshWireRef.current.geometry as THREE.PlaneGeometry).attributes.position.needsUpdate = true;
    (meshWireRef.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
  }, [dataPoints, peakModel, pal]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * 1.45) * 0.04 * (0.35 + peakModel.confidence01 * 0.65);

    if (meshFillRef.current) meshFillRef.current.position.y = breathe;
    if (meshWireRef.current) meshWireRef.current.position.y = breathe;

    if (meshFillRef.current) {
      const mat = meshFillRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + peakModel.confidence01 * 0.25;
    }
  });

  return (
    // MOVED DOWN more to ensure peak is visible
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.0, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.18}
          roughness={0.1}
          metalness={0.95}
          side={THREE.DoubleSide}
          emissive={pal.low}
          emissiveIntensity={0.14}
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
    className 
  } = props;
  
  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);
  const colors = SCENARIO_COLORS[scenario];

  return (
    <div 
      className={`relative w-full h-full rounded-xl overflow-hidden ${className ?? ""}`}
      style={{
        background: `radial-gradient(ellipse 1000px 500px at 50% 60%, ${colors.glow}, transparent 70%), #0B0E14`,
      }}
    >
      {/* Ambient glow overlay */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 70%, ${colors.glow}, transparent 50%)`,
        }}
      />

      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        {/* CAMERA PULLED BACK AND UP for full peak visibility */}
        <PerspectiveCamera 
          makeDefault 
          position={[0, 20, 42]}  // Was [0, 15.5, 30]
          fov={38}                 // Was 36
        />

        <ambientLight intensity={0.22} />
        <pointLight position={[18, 28, 18]} intensity={2.0} color={pal.high.getHex()} />
        <pointLight position={[-18, 16, -16]} intensity={1.6} color={pal.low.getHex()} />
        <spotLight position={[0, 35, 10]} angle={0.28} penumbra={1} intensity={0.9} color={"#ffffff"} />

        <Terrain
          dataPoints={dataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenario}
        />

        {/* Grid floor */}
        <group position={[0, -3.5, 0]}>
          <gridHelper args={[100, 52, "#1e293b", "#0f172a"]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial color="#0B0E14" transparent opacity={0.88} side={THREE.DoubleSide} />
          </mesh>
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.25}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 5.5}
        />
      </Canvas>
    </div>
  );
}
