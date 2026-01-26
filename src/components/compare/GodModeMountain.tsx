// src/components/compare/GodModeMountain.tsx
// Matte Rock — Physical Material, Shadow Depth, No Gloss

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Grid, Html, Text } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";

// --- CONFIGURATION: MATTE GEOLOGICAL ---
const CONFIG = {
  height: 4.8,
  rockColor: "#1c2129",       // Dark volcanic basalt
  gridColor: "#0c1015",       // Nearly black floor
  veinWidth: 0.011,
  veinGlow: 1.4,
};

const noise2D = createNoise2D();

type Scenario = { score?: number };

// --- MULTI-PEAK MOUNTAIN ---
function surfaceZ(x: number, y: number): number {
  const r = Math.sqrt(x * x + y * y);

  // Peak 1: Main summit
  const p1x = -0.6, p1y = 0.3;
  const d1 = Math.sqrt((x - p1x) ** 2 + (y - p1y) ** 2);
  const peak1 = Math.pow(Math.max(0, 1.0 - d1 / 4.0), 2.6) * CONFIG.height * 1.1;

  // Peak 2: Secondary
  const p2x = 1.4, p2y = -1.0;
  const d2 = Math.sqrt((x - p2x) ** 2 + (y - p2y) ** 2);
  const peak2 = Math.pow(Math.max(0, 1.0 - d2 / 2.8), 2.4) * CONFIG.height * 0.68;

  // Peak 3: Shoulder
  const p3x = -2.0, p3y = -1.5;
  const d3 = Math.sqrt((x - p3x) ** 2 + (y - p3y) ** 2);
  const peak3 = Math.pow(Math.max(0, 1.0 - d3 / 2.2), 2.2) * CONFIG.height * 0.4;

  // Saddle
  const saddleX = (p1x + p2x) / 2;
  const saddleY = (p1y + p2y) / 2;
  const dSaddle = Math.sqrt((x - saddleX) ** 2 + (y - saddleY) ** 2);
  const saddle = Math.pow(Math.max(0, 1.0 - dSaddle / 2.5), 1.6) * CONFIG.height * 0.3;

  // Terrain noise
  const medNoise = noise2D(x * 0.6, y * 0.6) * 0.35;
  const highNoise = noise2D(x * 1.8, y * 1.8) * 0.15;

  const baseMass = Math.max(peak1, peak2, peak3) + saddle * 0.4;
  const detail = medNoise + highNoise;
  const heightMask = Math.min(1, baseMass / (CONFIG.height * 0.5));
  const edgeFalloff = Math.pow(Math.max(0, 1 - r / 5.5), 0.7);

  return Math.max(0, (baseMass + detail * heightMask * 0.6) * edgeFalloff);
}

function generateTrajectory(score: number, side: -1 | 1) {
  const points: THREE.Vector3[] = [];
  const divergence = (100 - score) * 0.08 * side;

  for (let i = 0; i <= 140; i++) {
    const t = i / 140;
    const y = 4.2 - t * 8.8;
    const xBase = t * 3.2 * side;
    const xWave = Math.sin(t * Math.PI * 1.8) * divergence * 0.5;
    const x = xBase + xWave;
    const z = surfaceZ(x, y);
    points.push(new THREE.Vector3(x, y, z + 0.06));
  }
  return new THREE.CatmullRomCurve3(points);
}

