// src/components/compare/GodModeMountain.tsx
// STRATFIT — Obsidian Instrument with Photorealistic Background
// Glass mountain with trajectory veins over realistic alpine backdrop

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, Text, useTexture } from "@react-three/drei";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";
import { useThree } from "@react-three/fiber";

// --- CONFIGURATION: OBSIDIAN INSTRUMENT SPEC ---
const CONFIG = {
  height: 5.2,
  baseColor: "#0b1220",
  roughness: 0.55,
  transmission: 0.35,
  thickness: 2.0,
  ior: 1.25,
  chromaticAberration: 0.01,
  wireOpacity: 0.025,
  veinWidth: 0.014,
  veinGlow: 5.5,
  gridColor: "#223046",
};

const noise2D = createNoise2D();

type Scenario = { score?: number };

function surfaceZ(x: number, y: number) {
  const dist = Math.sqrt(x * x + y * y);
  const peak = Math.pow(Math.max(0, 1.0 - dist / 5.1), 2.75) * CONFIG.height;
  const riskNoise = Math.abs(noise2D(x * 0.55, y * 0.55));
  return peak + riskNoise * 0.55 * (peak / CONFIG.height);
}

function generateTrajectory(score: number, side: -1 | 1) {
  const points: THREE.Vector3[] = [];
  const divergence = (100 - score) * 0.10 * side;

  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const y = 4.6 - t * 9.2;
    const x = t * 3.9 * side + Math.sin(t * Math.PI * 2) * divergence * 0.45;
    const z = surfaceZ(x, y);
    points.push(new THREE.Vector3(x, y, z + 0.085));
  }
  return new THREE.CatmullRomCurve3(points);
}

export const GodModeMountain: React.FC<{ scenarioA: Scenario; scenarioB: Scenario; t?: number }> = ({
  scenarioA,
  scenarioB,
  t = 0.5,
}) => {
  const { scene } = useThree();
  
  // 1. LOAD BACKGROUND IMAGE
  // Make sure 'realistic-mountain.jpg' is in your /public folder
  const backgroundTexture = useTexture("/realistic-mountain.jpg");

  // 2. SET AS SCENE BACKGROUND
  useEffect(() => {
    backgroundTexture.colorSpace = THREE.SRGBColorSpace; // Correct color encoding
    scene.background = backgroundTexture;
    return () => { scene.background = null; }; // Cleanup
  }, [scene, backgroundTexture]);

  const scoreA = scenarioA.score ?? 72;
  const scoreB = scenarioB.score ?? 65;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 12, 240, 240);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, surfaceZ(pos.getX(i), pos.getY(i)));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const pathA = useMemo(() => generateTrajectory(scoreA, -1), [scoreA]);
  const pathB = useMemo(() => generateTrajectory(scoreB, 1), [scoreB]);

  const tSlice = THREE.MathUtils.clamp(t, 0, 1);
  const pA = useMemo(() => pathA.getPoint(tSlice), [pathA, tSlice]);
  const pB = useMemo(() => pathB.getPoint(tSlice), [pathB, tSlice]);
  const mid = useMemo(() => pA.clone().add(pB).multiplyScalar(0.5), [pA, pB]);

  const dashedGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      pA.clone().setZ(pA.z + 0.12),
      pB.clone().setZ(pB.z + 0.12)
    ]);
    return geo;
  }, [pA, pB]);

  const dashedLineRef = useRef<THREE.Line>(null);
  useEffect(() => {
    if (dashedLineRef.current) dashedLineRef.current.computeLineDistances();
  }, [dashedGeo]);

  const monthAtT = Math.round(tSlice * 36);
  const arrDelta = ((scoreA - scoreB) / 100 * 2.1 * (1 + tSlice)).toFixed(1);

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      {/* 3. ADJUST LIGHTING FOR NEW BACKGROUND */}
      {/* Lower ambient light to let the background set the mood */}
      <ambientLight intensity={0.2} />
      {/* Stronger key light to define the obsidian shape against the bright background */}
      <spotLight position={[0, 15, 10]} intensity={30} angle={0.5} penumbra={1} color="white" />
      
      <pointLight position={[-10, 0, -5]} intensity={2} color="#22d3ee" distance={20} />
      <pointLight position={[10, 0, -5]} intensity={2} color="#eab308" distance={20} />

      {/* OBSIDIAN MOUNTAIN - Glass/transmission material */}
      <mesh geometry={geometry} receiveShadow>
        <MeshTransmissionMaterial
          roughness={CONFIG.roughness}
          transmission={CONFIG.transmission}
          thickness={CONFIG.thickness}
          ior={CONFIG.ior}
          chromaticAberration={CONFIG.chromaticAberration}
          color={CONFIG.baseColor}
          backside
          anisotropicBlur={0.1}
        />
      </mesh>

      {/* Subtle wireframe overlay */}
      <mesh geometry={geometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial
          wireframe
          color="white"
          transparent
          opacity={CONFIG.wireOpacity}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* CYAN TRAJECTORY - Baseline path */}
      <mesh>
        <tubeGeometry args={[pathA, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee" 
          emissive="#22d3ee" 
          emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} 
          transparent 
          opacity={0.9}
        />
      </mesh>

      {/* GOLD TRAJECTORY - Exploration path */}
      <mesh>
        <tubeGeometry args={[pathB, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#eab308" 
          emissive="#eab308" 
          emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} 
          transparent 
          opacity={0.9}
        />
      </mesh>

      {/* TIMELINE MARKERS */}
      <group position={[6.2, 0, 0]}>
        <Text position={[0, 4.6, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">
          NOW (T+0)
        </Text>
        <Text position={[0, 0, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">
          T+18
        </Text>
        <Text position={[0, -4.6, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">
          HORIZON (T+36)
        </Text>
      </group>

      {/* DIVERGENCE LINE */}
      <line ref={dashedLineRef} geometry={dashedGeo}>
        <lineDashedMaterial 
          color="white" 
          transparent 
          opacity={0.4} 
          dashSize={0.2} 
          gapSize={0.1} 
        />
      </line>

      {/* DATA TAG - ARR Delta */}
      <Html position={[mid.x, mid.y, mid.z + 0.5]} center zIndexRange={[100, 0]}>
        <div className="px-2.5 py-1.5 bg-slate-900/90 border border-slate-700 rounded text-[10px] text-white shadow-xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-500">T+{monthAtT}</span>
          <span className="text-slate-600 mx-1.5">│</span>
          <span className="text-slate-400">Δ</span>
          <span className="text-emerald-400 font-semibold ml-1">+${arrDelta}M</span>
        </div>
      </Html>

      {/* Faded grid to blend with the realistic background */}
      <Grid
        position={[0, 0, -0.1]} 
        args={[20, 20]}
        cellSize={1} 
        cellThickness={1} 
        cellColor={CONFIG.gridColor}
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#334155"
        fadeDistance={32} 
        fadeStrength={2.2}
      />
    </group>
  );
};
