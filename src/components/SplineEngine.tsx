// ============================================================================
// STRATFIT SPLINE ENGINE — G-D MODE v8.0
// CatmullRomCurve3 + TubeGeometry + Bloom + GSAP Morphing
// NO TERRAIN. NO NOISE. NO WIREFRAMES. NO ORBIT CONTROLS.
// ============================================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';

// ============================================================================
// TYPES
// ============================================================================
export interface SplineEngineProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
  activeKPIIndex: number | null;
  onTimelineUpdate: (positions: { x: number; y: number; label: string }[]) => void;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================
const COLORS = {
  background: 0x0a1628,
  valley: 0x0d4f4f,
  mid: 0x14b8a6,
  primary: 0x22d3d3,
  peak: 0x5eead4,
};

const SCENARIO_COLORS = {
  base: { main: '#22d3d3', glow: '#5eead4', hex: 0x22d3d3 },
  upside: { main: '#42ffb2', glow: '#6fffcc', hex: 0x42ffb2 },
  downside: { main: '#ff9d3c', glow: '#ffb86c', hex: 0xff9d3c },
  extreme: { main: '#d946ef', glow: '#e879f9', hex: 0xd946ef },
};

const TIMELINE_LABELS = {
  monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
  yearly: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
};

// ============================================================================
// NEON SPLINE RIDGE
// ============================================================================
interface SplineRidgeProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  activeKPIIndex: number | null;
  layerIndex: number;
  onPositionsReady: (positions: THREE.Vector3[]) => void;
}

