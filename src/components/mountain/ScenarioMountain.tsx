// src/components/mountain/ScenarioMountain.tsx
// STRATFIT — Photorealistic Alpine Mountain Visualization
// Cinematic natural landscape with snow-capped peaks, mist, forests, and water

import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Sky,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useShallow } from "zustand/react/shallow";
import { buildPeakModel, LeverId } from "@/logic/mountainPeakModel";
import { ScenarioId, SCENARIO_COLORS, useScenarioStore } from "@/state/scenarioStore";

// ============================================================================
// CONSTANTS
// ============================================================================

const TERRAIN_SIZE = 100;
const TERRAIN_SEGMENTS = 200;

// ============================================================================
// NOISE FUNCTIONS — Layered for realistic terrain
// ============================================================================

function hash(n: number): number {
  return ((Math.sin(n) * 43758.5453123) % 1 + 1) % 1;
}

function noise2D(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = x - i;
  const v = y - j;
  
  const a = hash(i + j * 57);
  const b = hash(i + 1 + j * 57);
  const c = hash(i + (j + 1) * 57);
  const d = hash(i + 1 + (j + 1) * 57);
  
  const smoothU = u * u * (3 - 2 * u);
  const smoothV = v * v * (3 - 2 * v);
  
  return a * (1 - smoothU) * (1 - smoothV) + 
         b * smoothU * (1 - smoothV) + 
         c * (1 - smoothU) * smoothV + 
         d * smoothU * smoothV;
}

function fbm(x: number, y: number, octaves: number = 6): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value;
}

function ridgeNoise(x: number, y: number): number {
  return 1 - Math.abs(noise2D(x, y) * 2 - 1);
}

// ============================================================================
// MOUNTAIN TERRAIN — Photorealistic geometry
// ============================================================================

interface TerrainProps {
  dataPoints: number[];
  scenario: ScenarioId;
}

