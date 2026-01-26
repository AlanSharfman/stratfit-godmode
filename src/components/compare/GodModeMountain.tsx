import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Grid, Html, Text } from "@react-three/drei";
import { generateTerrainHeight } from "@/terrain/terrainGenerator";

type Scenario = { score?: number };

export const GodModeMountain: React.FC<{ scenarioA: Scenario; scenarioB: Scenario }> = ({
  scenarioA,
  scenarioB,
}) => {
  const scoreA = scenarioA.score ?? 72;
  const scoreB = scenarioB.score ?? 65;
  
  // Timeline and modifier
  const timeline = 0;
  const scenarioModifier = (scoreB - scoreA) * 0.1;

  // Geometry ref for updates
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);

  // Create geometry with rotation
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 256, 256);
    geo.rotateX(-Math.PI / 2);
    geometryRef.current = geo;
    return geo;
  }, []);

  // Update terrain heights on timeline/modifier change
  useEffect(() => {
    if (!geometryRef.current) return;
    
    const positions = geometryRef.current.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const height = generateTerrainHeight({
        x,
        z,
        time: timeline,
        modifier: scenarioModifier
      });

      positions.setY(i, height);
    }

    positions.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [timeline, scenarioModifier]);

  // Generate trajectory paths
  const getTrajectoryHeight = (x: number, z: number) => {
    return generateTerrainHeight({ x, z, time: timeline, modifier: scenarioModifier });
  };

  const pathA = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const divergence = (100 - scoreA) * 0.10 * -1;
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const z = 50 - t * 100;
      const x = t * 40 * -1 + Math.sin(t * Math.PI * 2) * divergence * 4;
      const y = getTrajectoryHeight(x, z) + 1;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [scoreA, timeline, scenarioModifier]);

  const pathB = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const divergence = (100 - scoreB) * 0.10 * 1;
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const z = 50 - t * 100;
      const x = t * 40 * 1 + Math.sin(t * Math.PI * 2) * divergence * 4;
      const y = getTrajectoryHeight(x, z) + 1;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [scoreB, timeline, scenarioModifier]);

  const tSlice = 0.5;
  const pA = useMemo(() => pathA.getPoint(tSlice), [pathA]);
  const pB = useMemo(() => pathB.getPoint(tSlice), [pathB]);
  const mid = useMemo(() => pA.clone().add(pB).multiplyScalar(0.5), [pA, pB]);

  const dashedGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      pA.clone().setY(pA.y + 1),
      pB.clone().setY(pB.y + 1)
    ]);
  }, [pA, pB]);

  return (
    <group position={[0, -20, 0]}>
      {/* LIGHTING */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 80, 50]} intensity={1} color="white" />
      <pointLight position={[-40, 20, -20]} intensity={0.5} color="#22d3ee" distance={100} />
      <pointLight position={[40, 20, -20]} intensity={0.5} color="#eab308" distance={100} />

      {/* TERRAIN MESH */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#0d111a"
          roughness={0.88}
          metalness={0.02}
          envMapIntensity={0.15}
        />
      </mesh>

      {/* CYAN DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathA, 140, 0.3, 8, false]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* GOLD DATA VEIN */}
      <mesh>
        <tubeGeometry args={[pathB, 140, 0.3, 8, false]} />
        <meshStandardMaterial
          color="#eab308"
          emissive="#eab308"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* LABELS */}
      <group position={[65, 5, 0]}>
        <Text position={[0, 0, 50]} fontSize={3} color="#64748b" anchorX="left">NOW (T+0)</Text>
        <Text position={[0, 0, 0]} fontSize={3} color="#64748b" anchorX="left">T+18</Text>
        <Text position={[0, 0, -50]} fontSize={3} color="#64748b" anchorX="left">HORIZON (T+36)</Text>
      </group>

      {/* DASHED LINE */}
      <line geometry={dashedGeo}>
        <lineDashedMaterial color="white" transparent opacity={0.4} dashSize={2} gapSize={1} />
      </line>

      {/* DELTA BADGE */}
      <Html position={[mid.x, mid.y + 5, mid.z]} center zIndexRange={[100, 0]}>
        <div className="px-3 py-2 bg-slate-900/90 border border-slate-700 rounded text-sm text-white shadow-xl backdrop-blur-md font-mono whitespace-nowrap">
          <span className="text-slate-400">Δ</span> <span className="text-emerald-400 font-semibold">+$2.1M ARR</span>
        </div>
      </Html>

      {/* FLOOR GRID */}
      <Grid
        position={[0, -1, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={1}
        cellColor="#1e293b"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={150}
        fadeStrength={1.5}
      />
    </group>
  );
};
