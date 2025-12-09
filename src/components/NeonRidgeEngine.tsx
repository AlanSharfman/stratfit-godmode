// ============================================================================
// NEON RIDGE ENGINE — Three.js Catmull-Rom Spline System
// NO MESHES. NO NOISE. NO PHYSICS. PURE FINANCIAL DATA.
// ============================================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ============================================================================
// TYPES
// ============================================================================
export interface RidgeEngineProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
}

// ============================================================================
// COLOR PALETTE (NON-NEGOTIABLE)
// ============================================================================
const COLORS = {
  background: '#0a1628',
  valley: '#0d4f4f',
  midRidge: '#14b8a6',
  primaryGlow: '#22d3d3',
  peakHighlight: '#5eead4',
};

// ============================================================================
// SINGLE NEON RIDGE LINE COMPONENT
// ============================================================================
interface RidgeLineProps {
  points: THREE.Vector3[];
  color: string;
  lineWidth: number;
  opacity: number;
  glowIntensity: number;
  yOffset: number;
  zOffset: number;
  breathePhase: number;
  activeIndex: number | null;
  totalPoints: number;
}

function NeonRidgeLine({
  points,
  color,
  lineWidth,
  opacity,
  glowIntensity,
  yOffset,
  zOffset,
  breathePhase,
  activeIndex,
  totalPoints,
}: RidgeLineProps) {

  // Create smooth Catmull-Rom spline from data points
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    
    // Apply offsets and breathing
    const adjustedPoints = points.map((p, i) => {
      const breathOffset = Math.sin(breathePhase + i * 0.3) * 0.15;
      return new THREE.Vector3(
        p.x,
        p.y + yOffset + breathOffset,
        p.z + zOffset
      );
    });

    return new THREE.CatmullRomCurve3(adjustedPoints, false, 'catmullrom', 0.5);
  }, [points, yOffset, zOffset, breathePhase]);

  // Generate smooth curve geometry
  const geometry = useMemo(() => {
    if (!curve) return new THREE.BufferGeometry();
    
    const curvePoints = curve.getPoints(100); // 100 segments for smoothness
    const positions = new Float32Array(curvePoints.length * 3);
    const colors = new Float32Array(curvePoints.length * 3);
    
    const baseColor = new THREE.Color(color);
    const highlightColor = new THREE.Color(COLORS.peakHighlight);
    
    curvePoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      // Calculate which data point this curve segment corresponds to
      const dataIndex = Math.floor((i / curvePoints.length) * totalPoints);
      const isHighlighted = activeIndex !== null && dataIndex === activeIndex;
      
      // Interpolate colors
      const finalColor = isHighlighted 
        ? highlightColor 
        : baseColor;
      
      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [curve, color, activeIndex, totalPoints]);

  // Create and update line materials
  const mainMaterial = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: opacity,
    linewidth: lineWidth,
  }), [opacity, lineWidth]);

  const glowMaterial = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: opacity * glowIntensity * 0.3,
    linewidth: lineWidth * 2,
  }), [opacity, glowIntensity, lineWidth]);

  // Update materials when props change
  useEffect(() => {
    mainMaterial.opacity = opacity;
    glowMaterial.opacity = opacity * glowIntensity * 0.3;
  }, [mainMaterial, glowMaterial, opacity, glowIntensity]);

  return (
    <group>
      {/* Main Ridge Line */}
      <primitive object={new THREE.Line(geometry, mainMaterial)} />
      
      {/* Glow Line (slightly larger, more transparent) */}
      <primitive object={new THREE.Line(geometry, glowMaterial)} />
    </group>
  );
}

// ============================================================================
// MULTI-LAYER RIDGE SYSTEM
// ============================================================================
interface MultiLayerRidgeProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
}