function SplineRidge({
  dataPoints,
  scenario,
  activeKPIIndex,
  layerIndex,
  onPositionsReady,
}: SplineRidgeProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const currentPointsRef = useRef<number[]>([...dataPoints]);
  const breathRef = useRef(0);

  // Layer configuration
  const layerConfig = [
    { yOffset: -0.6, zOffset: -2, opacity: 0.25, radius: 0.08 },
    { yOffset: -0.2, zOffset: -1, opacity: 0.5, radius: 0.12 },
    { yOffset: 0, zOffset: 0, opacity: 0.95, radius: 0.18 },
  ][layerIndex];

  // Smooth morph with GSAP
  useEffect(() => {
    const targetPoints = [...dataPoints];
    const current = { ...currentPointsRef.current };

    gsap.to(current, {
      duration: 0.6,
      ease: 'power2.out',
      ...targetPoints.reduce((acc, val, i) => ({ ...acc, [i]: val }), {}),
      onUpdate: () => {
        currentPointsRef.current = Object.values(current).map(Number);
      },
    });
  }, [dataPoints]);

  // Animation loop
  useFrame((state) => {
    if (!tubeRef.current) return;

    // Breathing animation
    breathRef.current += 0.015;
    const breathScale = 1 + Math.sin(breathRef.current) * 0.015;

    // Update geometry
    const points = createSplinePoints(
      currentPointsRef.current,
      layerConfig.yOffset,
      layerConfig.zOffset,
      breathRef.current
    );

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const newGeometry = new THREE.TubeGeometry(curve, 120, layerConfig.radius, 8, false);

    tubeRef.current.geometry.dispose();
    tubeRef.current.geometry = newGeometry;

    // Report positions for timeline (only from front layer)
    if (layerIndex === 2) {
      onPositionsReady(points);
    }

    // Glow pulse for active KPI
    const material = tubeRef.current.material as THREE.MeshStandardMaterial;
    if (activeKPIIndex !== null && layerIndex === 2) {
      material.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    } else {
      material.emissiveIntensity = layerIndex === 2 ? 1.2 : 0.6;
    }
  });

  // Initial geometry
  const initialGeometry = useMemo(() => {
    const points = createSplinePoints(dataPoints, layerConfig.yOffset, layerConfig.zOffset, 0);
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    return new THREE.TubeGeometry(curve, 120, layerConfig.radius, 8, false);
  }, []);

  const colors = SCENARIO_COLORS[scenario];

  return (
    <mesh ref={tubeRef} geometry={initialGeometry}>
      <meshStandardMaterial
        color={colors.hex}
        emissive={colors.hex}
        emissiveIntensity={layerIndex === 2 ? 1.2 : 0.6}
        transparent
        opacity={layerConfig.opacity}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// ============================================================================
// CREATE SPLINE POINTS
// ============================================================================
function createSplinePoints(
  dataPoints: number[],
  yOffset: number,
  zOffset: number,
  breathPhase: number
): THREE.Vector3[] {
  const width = 16;
  const heightScale = 5;
  const count = dataPoints.length;

  return dataPoints.map((value, i) => {
    const x = (i / (count - 1)) * width - width / 2;
    const breathY = Math.sin(breathPhase + i * 0.4) * 0.08;
    const y = (value / 100) * heightScale + yOffset + breathY;
    const z = zOffset;
    return new THREE.Vector3(x, y, z);
  });
}

// ============================================================================
// ATMOSPHERIC FOG
// ============================================================================
function AtmosphericFog({ scenario }: { scenario: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -2.5, -4]} rotation={[-0.3, 0, 0]}>
      <planeGeometry args={[30, 12]} />
      <meshBasicMaterial
        color={SCENARIO_COLORS[scenario as keyof typeof SCENARIO_COLORS].hex}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// SCENE CONTENT
// ============================================================================
interface SceneContentProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
  activeKPIIndex: number | null;
  onTimelineUpdate: (positions: { x: number; y: number; label: string }[]) => void;
}

function SceneContent({
  dataPoints,
  scenario,
  timePeriod,
  activeKPIIndex,
  onTimelineUpdate,
}: SceneContentProps) {
  const { camera, size } = useThree();
  const splinePointsRef = useRef<THREE.Vector3[]>([]);

  // Project 3D positions to 2D screen coordinates
  const updateTimeline = (points: THREE.Vector3[]) => {
    splinePointsRef.current = points;

    const labels = TIMELINE_LABELS[timePeriod];
    const positions = points.map((point, i) => {
      const projected = point.clone().project(camera);
      return {
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
        label: labels[i] || '',
      };
    });

    onTimelineUpdate(positions);
  };

  // Fixed camera position (NO USER CONTROL)
  useEffect(() => {
    camera.position.set(0, 2.5, 11);
    camera.lookAt(0, 0.5, 0);
  }, [camera]);

  // Subtle camera float
  useFrame((state) => {
    camera.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.2} />
      <pointLight
        position={[0, 8, 5]}
        intensity={1.5}
        color={SCENARIO_COLORS[scenario].hex}
        distance={25}
        decay={2}
      />
      <pointLight position={[-6, 4, 2]} intensity={0.8} color={0x14b8a6} distance={20} />
      <pointLight position={[6, 4, 2]} intensity={0.8} color={0x5eead4} distance={20} />

      {/* Three-layer ridge system */}
      {[0, 1, 2].map((layerIndex) => (
        <SplineRidge
          key={layerIndex}
          dataPoints={dataPoints}
          scenario={scenario}
          activeKPIIndex={activeKPIIndex}
          layerIndex={layerIndex}
          onPositionsReady={layerIndex === 2 ? updateTimeline : () => {}}
        />
      ))}

      {/* Atmospheric fog */}
      <AtmosphericFog scenario={scenario} />

      {/* Scene fog */}
      <fog attach="fog" args={[0x0a1628, 8, 22]} />
    </>
  );
}

// ============================================================================
// MAIN ENGINE EXPORT
// ============================================================================
export default function SplineEngine({
  dataPoints,
  scenario,
  timePeriod,
  activeKPIIndex,
  onTimelineUpdate,
}: SplineEngineProps) {
  return (
    <div className="w-full h-full relative" style={{ background: '#0a1628' }}>
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#0a1628']} />

        <SceneContent
          dataPoints={dataPoints}
          scenario={scenario}
          timePeriod={timePeriod}
          activeKPIIndex={activeKPIIndex}
          onTimelineUpdate={onTimelineUpdate}
        />

        {/* Bloom post-processing */}
        <EffectComposer>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