function MountainTerrain({ dataPoints, scenario }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_SIZE, 
      TERRAIN_SIZE, 
      TERRAIN_SEGMENTS, 
      TERRAIN_SEGMENTS
    );
    
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    
    // Data influence (normalized 0-1)
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    const avgData = dp.reduce((a, b) => a + b, 0) / dp.length;
    const heightMultiplier = 0.85 + avgData * 0.3;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      
      // Normalized coordinates
      const nx = x / TERRAIN_SIZE;
      const nz = z / TERRAIN_SIZE;
      
      // Distance from center for island falloff
      const dist = Math.sqrt(nx * nx + nz * nz) * 2;
      const falloff = Math.max(0, 1 - Math.pow(dist, 1.8));
      
      // Main peak (central, tall)
      const mainPeakDist = Math.sqrt(nx * nx + (nz + 0.08) * (nz + 0.08));
      const mainPeak = Math.exp(-mainPeakDist * mainPeakDist * 6) * 38;
      
      // Secondary peak (right, shorter)
      const peak2X = nx - 0.22;
      const peak2Z = nz + 0.02;
      const peak2Dist = Math.sqrt(peak2X * peak2X + peak2Z * peak2Z);
      const peak2 = Math.exp(-peak2Dist * peak2Dist * 10) * 24;
      
      // Third peak (left shoulder)
      const peak3X = nx + 0.18;
      const peak3Z = nz - 0.08;
      const peak3Dist = Math.sqrt(peak3X * peak3X + peak3Z * peak3Z);
      const peak3 = Math.exp(-peak3Dist * peak3Dist * 14) * 16;
      
      // Ridge noise for rocky detail
      const ridge = ridgeNoise(nx * 4 + 0.5, nz * 5) * 6 * falloff;
      
      // Layered noise for natural terrain variation
      const largeNoise = fbm(nx * 2.5 + 10, nz * 2.5 + 10, 4) * 10;
      const mediumNoise = fbm(nx * 6 + 20, nz * 6 + 20, 3) * 4;
      const fineNoise = fbm(nx * 15 + 30, nz * 15 + 30, 2) * 1.2;
      
      // Combine all height factors
      let height = mainPeak + peak2 + peak3 + ridge;
      height += (largeNoise + mediumNoise + fineNoise) * falloff;
      
      // Apply data-driven multiplier
      height *= heightMultiplier;
      
      // Apply falloff
      height *= falloff;
      
      // Water level cutoff
      const waterLevel = -3;
      if (height < waterLevel) height = waterLevel;
      
      pos.setZ(i, height);
      
      // Calculate vertex colors based on height
      const normalizedHeight = Math.max(0, height) / 38;
      
      let r, g, b;
      
      if (normalizedHeight > 0.65) {
        // Snow caps - bright white/cream with pinkish highlight (sunlit snow)
        const snowAmount = Math.min(1, (normalizedHeight - 0.65) / 0.35);
        r = 0.92 + snowAmount * 0.08;
        g = 0.90 + snowAmount * 0.08;
        b = 0.95 + snowAmount * 0.05;
      } else if (normalizedHeight > 0.35) {
        // Rocky terrain - blue-grey like in the reference
        const rockBlend = (normalizedHeight - 0.35) / 0.3;
        r = 0.35 + rockBlend * 0.25;
        g = 0.40 + rockBlend * 0.22;
        b = 0.50 + rockBlend * 0.18;
      } else if (normalizedHeight > 0.08) {
        // Forest zone - deep green
        const forestBlend = (normalizedHeight - 0.08) / 0.27;
        r = 0.08 + forestBlend * 0.12;
        g = 0.25 + forestBlend * 0.18;
        b = 0.12 + forestBlend * 0.15;
      } else {
        // Low ground / shoreline - darker green
        r = 0.06;
        g = 0.18;
        b = 0.10;
      }
      
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [dataPoints]);
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -8, -5]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.82}
        metalness={0.02}
        flatShading={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// WATER PLANE — Reflective lake surface
// ============================================================================

function WaterSurface() {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      // Subtle shimmer effect
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      const time = state.clock.elapsedTime;
      material.envMapIntensity = 1.2 + Math.sin(time * 0.3) * 0.1;
    }
  });
  
  return (
    <mesh 
      ref={waterRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -11, 30]}
      receiveShadow
    >
      <planeGeometry args={[150, 50, 32, 32]} />
      <meshStandardMaterial
        color="#3a7ca5"
        roughness={0.05}
        metalness={0.85}
        transparent
        opacity={0.92}
        envMapIntensity={1.3}
      />
    </mesh>
  );
}

// ============================================================================
// FOREST — Instanced pine trees
// ============================================================================

function Forest() {
  const count = 600;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useMemo(() => {
    if (!meshRef.current) return;
    
    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Distribute trees in a band
      const angle = (Math.random() - 0.5) * Math.PI * 1.2;
      const radius = 28 + Math.random() * 18;
      const x = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      const z = 18 + Math.random() * 22;
      const y = -8.5 + Math.random() * 0.8;
      
      // Random scale and rotation
      const scale = 0.6 + Math.random() * 1.0;
      const rotY = Math.random() * Math.PI * 2;
      
      tempMatrix.identity();
      tempMatrix.makeRotationY(rotY);
      tempMatrix.scale(new THREE.Vector3(scale, scale * (1.2 + Math.random() * 0.4), scale));
      tempMatrix.setPosition(x, y, z);
      
      meshRef.current.setMatrixAt(i, tempMatrix);
      
      // Vary tree colors - different shades of deep green
      const greenBase = 0.12 + Math.random() * 0.15;
      tempColor.setRGB(0.03 + Math.random() * 0.04, greenBase, 0.06 + Math.random() * 0.04);
      meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);
  
  // Simple cone geometry for trees
  const treeGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.7, 2.8, 6);
    geo.translate(0, 1.4, 0);
    return geo;
  }, []);
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[treeGeo, undefined, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        roughness={0.85}
        metalness={0}
      />
    </instancedMesh>
  );
}

// ============================================================================
// MIST LAYERS — Fog planes at different heights
// ============================================================================