function MultiLayerRidge({ dataPoints, activeKPIIndex, scenario }: MultiLayerRidgeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const breatheRef = useRef(0);
  const targetPointsRef = useRef<number[]>(dataPoints);
  const currentPointsRef = useRef<number[]>(dataPoints);

  // Smooth interpolation when data changes
  useEffect(() => {
    targetPointsRef.current = dataPoints;
  }, [dataPoints]);

  // Animation loop
  useFrame((state, delta) => {
    // Update breathing phase
    breatheRef.current += delta * 0.5;

    // Smooth interpolation towards target values (GSAP-like easing)
    const lerpFactor = 1 - Math.pow(0.001, delta);
    currentPointsRef.current = currentPointsRef.current.map((current, i) => {
      const target = targetPointsRef.current[i] ?? current;
      return current + (target - current) * lerpFactor;
    });

    // Subtle rotation for parallax feel
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  // Convert data points to 3D coordinates
  const points3D = useMemo(() => {
    const width = 20;
    const heightScale = 8;
    
    return currentPointsRef.current.map((value, i) => {
      const x = (i / (currentPointsRef.current.length - 1)) * width - width / 2;
      const y = (value / 100) * heightScale;
      const z = 0;
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  // Scenario-based intensity multipliers
  const scenarioMultipliers = {
    base: 1.0,
    upside: 1.2,
    downside: 0.8,
    extreme: 1.5,
  };
  const mult = scenarioMultipliers[scenario];

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* LAYER 1: Background Ghost Ridge */}
      <NeonRidgeLine
        points={points3D}
        color={COLORS.valley}
        lineWidth={1}
        opacity={0.3}
        glowIntensity={0.2}
        yOffset={-1}
        zOffset={-2}
        breathePhase={breatheRef.current}
        activeIndex={activeKPIIndex}
        totalPoints={dataPoints.length}
      />

      {/* LAYER 2: Mid Ridge */}
      <NeonRidgeLine
        points={points3D}
        color={COLORS.midRidge}
        lineWidth={2}
        opacity={0.6 * mult}
        glowIntensity={0.5}
        yOffset={0}
        zOffset={-1}
        breathePhase={breatheRef.current * 1.1}
        activeIndex={activeKPIIndex}
        totalPoints={dataPoints.length}
      />

      {/* LAYER 3: Primary Glow Ridge (HERO) */}
      <NeonRidgeLine
        points={points3D}
        color={COLORS.primaryGlow}
        lineWidth={3}
        opacity={0.9 * mult}
        glowIntensity={1.0}
        yOffset={0.5}
        zOffset={0}
        breathePhase={breatheRef.current * 1.2}
        activeIndex={activeKPIIndex}
        totalPoints={dataPoints.length}
      />

      {/* LAYER 4: Peak Highlight Ridge */}
      <NeonRidgeLine
        points={points3D}
        color={COLORS.peakHighlight}
        lineWidth={2}
        opacity={0.7 * mult}
        glowIntensity={1.5}
        yOffset={1}
        zOffset={1}
        breathePhase={breatheRef.current * 1.3}
        activeIndex={activeKPIIndex}
        totalPoints={dataPoints.length}
      />

      {/* Vertical Grid Lines at Data Points */}
      {points3D.map((point, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                point.x, -3, point.z,
                point.x, point.y + 1, point.z,
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={activeKPIIndex === i ? COLORS.peakHighlight : COLORS.valley}
            transparent
            opacity={activeKPIIndex === i ? 0.6 : 0.15}
          />
        </line>
      ))}
    </group>
  );
}

// ============================================================================
// ATMOSPHERIC FOG PLANE
// ============================================================================
function AtmosphericFog() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material;
      if (material instanceof THREE.Material && !Array.isArray(material)) {
        material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -4, -5]} rotation={[-Math.PI / 6, 0, 0]}>
      <planeGeometry args={[40, 20]} />
      <meshBasicMaterial
        color={COLORS.valley}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// SCENE SETUP (NO DEBUG HELPERS)
// ============================================================================
function SceneSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 5]} intensity={0.5} color={COLORS.primaryGlow} />
      <pointLight position={[-10, 5, 0]} intensity={0.3} color={COLORS.midRidge} />
      <pointLight position={[10, 5, 0]} intensity={0.3} color={COLORS.peakHighlight} />
      <fog attach="fog" args={[COLORS.background, 8, 25]} />
    </>
  );
}

// ============================================================================
// MAIN ENGINE EXPORT
// ============================================================================
export default function NeonRidgeEngine({
  dataPoints,
  activeKPIIndex,
  scenario,
}: RidgeEngineProps) {
  return (
    <div className="w-full h-full" style={{ background: COLORS.background }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ pointerEvents: 'none' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[COLORS.background]} />
        
        <SceneSetup />
        
        <MultiLayerRidge
          dataPoints={dataPoints}
          activeKPIIndex={activeKPIIndex}
          scenario={scenario}
        />
        
        <AtmosphericFog />

        {/* Post-processing for bloom/glow */}
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}