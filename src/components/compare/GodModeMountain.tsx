import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, Text } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";

// --- CONFIGURATION ---
const CONFIG = {
  height: 6.5,               // Taller, more aggressive peak
  baseColor: "#0f172a",      // Deep Slate (Not pitch black, so we see shadows)
  highlightColor: "#334155", // Lighter slate for the ridges
  veinWidth: 0.02,
  veinGlow: 6.0, 
  gridColor: "#1e293b",
};

const noise2D = createNoise2D();

type Scenario = { score?: number };

// --- NEW MATH: RIDGED FRACTAL (The "Rock" Algorithm) ---
function surfaceZ(x: number, y: number) {
  // 1. THE MAIN CONE (The Silhouette)
  const dist = Math.sqrt(x*x + y*y);
  // We use a sharper exponent (3.0) to make it steep, not round
  const baseShape = Math.pow(Math.max(0, 1.0 - dist / 5.8), 3.0) * CONFIG.height;

  // 2. THE RIDGE LAYERS (The Texture)
  // We use Math.abs() to create sharp "V" shapes instead of smooth "U" shapes
  const ridge1 = Math.abs(noise2D(x * 0.4, y * 0.4)); // Big cuts
  const ridge2 = Math.abs(noise2D(x * 1.5, y * 1.5)); // Medium facets
  const ridge3 = Math.abs(noise2D(x * 4.0, y * 4.0)); // Fine grit

  // 3. COMBINE (Subtracting noise creates "Canyons")
  // We only apply noise where the mountain exists (baseShape > 0.1)
  if (baseShape < 0.1) return 0;
  
  const details = (ridge1 * 1.5) + (ridge2 * 0.5) + (ridge3 * 0.1);
  
  // The magic: Subtract details from the base to "carve" it
  return Math.max(0, baseShape - (details * 0.6 * (baseShape / CONFIG.height)));
}

function generateTrajectory(score: number, side: -1 | 1) {
  const points: THREE.Vector3[] = [];
  const divergence = (100 - score) * 0.10 * side;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const y = 4.6 - t * 9.2;
    const x = t * 3.9 * side + Math.sin(t * Math.PI * 2) * divergence * 0.45;
    const z = surfaceZ(x, y);
    // Lift the line slightly higher so it doesn't clip through the sharp ridges
    points.push(new THREE.Vector3(x, y, z + 0.15)); 
  }
  return new THREE.CatmullRomCurve3(points);
}

export const GodModeMountain: React.FC<{ scenarioA: Scenario; scenarioB: Scenario }> = ({
  scenarioA,
  scenarioB,
}) => {
  const scoreA = scenarioA.score ?? 72;
  const scoreB = scenarioB.score ?? 65;

  const geometry = useMemo(() => {
    // LOWER RESOLUTION (120) + FLAT SHADING = Low Poly Rock Look
    // Higher resolution (300) makes it look smooth/plastic again.
    const geo = new THREE.PlaneGeometry(12, 12, 140, 140); 
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, surfaceZ(pos.getX(i), pos.getY(i)));
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  const pathA = useMemo(() => generateTrajectory(scoreA, -1), [scoreA]);
  const pathB = useMemo(() => generateTrajectory(scoreB, 1), [scoreB]);
  
  const tSlice = 0.5; 
  const pA = useMemo(() => pathA.getPoint(tSlice), [pathA]);
  const pB = useMemo(() => pathB.getPoint(tSlice), [pathB]);
  const mid = useMemo(() => pA.clone().add(pB).multiplyScalar(0.5), [pA, pB]);
  
  // Dashed line geometry
  const dashedGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      pA.clone().setZ(pA.z + 0.2), 
      pB.clone().setZ(pB.z + 0.2)
    ]);
  }, [pA, pB]);

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      {/* SHARP LIGHTING for FACETS */}
      <ambientLight intensity={0.2} />
      {/* Side light to catch the edges of the facets */}
      <directionalLight position={[10, 5, 2]} intensity={2} color="#38bdf8" /> 
      <directionalLight position={[-10, 5, 2]} intensity={2} color="#f472b6" /> 

      {/* 1. THE FACETED OBSIDIAN TERRAIN */}
      <mesh geometry={geometry} receiveShadow castShadow>
        {/* flatShading={true} is the KEY fix here */}
        <meshStandardMaterial 
          color={CONFIG.baseColor}
          roughness={0.4}
          metalness={0.6}
          flatShading={true} 
        />
      </mesh>

      {/* 2. WIREFRAME GHOST (Tech Layer) */}
      <mesh geometry={geometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial 
          wireframe 
          color="white" 
          transparent 
          opacity={0.05}
        />
      </mesh>

      {/* 3. CYAN DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathA, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee" emissive="#22d3ee" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={1}
        />
      </mesh>

      {/* 4. GOLD DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathB, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#fbbf24" emissive="#fbbf24" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={1}
        />
      </mesh>

      <group position={[6.2, 0, 0]}>
        <Text position={[0, 4.6, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">NOW (T+0)</Text>
        <Text position={[0, 0, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">T+18</Text>
        <Text position={[0, -4.6, 0.2]} fontSize={0.25} color="#64748b" anchorX="left">HORIZON (T+36)</Text>
      </group>

      <line geometry={dashedGeo}>
        <lineDashedMaterial color="white" transparent opacity={0.4} dashSize={0.2} gapSize={0.1} />
      </line>

      <Html position={[mid.x, mid.y, mid.z + 0.5]} center zIndexRange={[100, 0]}>
        <div className="px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-[2px] text-[10px] text-white shadow-xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-400">Δ</span> <span className="text-emerald-400 font-semibold">+$2.1M ARR</span>
        </div>
      </Html>

      <Grid
        position={[0, 0, -0.05]} args={[20, 20]}
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
