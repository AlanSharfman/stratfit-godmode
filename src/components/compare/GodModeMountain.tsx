import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, Text } from "@react-three/drei";
import { generateTerrainHeight } from "@/terrain/terrainGenerator";

// --- CONFIGURATION: MATTE OBSIDIAN ---
const CONFIG = {
  wireOpacity: 0.03,
  veinWidth: 0.014,
  veinGlow: 10.0,
  gridColor: "#1e293b",
};

type Scenario = { score?: number };

// Timeline value for terrain animation (static for now)
const timeline = 0;

// --- TERRAIN HEIGHT WRAPPER ---
function surfaceZ(x: number, y: number, scenarioModifier: number = 0) {
  const height = generateTerrainHeight({
    x: x * 10, // Scale to match terrain generator expectations
    z: y * 10,
    time: timeline,
    modifier: scenarioModifier
  });
  
  // Normalize and apply island mask
  const dist = Math.sqrt(x * x + y * y);
  const islandMask = Math.pow(Math.max(0, 1.0 - dist / 5.5), 1.5);
  
  return Math.max(0, height * 0.3 * islandMask);
}

function generateTrajectory(score: number, side: -1 | 1, scenarioModifier: number = 0) {
  const points: THREE.Vector3[] = [];
  const divergence = (100 - score) * 0.10 * side;

  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const y = 4.6 - t * 9.2;
    const x = t * 3.9 * side + Math.sin(t * Math.PI * 2) * divergence * 0.45;
    const z = surfaceZ(x, y, scenarioModifier);
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
  
  // Scenario modifier based on score difference
  const scenarioModifier = (scoreB - scoreA) * 0.1;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 12, 200, 200); 
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, surfaceZ(pos.getX(i), pos.getY(i), scenarioModifier));
    }
    geo.computeVertexNormals();
    return geo;
  }, [scenarioModifier]);

  const pathA = useMemo(() => generateTrajectory(scoreA, -1, 0), [scoreA]);
  const pathB = useMemo(() => generateTrajectory(scoreB, 1, scenarioModifier), [scoreB, scenarioModifier]);

  const tSlice = 0.5; 
  const pA = useMemo(() => pathA.getPoint(tSlice), [pathA]);
  const pB = useMemo(() => pathB.getPoint(tSlice), [pathB]);
  const mid = useMemo(() => pA.clone().add(pB).multiplyScalar(0.5), [pA, pB]);

  const dashedGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      pA.clone().setZ(pA.z + 0.2), 
      pB.clone().setZ(pB.z + 0.2)
    ]);
    return geo;
  }, [pA, pB]);

  const dashedLineRef = useRef<THREE.Line>(null);
  useEffect(() => {
    if (dashedLineRef.current) dashedLineRef.current.computeLineDistances();
  }, [dashedGeo]);

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      {/* LIGHTING FIX: Drastically lowered intensity */}
      <ambientLight intensity={0.1} />
      <spotLight position={[0, 15, 10]} intensity={5} angle={0.5} penumbra={1} color="white" />
      
      <pointLight position={[-10, 0, -5]} intensity={1} color="#22d3ee" distance={20} />
      <pointLight position={[10, 0, -5]} intensity={1} color="#eab308" distance={20} />

      {/* OBSIDIAN BASE */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#0d111a"
          roughness={0.88}
          metalness={0.02}
          envMapIntensity={0.15}
        />
      </mesh>

      {/* WIREFRAME OVERLAY */}
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

      {/* CYAN DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathA, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee" emissive="#22d3ee" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={1}
        />
      </mesh>

      {/* GOLD DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathB, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#eab308" emissive="#eab308" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={1}
        />
      </mesh>

      <group position={[6.2, 0, 0]}>
        <Text position={[0, 4.6, 0.2]} fontSize={0.25} color="#475569" anchorX="left">NOW (T+0)</Text>
        <Text position={[0, 0, 0.2]} fontSize={0.25} color="#475569" anchorX="left">T+18</Text>
        <Text position={[0, -4.6, 0.2]} fontSize={0.25} color="#475569" anchorX="left">HORIZON (T+36)</Text>
      </group>

      <line ref={dashedLineRef} geometry={dashedGeo}>
        <lineDashedMaterial color="white" transparent opacity={0.4} dashSize={0.2} gapSize={0.1} />
      </line>

      <Html position={[mid.x, mid.y, mid.z + 0.5]} center zIndexRange={[100, 0]}>
        <div className="px-2 py-1 bg-slate-900/90 border border-slate-700 rounded-[2px] text-[10px] text-white shadow-xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-400">Δ</span> <span className="text-emerald-400 font-semibold">+$2.1M ARR</span>
        </div>
      </Html>

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