function MistLayers() {
  const mist1Ref = useRef<THREE.Mesh>(null);
  const mist2Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (mist1Ref.current) {
      mist1Ref.current.position.x = Math.sin(time * 0.05) * 3;
      const mat = mist1Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(time * 0.1) * 0.05;
    }
    
    if (mist2Ref.current) {
      mist2Ref.current.position.x = Math.cos(time * 0.03) * 2;
      const mat = mist2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(time * 0.08 + 1) * 0.04;
    }
  });
  
  return (
    <>
      {/* Lower mist band */}
      <mesh ref={mist1Ref} position={[0, -2, 8]} rotation={[-Math.PI / 12, 0, 0]}>
        <planeGeometry args={[120, 25]} />
        <meshBasicMaterial
          color="#d0e4f0"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Mid-height mist */}
      <mesh ref={mist2Ref} position={[0, 6, -5]} rotation={[-Math.PI / 8, 0, 0]}>
        <planeGeometry args={[100, 20]} />
        <meshBasicMaterial
          color="#c5dae8"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ============================================================================
// LIGHTING SETUP — Cinematic golden hour
// ============================================================================

function CinematicLighting() {
  return (
    <>
      {/* Main sun light - warm golden hour from left */}
      <directionalLight
        position={[-40, 50, -30]}
        intensity={2.8}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light - cool blue from right side (shadow areas) */}
      <directionalLight
        position={[30, 25, 20]}
        intensity={0.5}
        color="#a8c8e8"
      />
      
      {/* Back rim light for mountain silhouette */}
      <directionalLight
        position={[0, 35, -50]}
        intensity={0.4}
        color="#ffe8d8"
      />
      
      {/* Ambient for overall illumination */}
      <ambientLight intensity={0.45} color="#9ec5e8" />
      
      {/* Hemisphere light - sky blue from above, green from below (grass reflection) */}
      <hemisphereLight
        args={['#87ceeb', '#4a6741', 0.35]}
      />
    </>
  );
}

// ============================================================================
// SCENE WRAPPER
// ============================================================================

interface MountainSceneProps {
  dataPoints: number[];
  scenario: ScenarioId;
}

function MountainScene({ dataPoints, scenario }: MountainSceneProps) {
  const { scene } = useThree();
  
  // Set atmospheric fog
  useMemo(() => {
    scene.fog = new THREE.FogExp2('#c8dbe8', 0.006);
  }, [scene]);
  
  return (
    <>
      <CinematicLighting />
      
      {/* Sky dome */}
      <Sky
        distance={450000}
        sunPosition={[-40, 50, -30]}
        inclination={0.5}
        azimuth={0.2}
        rayleigh={0.6}
        turbidity={10}
        mieCoefficient={0.005}
        mieDirectionalG={0.85}
      />
      
      {/* Environment for reflections */}
      <Environment preset="dawn" background={false} />
      
      {/* Main terrain */}
      <MountainTerrain dataPoints={dataPoints} scenario={scenario} />
      
      {/* Water */}
      <WaterSurface />
      
      {/* Forest */}
      <Forest />
      
      {/* Mist layers */}
      <MistLayers />
      
      {/* Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.25}
        zoomSpeed={0.4}
        minDistance={35}
        maxDistance={90}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.3}
        target={[0, 8, 0]}
      />
    </>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

interface ScenarioMountainProps {
  scenario: ScenarioId;
  dataPoints: number[];
  activeKpiIndex?: number | null;
  activeLeverId?: LeverId | null;
  leverIntensity01?: number;
  className?: string;
}

export default function ScenarioMountain({
  scenario,
  dataPoints,
  activeKpiIndex = null,
  activeLeverId = null,
  leverIntensity01 = 0,
  className,
}: ScenarioMountainProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ""}`}
      style={{
        background: "linear-gradient(180deg, #7eb8db 0%, #a8cde4 30%, #c8dce8 60%, #d8e8f0 100%)",
      }}
    >
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={[0, 15, 55]} 
            fov={42}
            near={0.1}
            far={600}
          />
          
          <MountainScene dataPoints={dataPoints} scenario={scenario} />
          
          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.85}
              luminanceSmoothing={0.5}
              intensity={0.25}
              radius={0.7}
            />
            <Vignette
              eskil={false}
              offset={0.12}
              darkness={0.35}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Subtle atmospheric gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 50%, rgba(200, 220, 235, 0.2) 100%)",
        }}
      />
    </div>
  );
}
