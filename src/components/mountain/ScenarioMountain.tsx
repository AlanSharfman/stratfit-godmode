// src/components/mountain/ScenarioMountain.tsx
import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// CONFIG (single mesh, peak-forward "mountain" not "wave")
// ============================================================================
const GRID_W = 150;
const GRID_D = 74;
const MESH_W = 46;
const MESH_D = 22;

const ISLAND_RADIUS = 19.5;

const BASE_SCALE = 10.0;      // from datapoints
const PEAK_SCALE = 18.0;      // from peak model
const MASSIF_SCALE = 12.0;    // always-on shape to feel like mountain

const RIDGE_SHARPNESS = 1.65; // >1 sharpens profile
const CLIFF_BOOST = 1.28;     // makes peaks feel steeper

// deterministic texture (no randomness)
function noise2(x: number, z: number) {
  const n1 = Math.sin(x * 0.68 + z * 0.33) * 0.22;
  const n2 = Math.cos(x * 1.18 - z * 0.57) * 0.14;
  const n3 = Math.sin((x + z) * 2.1) * 0.05;
  return n1 + n2 + n3;
}

function gaussian1(x: number, c: number, s: number) {
  const sig = Math.max(0.12, s);
  const t = (x - c) / sig;
  return Math.exp(-0.5 * t * t);
}

