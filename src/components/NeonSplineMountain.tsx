// ============================================================================
// NEON SPLINE MOUNTAIN — CatmullRomCurve3 + TubeGeometry + Bloom
// NO PlaneGeometry. NO terrain. NO noise. GSAP morphing only.
// ============================================================================

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { SCENARIO_THEMES, type Scenario } from '../hooks/useScenarioColors';

// ============================================================================
// TYPES
// ============================================================================
interface NeonSplineMountainProps {
  dataPoints: number[];
  scenario: Scenario;
  activeKPIIndex: number | null;
  onPointsUpdate: (points: THREE.Vector3[]) => void;
}

// ============================================================================
// NEON RIBBON MESH
// ============================================================================
function NeonRibbon({
  dataPoints,
  scenario,
  activeKPIIndex,
  onPointsUpdate,
}: {
  dataPoints: number[];
  scenario: Scenario;
  activeKPIIndex: number | null;
  onPointsUpdate: (points: THREE.Vector3[]) => void;
}) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  const currentRef = useRef<number[]>([...dataPoints]);
  const targetRef = useRef<number[]>([...dataPoints]);
  const breathRef = useRef(0);

  const theme = SCENARIO_THEMES[scenario];

  // GSAP morph on data change — NO JITTER
  useEffect(() => {
    targetRef.current = [...dataPoints];
    currentRef.current.forEach((_, i) => {
      gsap.to(currentRef.current, {
        [i]: targetRef.current[i],
        duration: 0.6,
        ease: 'power2.out',
      });
    });
  }, [dataPoints]);

  // Animation loop
  useFrame((state) => {
    // Smooth interpolation
    currentRef.current = currentRef.current.map((v, i) => v + (targetRef.current[i] - v) * 0.06);

    // Breathing animation
    breathRef.current += 0.01;
    const breath = Math.sin(breathRef.current) * 0.03;

    // Generate spline points
    const width = 14;
    const height = 4.5;
    const count = currentRef.current.length;

    const pts: THREE.Vector3[] = currentRef.current.map((v, i) => {
      const x = (i / (count - 1)) * width - width / 2;
      const y = (v / 100) * height + breath + Math.sin(breathRef.current + i * 0.4) * 0.04;
      return new THREE.Vector3(x, y, 0);
    });

    // Report points for timeline synchronization
    onPointsUpdate(pts);

    // Create CatmullRomCurve3 spline
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

    // Update MAIN TUBE
    if (tubeRef.current) {
      const geo = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
      tubeRef.current.geometry.dispose();
      tubeRef.current.geometry = geo;
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(theme.primary);
      mat.emissive.set(theme.primary);
      mat.emissiveIntensity = activeKPIIndex !== null ? 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.3 : 0.9;
    }

    // Update GLOW TUBE
    if (glowRef.current) {
      const geo = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
      glowRef.current.geometry.dispose();
      glowRef.current.geometry = geo;
      (glowRef.current.material as THREE.MeshBasicMaterial).color.set(theme.glow);
    }

    // Update GRADIENT FILL
    if (fillRef.current) {
      const cpts = curve.getPoints(80);
      const verts: number[] = [];
      const cols: number[] = [];
      const top = new THREE.Color(theme.glow);
      const bot = new THREE.Color('#0a1628');

      cpts.forEach((p) => {
        verts.push(p.x, p.y, -0.3, p.x, -1, -0.3);
        cols.push(top.r * 0.5, top.g * 0.5, top.b * 0.5, bot.r, bot.g, bot.b);
      });

      const idx: number[] = [];
      for (let i = 0; i < cpts.length - 1; i++) {
        const tl = i * 2;
        const bl = i * 2 + 1;
        const tr = (i + 1) * 2;
        const br = (i + 1) * 2 + 1;
        idx.push(tl, bl, tr, bl, br, tr);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      geo.setIndex(idx);
      fillRef.current.geometry.dispose();
      fillRef.current.geometry = geo;
    }
  });

  // Initial geometries
  const initGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const initTube = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, 2, 0),
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(7, 2, 0),
    ]);
    return new THREE.TubeGeometry(c, 64, 0.12, 8, false);
  }, []);

  return (
    <group>
      {/* Gradient Fill */}
      <mesh ref={fillRef} geometry={initGeo}>
        <meshBasicMaterial vertexColors transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Glow Tube */}
      <mesh ref={glowRef} geometry={initTube}>
        <meshBasicMaterial color={theme.glow} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Main Neon Ribbon */}
      <mesh ref={tubeRef} geometry={initTube}>
        <meshStandardMaterial
          color={theme.primary}
          emissive={theme.primary}
          emissiveIntensity={0.9}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// SCENE
// ============================================================================
function Scene({
  dataPoints,
  scenario,
  activeKPIIndex,
  onPointsUpdate,
}: {
  dataPoints: number[];
  scenario: Scenario;
  activeKPIIndex: number | null;
  onPointsUpdate: (points: THREE.Vector3[]) => void;
}) {
  const { camera } = useThree();
  const theme = SCENARIO_THEMES[scenario];

  // Fixed camera — NO USER CONTROL
  useEffect(() => {
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 1, 0);
  }, [camera]);

  // Subtle camera drift
  useFrame((state) => {
    camera.position.y = 2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.06;
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 6, 5]} intensity={1.4} color={theme.hex} distance={20} decay={2} />
      <pointLight position={[-5, 3, 3]} intensity={0.6} color={0x14b8a6} distance={15} />
      <pointLight position={[5, 3, 3]} intensity={0.6} color={0x5eead4} distance={15} />

      {/* Neon Ribbon */}
      <NeonRibbon
        dataPoints={dataPoints}
        scenario={scenario}
        activeKPIIndex={activeKPIIndex}
        onPointsUpdate={onPointsUpdate}
      />

      {/* Fog for depth */}
      <fogExp2 attach="fog" args={['#0a1628', 0.04]} />
    </>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function NeonSplineMountain({
  dataPoints,
  scenario,
  activeKPIIndex,
  onPointsUpdate,
}: NeonSplineMountainProps) {
  return (
    <div className="w-full h-full" style={{ background: '#0a1628' }}>
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#0a1628']} />

        <Scene
          dataPoints={dataPoints}
          scenario={scenario}
          activeKPIIndex={activeKPIIndex}
          onPointsUpdate={onPointsUpdate}
        />

        {/* Bloom Postprocessing — CRITICAL FOR NEON GLOW */}
        <EffectComposer>
          <Bloom intensity={1.4} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}