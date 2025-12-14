// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — FIXED MOUNTAIN: Lower, Sharper, Side Peaks, Breathing

import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_W = 150;
const GRID_D = 74;
const MESH_W = 50;
const MESH_D = 24;
const ISLAND_RADIUS = 21;
const BASE_SCALE = 5.5;
const PEAK_SCALE = 10.0;
const MASSIF_SCALE = 7.5;
const RIDGE_SHARPNESS = 2.2;
const CLIFF_BOOST = 1.4;

// ============================================================================
// HELPERS
// ============================================================================

function noise2(x: number, z: number) {
  return Math.sin(x * 0.7 + z * 0.35) * 0.18 + Math.cos(x * 1.2 - z * 0.6) * 0.12 + Math.sin((x + z) * 2.3) * 0.06;
}

function noise3(x: number, z: number) {
  return Math.sin(x * 1.8 + z * 0.9) * 0.08 + Math.cos(x * 2.5 - z * 1.4) * 0.06;
}

function gaussian1(x: number, c: number, s: number) {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

function gaussian2(dx: number, dz: number, sx: number, sz: number) {
  return Math.exp(-0.5 * ((dx * dx) / Math.max(0.2, sx) ** 2 + (dz * dz) / Math.max(0.2, sz) ** 2));
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function paletteForScenario(s: ScenarioId) {
  const colors = SCENARIO_COLORS[s];
  const primary = new THREE.Color(colors.primary);
  return {
    sky: new THREE.Color("#0B0E14"),
    low: new THREE.Color("#0d4f5a"),
    mid: primary.clone(),
    high: new THREE.Color("#ffffff").lerp(primary, 0.4),
    accent: primary.clone(),
  };
}

function heightColor(h01: number, pal: ReturnType<typeof paletteForScenario>) {
  const t = clamp01(h01);
  if (t < 0.20) return pal.sky.clone().lerp(pal.low.clone(), t / 0.20);
  if (t < 0.55) return pal.low.clone().lerp(pal.mid.clone(), (t - 0.20) / 0.35);
  if (t < 0.80) return pal.mid.clone().lerp(pal.high.clone(), (t - 0.55) / 0.25);
  return pal.high.clone();
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

const Terrain: React.FC<TerrainProps> = ({ dataPoints, activeKpiIndex, activeLeverId, leverIntensity01, scenario }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshFillRef = useRef<THREE.Mesh>(null);
  const meshWireRef = useRef<THREE.Mesh>(null);

  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);
  const peakModel = useMemo(() => buildPeakModel({
    kpiCount: 7, activeKpiIndex, activeLeverId, leverIntensity01: clamp01(leverIntensity01),
  }), [activeKpiIndex, activeLeverId, leverIntensity01]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W, GRID_D);
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    return geo;
  }, []);

  useLayoutEffect(() => {
    if (!meshFillRef.current || !meshWireRef.current) return;
    const geo = meshFillRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const count = pos.count, wHalf = MESH_W / 2;
    const dp = dataPoints?.length === 7 ? dataPoints : [0.55, 0.55, 0.65, 0.40, 0.50, 0.45, 0.35];

    const massif = [
      { x: 0.0, z: -2.0, a: 1.4, sx: 4.0, sz: 3.0 },
      { x: -14.0, z: 0.5, a: 0.7, sx: 4.5, sz: 3.5 },
      { x: 14.0, z: 0.5, a: 0.65, sx: 4.2, sz: 3.2 },
      { x: -6.0, z: -1.0, a: 0.5, sx: 2.8, sz: 2.0 },
      { x: 6.0, z: -1.0, a: 0.5, sx: 2.8, sz: 2.0 },
      { x: -10.0, z: 4.0, a: 0.3, sx: 5.0, sz: 4.0 },
      { x: 10.0, z: 4.0, a: 0.3, sx: 5.0, sz: 4.0 },
    ];

    const heights = new Float32Array(count);
    let maxH = 0.001;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i), z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;
      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) ridge += Math.pow(clamp01(dp[idx]), RIDGE_SHARPNESS) * gaussian1(kpiX, idx, 0.65);
      let h = ridge * BASE_SCALE;
      for (const m of massif) h += gaussian2(x - m.x, z - m.z, m.sx, m.sz) * m.a * MASSIF_SCALE;
      for (const p of peakModel.peaks) {
        const peakX = lerp(-wHalf, wHalf, clamp01(p.index / 6));
        h += gaussian2(x - peakX, z + 1.0, (0.7 + p.sigma), (0.7 + p.sigma) * 0.85) * p.amplitude * PEAK_SCALE;
      }
      const dist = Math.sqrt(x * x + z * z * 1.5);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.8));
      const cliff = Math.pow(mask, 0.55) * CLIFF_BOOST;
      const finalH = Math.max(0, (h + noise2(x, z) * 0.6 + noise3(x * 1.3, z * 1.3) * 0.35) * mask * cliff);
      heights[i] = finalH;
      if (finalH > maxH) maxH = finalH;
    }

    for (let i = 0; i < count; i++) {
      pos.setZ(i, heights[i]);
      const c = heightColor(clamp01(heights[i] / (maxH * 0.88)), pal);
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
    if (groupRef.current) groupRef.current.position.y = Math.sin(t * 0.8) * 0.12;
    if (meshFillRef.current) {
      (meshFillRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.08 + Math.sin(t * 1.2) * 0.04 + peakModel.confidence01 * 0.15;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.5, 0]}>
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial vertexColors transparent opacity={0.2} roughness={0.1} metalness={0.9}
          side={THREE.DoubleSide} emissive={pal.mid} emissiveIntensity={0.1} depthWrite={false} />
      </mesh>
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial vertexColors wireframe transparent opacity={0.75} toneMapped={false} />
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
  const { dataPoints = [], activeKpiIndex = null, activeLeverId = null, leverIntensity01 = 0, scenario, className } = props;
  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);
  const colors = SCENARIO_COLORS[scenario];

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden ${className ?? ""}`}
      style={{ background: `radial-gradient(ellipse 900px 450px at 50% 70%, ${colors.glow}, transparent 70%), #0B0E14` }}>
      <div className="absolute inset-0 z-10 pointer-events-none opacity-25"
        style={{ background: `radial-gradient(circle at 50% 80%, ${colors.glow}, transparent 50%)` }} />
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 22, 48]} fov={36} />
        <ambientLight intensity={0.18} />
        <pointLight position={[20, 30, 20]} intensity={1.8} color={pal.high.getHex()} />
        <pointLight position={[-20, 18, -18]} intensity={1.4} color={pal.low.getHex()} />
        <spotLight position={[0, 40, 12]} angle={0.25} penumbra={1} intensity={0.8} color={"#ffffff"} />
        <Terrain dataPoints={dataPoints} activeKpiIndex={activeKpiIndex} activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01} scenario={scenario} />
        <group position={[0, -5.0, 0]}>
          <gridHelper args={[120, 60, "#1e293b", "#0f172a"]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[120, 120]} />
            <meshBasicMaterial color="#0B0E14" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.18}
          maxPolarAngle={Math.PI / 2.05} minPolarAngle={Math.PI / 5} />
      </Canvas>
    </div>
  );
}
