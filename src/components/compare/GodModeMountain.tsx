import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, MeshTransmissionMaterial, Text } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";

// --- CONFIGURATION: OBSIDIAN INSTRUMENT ---
const CONFIG = {
  height: 5.2,
  baseColor: "#050b14",      // Pitch Black (Best for instrument look)
  roughness: 0.55,           // Chiseled stone feel
  transmission: 0.35,        // Dense glass opacity
  thickness: 2.5,
  ior: 1.25,
  chromaticAberration: 0.02, // Slight prism effect on edges
  wireOpacity: 0.03,
  veinWidth: 0.014,
  veinGlow: 8.0,             // Bright neon to pop against black
  gridColor: "#1e293b",
};

const noise2D = createNoise2D();

type Scenario = { score?: number };

// --- NEW MATH: CHISELED OBSIDIAN ---
function surfaceZ(x: number, y: number) {
  const dist = Math.sqrt(x * x + y * y);
  
  // 1. THE CONE (Base Shape)
  // Tighter radius (5.0) for a steeper, more dramatic peak
  const baseShape = Math.max(0, 1.0 - dist / 5.0);
  const peak = Math.pow(baseShape, 2.2) * CONFIG.height;

  // 2. THE CHISEL (Sharp Ridges)
  // We use Math.abs() to create sharp "V" creases instead of smooth waves.
  // This removes the "melting" look.
  const n1 = Math.abs(noise2D(x * 0.6, y * 0.6)); // Large cuts
  const n2 = Math.abs(noise2D(x * 1.5, y * 1.5)); // Fine detail fractures
  
  // Subtracting noise cuts into the volume, creating cliffs
  const cuts = (n1 + n2 * 0.5) * 1.2;
  
  return peak - (cuts * baseShape * 0.8); 
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

export const GodModeMountain: React.FC<{ scenarioA: Scenario; scenarioB: Scenario }> = ({
  scenarioA,
  scenarioB,
}) => {
  const scoreA = scenarioA.score ?? 72;
  const scoreB = scenarioB.score ?? 65;

  const geometry = useMemo(() => {
    // Increased segments (256) for sharper ridge definition
    const geo = new THREE.PlaneGeometry(12, 12, 256, 256);
    const pos = geo.attributes.position as THREE.BufferAttribute;
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

  const dashedGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      pA.clone().setZ(pA.z + 0.15), // Raised slightly for visibility
      pB.clone().setZ(pB.z + 0.15)
    ]);
    return geo;
  }, [pA, pB]);

  const dashedLineRef = useRef<THREE.Line>(null);
  useEffect(() => {
    if (dashedLineRef.current) dashedLineRef.current.computeLineDistances();
  }, [dashedGeo]);

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      {/* LIGHTING RESET: Back to "Instrument" settings (no sun glare) */}
      <ambientLight intensity={0.2} />
      <spotLight position={[0, 15, 10]} intensity={15} angle={0.5} penumbra={1} color="white" />
      
      <pointLight position={[-10, 0, -5]} intensity={2} color="#22d3ee" distance={20} />
      <pointLight position={[10, 0, -5]} intensity={2} color="#eab308" distance={20} />

      {/* 1. OBSIDIAN BASE */}
      <mesh geometry={geometry} receiveShadow>
        <MeshTransmissionMaterial
          roughness={CONFIG.roughness}
          transmission={CONFIG.transmission}
          thickness={CONFIG.thickness}
          ior={CONFIG.ior}
          chromaticAberration={CONFIG.chromaticAberration}
          color={CONFIG.baseColor}
          backside
          anisotropicBlur={0.2} // Blurs reflection slightly for "Matte" look
        />
      </mesh>

      {/* 2. WIREFRAME OVERLAY (Precision) */}
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

      {/* 3. CYAN DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathA, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee" emissive="#22d3ee" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={0.9}
        />
      </mesh>

      {/* 4. GOLD DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathB, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#eab308" emissive="#eab308" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={0.9}
        />
      </mesh>

      {/* LABELS */}
      <group position={[6.2, 0, 0]}>
        <Text position={[0, 4.6, 0.2]} fontSize={0.25} color="#475569" anchorX="left">NOW (T+0)</Text>
        <Text position={[0, 0, 0.2]} fontSize={0.25} color="#475569" anchorX="left">T+18</Text>
        <Text position={[0, -4.6, 0.2]} fontSize={0.25} color="#475569" anchorX="left">HORIZON (T+36)</Text>
      </group>

      {/* DIVERGENCE LINE */}
      <line ref={dashedLineRef} geometry={dashedGeo}>
        <lineDashedMaterial color="white" transparent opacity={0.4} dashSize={0.2} gapSize={0.1} />
      </line>

      {/* DELTA BADGE */}
      <Html position={[mid.x, mid.y, mid.z + 0.5]} center zIndexRange={[100, 0]}>
        <div className="px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-[2px] text-[10px] text-white shadow-xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-400">Δ</span> <span className="text-emerald-400 font-semibold">+$2.1M ARR</span>
        </div>
      </Html>

      {/* FLOOR GRID */}
      <Grid
        position={[0, 0, -0.1]} args={[20, 20]}
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