// 2D gaussian in world coords (for massif bumps)
function gaussian2(dx: number, dz: number, sx: number, sz: number) {
  const sx2 = Math.max(0.25, sx) ** 2;
  const sz2 = Math.max(0.25, sz) ** 2;
  return Math.exp(-0.5 * ((dx * dx) / sx2 + (dz * dz) / sz2));
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function paletteForScenario(s: ScenarioId) {
  // No yellow. Premium cyan/purple/pink/red.
  switch (s) {
    case "upside":
      return {
        sky: new THREE.Color("#0B0E14"),
        low: new THREE.Color("#22d3ee"),
        mid: new THREE.Color("#34d399"),
        high: new THREE.Color("#a78bfa"),
        accent: new THREE.Color("#34d399"),
      };
    case "downside":
      return {
        sky: new THREE.Color("#0B0E14"),
        low: new THREE.Color("#fb7185"),
        mid: new THREE.Color("#f472b6"),
        high: new THREE.Color("#a78bfa"),
        accent: new THREE.Color("#fb7185"),
      };
    case "extreme":
      return {
        sky: new THREE.Color("#0B0E14"),
        low: new THREE.Color("#fb7185"),
        mid: new THREE.Color("#ef4444"),
        high: new THREE.Color("#a78bfa"),
        accent: new THREE.Color("#ef4444"),
      };
    case "base":
    default:
      return {
        sky: new THREE.Color("#0B0E14"),
        low: new THREE.Color("#22d3ee"),
        mid: new THREE.Color("#7c3aed"),
        high: new THREE.Color("#f0abfc"),
        accent: new THREE.Color("#22d3ee"),
      };
  }
}

function heightColor(h01: number, pal: ReturnType<typeof paletteForScenario>) {
  const t = clamp01(h01);
  // deep -> low -> mid -> high (smooth)
  const deep = pal.sky.clone().lerp(new THREE.Color("#111827"), 0.35);
  if (t < 0.30) return deep.lerp(pal.low.clone(), t / 0.30);
  if (t < 0.70) return pal.low.clone().lerp(pal.mid.clone(), (t - 0.30) / 0.40);
  return pal.mid.clone().lerp(pal.high.clone(), (t - 0.70) / 0.30);
}

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

    // Signature massif bumps (world coords) — limited count, central mountain feel
    const massif = [
      { x: 0.0, z: -1.0, a: 1.0, sx: 5.6, sz: 3.2 },
      { x: -7.5, z: -0.6, a: 0.55, sx: 3.6, sz: 2.5 },
      { x: 7.2, z: -0.8, a: 0.55, sx: 3.6, sz: 2.5 },
    ];

    const heights = new Float32Array(count);
    let maxH = 0.001;

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // plane's Y acts as depth axis before rotation

      // Map X -> KPI domain 0..6
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      // Base ridge from dataPoints (sharpened)
      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(dp[idx]);
        const g = gaussian1(kpiX, idx, 0.82);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }
      let h = ridge * BASE_SCALE;

      // Massif gives "mountainness" even when ridge is flat
      for (const m of massif) {
        h += gaussian2(x - m.x, z - m.z, m.sx, m.sz) * m.a * MASSIF_SCALE;
      }

      // Interactive peaks in world coords (anchored to KPI positions)
      for (const p of peakModel.peaks) {
        const idx = clamp01(p.index / 6);
        const peakX = lerp(-wHalf, wHalf, idx);
        const peakZ = -0.3; // keep peaks near front so they read as mountain
        const spread = 0.95 + p.sigma;
        h += gaussian2(x - peakX, z - peakZ, spread * 1.15, spread * 0.95) * p.amplitude * PEAK_SCALE;
      }

      // Edge shaping (island)
      const dist = Math.sqrt(x * x + z * z * 1.65);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 3.1));

      // deterministic texture + cliff boost near peaks
      const n = noise2(x, z) * 0.85;
      const cliff = Math.pow(mask, 0.65) * CLIFF_BOOST;

      const finalH = Math.max(0, (h + n) * mask * cliff);

      heights[i] = finalH;
      if (finalH > maxH) maxH = finalH;
    }

    // Write Z + colors
    for (let i = 0; i < count; i++) {
      const h = heights[i];
      pos.setZ(i, h);

      const h01 = clamp01(h / (maxH * 0.96));
      const c = heightColor(h01, pal);
      col.setXYZ(i, c.r, c.g, c.b);
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();

    // Sync wire geometry
    (meshWireRef.current.geometry as THREE.PlaneGeometry).attributes.position.needsUpdate = true;
    (meshWireRef.current.geometry as THREE.PlaneGeometry).computeVertexNormals();
  }, [dataPoints, peakModel, pal]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = Math.sin(t * 1.45) * 0.06 * (0.35 + peakModel.confidence01 * 0.75);

    if (meshFillRef.current) meshFillRef.current.position.y = breathe;
    if (meshWireRef.current) meshWireRef.current.position.y = breathe;

    // slight material intensity modulation for “alive” look
    if (meshFillRef.current) {
      const mat = meshFillRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.10 + peakModel.confidence01 * 0.30;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Atmospheric fill */}
      <mesh ref={meshFillRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.16}
          roughness={0.12}
          metalness={0.92}
          side={THREE.DoubleSide}
          emissive={pal.low}
          emissiveIntensity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* Crisp neon wire */}
      <mesh ref={meshWireRef} geometry={geometry}>
        <meshBasicMaterial
          vertexColors
          wireframe
          transparent
          opacity={0.68}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

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

  const pal = useMemo(() => paletteForScenario(scenario), [scenario]);

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden bg-[#0B0E14] ${className ?? ""}`}>
      {/* cinematic vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_100%)] opacity-60" />

      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 15.5, 30]} fov={36} />

        {/* Lights tuned for blended cyan/purple/pink */}
        <ambientLight intensity={0.20} />
        <pointLight position={[18, 26, 18]} intensity={2.25} color={pal.high} />
        <pointLight position={[-18, 14, -16]} intensity={1.85} color={pal.low} />
        <spotLight position={[0, 30, 8]} angle={0.30} penumbra={1} intensity={0.85} color={"#ffffff"} />

        <Terrain
          dataPoints={dataPoints}
          activeKpiIndex={activeKpiIndex}
          activeLeverId={activeLeverId}
          leverIntensity01={leverIntensity01}
          scenario={scenario}
        />

        {/* Floor grid */}
        <group position={[0, -1.65, 0]}>
          <gridHelper args={[100, 52, "#1e293b", "#0f172a"]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial color="#0B0E14" transparent opacity={0.86} side={THREE.DoubleSide} />
          </mesh>
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.28}
          maxPolarAngle={Math.PI / 2.12}
          minPolarAngle={Math.PI / 6.2}
        />
      </Canvas>
    </div>
  );
}
