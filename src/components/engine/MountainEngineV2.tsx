// ============================================================================
// MOUNTAIN ENGINE V2 — Premium Spline System with Neon Materials
// ============================================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { createSplinePoints, createSplineCurve, lerpArray } from './utils/splineMath';
import { createNeonLineMaterial, createGradientMaterial } from './shaders/neonMaterial';

// ============================================================================
// TYPES
// ============================================================================
interface MountainEngineV2Props {
  dataPoints?: number[];
  scenario?: 'base' | 'upside' | 'downside' | 'extreme';
  activeKPIIndex?: number | null;
  onPointsUpdate?: (points: THREE.Vector3[]) => void;
}

// ============================================================================
// COLOR THEMES
// ============================================================================
const SCENARIO_COLORS = {
  base: { primary: 0x22d3d3, glow: 0x5eead4 },
  upside: { primary: 0x34d399, glow: 0x6ee7b7 },
  downside: { primary: 0xfbbf24, glow: 0xfcd34d },
  extreme: { primary: 0xf472b6, glow: 0xf9a8d4 },
};

// ============================================================================
// NEON RIBBON COMPONENT
// ============================================================================
function NeonRibbon({
  dataPoints,
  scenario = 'base',
  activeKPIIndex = null,
  onPointsUpdate,
}: MountainEngineV2Props) {
  const groupRef = useRef<THREE.Group>(null);
  const fillMeshRef = useRef<THREE.Mesh>(null);
  const lineMeshRef = useRef<THREE.Line | null>(null);
  const glowMeshRef = useRef<THREE.Line | null>(null);
  
  const currentPointsRef = useRef<number[]>([...dataPoints || [50, 60, 70, 65, 75, 80, 85, 90, 85, 80, 75, 70]]);
  const targetPointsRef = useRef<number[]>([...dataPoints || [50, 60, 70, 65, 75, 80, 85, 90, 85, 80, 75, 70]]);
  const breathRef = useRef(0);

  const colors = SCENARIO_COLORS[scenario];

  // GSAP morph when data changes
  useEffect(() => {
    if (dataPoints) {
      targetPointsRef.current = [...dataPoints];
      
      gsap.to(currentPointsRef.current, {
        duration: 0.7,
        ease: 'power3.out',
        ...dataPoints.reduce((acc, val, i) => ({ ...acc, [i]: val }), {}),
      });
    }
  }, [dataPoints]);

  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth interpolation toward target
    currentPointsRef.current = lerpArray(
      currentPointsRef.current,
      targetPointsRef.current,
      0.08
    );

    // Breathing animation
    breathRef.current += 0.012;
    const breathAmount = Math.sin(breathRef.current) * 0.04;

    // Generate points
    const topPoints = createSplinePoints(
      currentPointsRef.current,
      14,
      4.5,
      breathAmount,
      0
    );

    // Report positions for timeline
    if (onPointsUpdate) {
      onPointsUpdate(topPoints);
    }

    // Create smooth curve
    const curve = createSplineCurve(topPoints);
    const curvePoints = curve.getPoints(80);

    // Update LINE geometry (top edge)
    if (lineMeshRef.current) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      lineMeshRef.current.geometry.dispose();
      lineMeshRef.current.geometry = lineGeo;
    }

    // Update GLOW line (slightly offset)
    if (glowMeshRef.current) {
      const glowPoints = curvePoints.map(p => new THREE.Vector3(p.x, p.y + 0.02, p.z - 0.1));
      const glowGeo = new THREE.BufferGeometry().setFromPoints(glowPoints);
      glowMeshRef.current.geometry.dispose();
      glowMeshRef.current.geometry = glowGeo;
    }

    // Update FILL geometry (gradient mesh)
    if (fillMeshRef.current) {
      const vertices: number[] = [];
      const colorArray: number[] = [];

      const topColor = new THREE.Color(colors.glow);
      const bottomColor = new THREE.Color('#0a1628');

      curvePoints.forEach((point) => {
        // Top vertex
        vertices.push(point.x, point.y, -0.2);
        // Bottom vertex
        vertices.push(point.x, -0.8, -0.2);

        // Color gradient
        colorArray.push(topColor.r * 0.7, topColor.g * 0.7, topColor.b * 0.7);
        colorArray.push(bottomColor.r, bottomColor.g, bottomColor.b);
      });

      // Create indices for triangle strip
      const indices: number[] = [];
      for (let i = 0; i < curvePoints.length - 1; i++) {
        const topLeft = i * 2;
        const bottomLeft = i * 2 + 1;
        const topRight = (i + 1) * 2;
        const bottomRight = (i + 1) * 2 + 1;

        indices.push(topLeft, bottomLeft, topRight);
        indices.push(bottomLeft, bottomRight, topRight);
      }

      const fillGeo = new THREE.BufferGeometry();
      fillGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      fillGeo.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
      fillGeo.setIndex(indices);

      fillMeshRef.current.geometry.dispose();
      fillMeshRef.current.geometry = fillGeo;
    }

    // Pulse effect when KPI active
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.LineBasicMaterial;
      if (activeKPIIndex !== null) {
        const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
        mat.opacity = pulse;
      } else {
        mat.opacity = 1;
      }
    }
  });

  // Create line objects with materials
  const glowLine = useMemo(() => {
    return new THREE.Line(
      new THREE.BufferGeometry(),
      createNeonLineMaterial(colors.glow, 0.3, 3)
    );
  }, [colors.glow]);

  const mainLine = useMemo(() => {
    return new THREE.Line(
      new THREE.BufferGeometry(),
      createNeonLineMaterial(colors.primary, 1, 2)
    );
  }, [colors.primary]);

  // Update materials when colors change
  useEffect(() => {
    if (glowMeshRef.current) {
      const mat = glowMeshRef.current.material as THREE.LineBasicMaterial;
      mat.color.setHex(colors.glow);
    }
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.LineBasicMaterial;
      mat.color.setHex(colors.primary);
    }
  }, [colors]);

  const initialFillGeo = useMemo(() => new THREE.BufferGeometry(), []);

  const fillMaterial = useMemo(() => createGradientMaterial(0.4), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Gradient Fill */}
      <mesh ref={fillMeshRef} geometry={initialFillGeo} material={fillMaterial} />

      {/* Glow Line (behind) */}
      <primitive ref={glowMeshRef} object={glowLine} />

      {/* Main Ridge Line */}
      <primitive ref={lineMeshRef} object={mainLine} />
    </group>
  );
}

