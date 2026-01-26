import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, MeshTransmissionMaterial, Text } from "@react-three/drei";
import { createNoise2D } from "simplex-noise";

// --- CONFIGURATION: OBSIDIAN INSTRUMENT ---
const CONFIG = {
  height: 5.8,
  baseColor: "#050b14",      // Pitch Black
  roughness: 0.5,            // Smooth polish
  transmission: 0.25,        // Dense glass
  thickness: 2.5,
  ior: 1.2,
  chromaticAberration: 0.02, 
  wireOpacity: 0.03,
  veinWidth: 0.014,
  veinGlow: 8.0,
  gridColor: "#1e293b",
};

const noise2D = createNoise2D();

type Scenario = { score?: number };

// --- MANUAL SCULPT MATH (Matches your Photo) ---
function surfaceZ(x: number, y: number) {
  // 1. THE HERO PEAK (Central Summit)
  const dx1 = x;
  const dy1 = y - 1.0;
  const dist1 = Math.sqrt(dx1*dx1 + dy1*dy1);
  const mainPeak = Math.pow(Math.max(0, 1.0 - dist1 / 5.5), 2.5) * CONFIG.height;

  // 2. THE SIDE SHOULDER (Right Side)
  const dx2 = x - 2.5; 
  const dy2 = y - 0.5;
  const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
  const sidePeak = Math.pow(Math.max(0, 1.0 - dist2 / 3.0), 2.0) * (CONFIG.height * 0.5);

  // 3. RIDGE TEXTURE (Large faces)
  const ridge = Math.abs(noise2D(x * 0.4, y * 0.4)); 
  
  return Math.max(mainPeak, sidePeak) - (ridge * 0.5 * Math.max(0, 1.0 - dist1/6.0));
}

function generateTrajectory(score: number, side: -1 | 1) {
  const points: THREE.Vector3[] = [];
  const divergence = (100 - score) * 0.10 * side;

  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const y = 4.6 - t * 9.2;
    const x = t * 3.9 * side + Math.sin(t * Math.PI * 2) * divergence * 0.45;
    const z = surfaceZ(x, y);
    points.push(new THREE.Vector3(x, y, z + 0.1));
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
    const geo = new THREE.PlaneGeometry(12, 12, 200, 200);
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
      <ambientLight intensity={0.2} />
      <spotLight position={[0, 15, 10]} intensity={10} angle={0.5} penumbra={1} color="white" />
      
      <pointLight position={[-10, 0, -5]} intensity={2} color="#22d3ee" distance={20} />
      <pointLight position={[10, 0, -5]} intensity={2} color="#eab308" distance={20} />

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

      <mesh>
        <tubeGeometry args={[pathA, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee" emissive="#22d3ee" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={0.9}
        />
      </mesh>

      <mesh>
        <tubeGeometry args={[pathB, 140, CONFIG.veinWidth, 8, false]} />
        <meshStandardMaterial
          color="#eab308" emissive="#eab308" emissiveIntensity={CONFIG.veinGlow}
          toneMapped={false} transparent opacity={0.9}
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