export const GodModeMountain: React.FC<{ scenarioA: Scenario; scenarioB: Scenario; t?: number }> = ({
  scenarioA,
  scenarioB,
  t = 0.5,
}) => {
  const scoreA = scenarioA.score ?? 72;
  const scoreB = scenarioB.score ?? 65;

  const rootRef = useRef<THREE.Group>(null);
  const tSlice = THREE.MathUtils.clamp(t, 0, 1);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 12, 280, 280);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, surfaceZ(x, y));
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  const pathA = useMemo(() => generateTrajectory(scoreA, -1), [scoreA]);
  const pathB = useMemo(() => generateTrajectory(scoreB, 1), [scoreB]);

  const pA = useMemo(() => pathA.getPoint(tSlice), [pathA, tSlice]);
  const pB = useMemo(() => pathB.getPoint(tSlice), [pathB, tSlice]);
  const mid = useMemo(() => pA.clone().add(pB).multiplyScalar(0.5), [pA, pB]);

  const dashedGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      pA.clone().setZ(pA.z + 0.12),
      pB.clone().setZ(pB.z + 0.12)
    ]);
  }, [pA, pB]);

  const dashedLineRef = useRef<THREE.Line>(null);
  useEffect(() => {
    if (dashedLineRef.current) dashedLineRef.current.computeLineDistances();
  }, [dashedGeo]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.position.y = -1 + Math.sin(time * 0.5) * 0.01;
    }
  });

  const monthAtT = Math.round(tSlice * 36);
  const arrDelta = ((scoreA - scoreB) / 100 * 2.1 * (1 + tSlice)).toFixed(1);

  return (
    <group ref={rootRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      
      {/* === LIGHTING: PHYSICAL, SHADOW-SHAPING === */}
      
      {/* Very low ambient — forces shadows to be dark */}
      <ambientLight intensity={0.08} color="#334155" />

      {/* Key light: hard, directional, creates shadow depth */}
      <directionalLight
        position={[-8, 12, 6]}
        intensity={1.8}
        color="#e2e8f0"
        castShadow
      />

      {/* Fill light: opposite side, very weak */}
      <directionalLight
        position={[6, 4, -4]}
        intensity={0.25}
        color="#64748b"
      />

      {/* Rim light: back edge separation */}
      <directionalLight
        position={[0, 6, -10]}
        intensity={0.4}
        color="#475569"
      />

      {/* Accent: data path colors (very subtle) */}
      <pointLight position={[-4, 1, -2]} intensity={0.3} color="#22d3ee" distance={8} decay={2} />
      <pointLight position={[4, 1, -2]} intensity={0.3} color="#f59e0b" distance={8} decay={2} />

      {/* === MOUNTAIN: MATTE ROCK === */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          color={CONFIG.rockColor}
          roughness={0.92}           // Very matte — no specular shine
          metalness={0.0}            // Not metallic at all
          envMapIntensity={0.0}      // No environment reflections
          flatShading={false}        // Smooth normals for natural rock
        />
      </mesh>

      {/* === DATA PATHS === */}
      <mesh>
        <tubeGeometry args={[pathA, 150, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={CONFIG.veinGlow}
          roughness={0.25}
          metalness={0.5}
          envMapIntensity={0.0}
        />
      </mesh>

      <mesh>
        <tubeGeometry args={[pathB, 150, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={CONFIG.veinGlow}
          roughness={0.25}
          metalness={0.5}
          envMapIntensity={0.0}
        />
      </mesh>

      {/* === TEMPORAL MARKERS === */}
      <group position={[6.2, 0, 0]}>
        <Text position={[0, 4.2, 0.2]} fontSize={0.22} color="#475569" anchorX="left">
          NOW
        </Text>
        <Text position={[0, 0, 0.2]} fontSize={0.22} color="#475569" anchorX="left">
          T+18
        </Text>
        <Text position={[0, -4.2, 0.2]} fontSize={0.22} color="#475569" anchorX="left">
          HORIZON
        </Text>
      </group>

      {/* === DIVERGENCE LINE === */}
      <line ref={dashedLineRef} geometry={dashedGeo}>
        <lineDashedMaterial
          color="#64748b"
          transparent
          opacity={0.5}
          dashSize={0.18}
          gapSize={0.08}
        />
      </line>

      <Html position={[mid.x, mid.y, mid.z + 0.5]} center zIndexRange={[100, 0]}>
        <div className="px-2.5 py-1.5 bg-slate-950/95 border border-slate-700/60 rounded text-[10px] text-white shadow-2xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-500">T+{monthAtT}</span>
          <span className="text-slate-600 mx-1.5">│</span>
          <span className="text-slate-400">Δ</span>
          <span className="text-emerald-400 font-semibold ml-1">+${arrDelta}M</span>
        </div>
      </Html>

      {/* === LABEL === */}
      <Html position={[0, 5.6, 0]} center>
        <div className="text-[9px] tracking-[0.4em] text-slate-600 font-medium uppercase">
          Strategic Divergence Surface
        </div>
      </Html>

      {/* === FLOOR: DARK, NO DISTRACTION === */}
      <Grid
        position={[0, 0, -0.05]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.4}
        cellColor={CONFIG.gridColor}
        sectionSize={5}
        sectionThickness={0.5}
        sectionColor="#1a1f2e"
        fadeDistance={14}
        fadeStrength={2.5}
      />
    </group>
  );
};