// ============================================================================
// SCENE SETUP
// ============================================================================
function Scene({ dataPoints, scenario, activeKPIIndex, onPointsUpdate }: MountainEngineV2Props) {
  const { camera } = useThree();

  // Fixed camera position
  useEffect(() => {
    camera.position.set(0, 1.8, 9);
    camera.lookAt(0, 0.8, 0);
  }, [camera]);

  // Subtle camera drift
  useFrame((state) => {
    camera.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.05;
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 6, 4]} intensity={1.2} color={SCENARIO_COLORS[scenario || 'base'].primary} distance={20} decay={2} />
      <pointLight position={[-5, 3, 2]} intensity={0.6} color={0x14b8a6} distance={15} />
      <pointLight position={[5, 3, 2]} intensity={0.6} color={0x5eead4} distance={15} />

      {/* Mountain */}
      <NeonRibbon
        dataPoints={dataPoints}
        scenario={scenario}
        activeKPIIndex={activeKPIIndex}
        onPointsUpdate={onPointsUpdate}
      />

      {/* Scene fog */}
      <fog attach="fog" args={['#0a1628', 6, 18]} />
    </>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function MountainEngineV2({
  dataPoints,
  scenario = 'base',
  activeKPIIndex = null,
  onPointsUpdate,
}: MountainEngineV2Props) {
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

        {/* Bloom post-processing */}
        <EffectComposer>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.95}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

