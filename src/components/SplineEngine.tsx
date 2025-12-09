// ============================================================================
// STRATFIT SPLINE ENGINE — G-D MODE v9.0
// Premium CatmullRom + TubeGeometry + Bloom + GSAP
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
// SCENARIO COLOR THEMES
// ============================================================================
const SCENARIO_THEMES = {
  base: {
    primary: new THREE.Color('#22d3d3'),
    secondary: new THREE.Color('#14b8a6'),
    glow: new THREE.Color('#5eead4'),
    hex: 0x22d3d3,
  },
  upside: {
    primary: new THREE.Color('#34d399'),
    secondary: new THREE.Color('#10b981'),
    glow: new THREE.Color('#6ee7b7'),
    hex: 0x34d399,
  },
  downside: {
    primary: new THREE.Color('#fbbf24'),
    secondary: new THREE.Color('#f59e0b'),
    glow: new THREE.Color('#fcd34d'),
    hex: 0xfbbf24,
  },
  extreme: {
    primary: new THREE.Color('#f472b6'),
    secondary: new THREE.Color('#ec4899'),
    glow: new THREE.Color('#f9a8d4'),
    hex: 0xf472b6,
  },
};

const TIMELINE_LABELS = {
  monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
  yearly: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
};

// ============================================================================
// GRADIENT FILLED MOUNTAIN MESH
// ============================================================================
interface MountainMeshProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  activeKPIIndex: number | null;
  onPositionsReady: (positions: THREE.Vector3[]) => void;
}

function MountainMesh({ dataPoints, scenario, activeKPIIndex, onPositionsReady }: MountainMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fillMeshRef = useRef<THREE.Mesh>(null);
  const lineMeshRef = useRef<THREE.Line | null>(null);
  const glowMeshRef = useRef<THREE.Line | null>(null);
  
  const currentPointsRef = useRef<number[]>([...dataPoints]);
  const breathRef = useRef(0);
  const targetPointsRef = useRef<number[]>([...dataPoints]);

  const theme = SCENARIO_THEMES[scenario];

  // GSAP morph when data changes
  useEffect(() => {
    targetPointsRef.current = [...dataPoints];
    
    gsap.to(currentPointsRef, {
      current: dataPoints,
      duration: 0.7,
      ease: 'power3.out',
      onUpdate: () => {
        // Points updated in animation loop
      },
    });
  }, [dataPoints]);

  // Animation loop
  useFrame((state) => {
    if (!groupRef.current) return;

    // Smooth interpolation toward target
    currentPointsRef.current = currentPointsRef.current.map((val, i) => {
      const target = targetPointsRef.current[i] ?? val;
      return val + (target - val) * 0.08;
    });

    // Breathing animation
    breathRef.current += 0.012;
    const breathAmount = Math.sin(breathRef.current) * 0.04;

    // Generate points
    const width = 14;
    const heightScale = 4.5;
    const count = currentPointsRef.current.length;

    const topPoints: THREE.Vector3[] = [];
    const bottomPoints: THREE.Vector3[] = [];

    currentPointsRef.current.forEach((value, i) => {
      const x = (i / (count - 1)) * width - width / 2;
      const y = (value / 100) * heightScale + breathAmount + Math.sin(breathRef.current + i * 0.5) * 0.05;
      topPoints.push(new THREE.Vector3(x, y, 0));
      bottomPoints.push(new THREE.Vector3(x, -0.5, 0));
    });

    // Report positions for timeline
    onPositionsReady(topPoints);

    // Create smooth curve
    const curve = new THREE.CatmullRomCurve3(topPoints, false, 'catmullrom', 0.4);
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
      const colors: number[] = [];

      // Build triangle strip for gradient fill
      curvePoints.forEach((point) => {
        // Top vertex
        vertices.push(point.x, point.y, -0.2);
        // Bottom vertex
        vertices.push(point.x, -0.8, -0.2);

        // Color gradient (top = bright, bottom = dark)
        const topColor = theme.glow;
        const bottomColor = new THREE.Color('#0a1628');

        colors.push(topColor.r * 0.7, topColor.g * 0.7, topColor.b * 0.7);
        colors.push(bottomColor.r, bottomColor.g, bottomColor.b);
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
      fillGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
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

  // Initial geometries
  const initialLineGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const initialFillGeo = useMemo(() => new THREE.BufferGeometry(), []);

  // Create line objects with materials
  const glowLine = useMemo(() => {
    return new THREE.Line(initialLineGeo, new THREE.LineBasicMaterial({
      color: theme.glow,
      transparent: true,
      opacity: 0.3,
      linewidth: 3,
    }));
  }, [initialLineGeo, theme.glow]);

  const mainLine = useMemo(() => {
    return new THREE.Line(initialLineGeo, new THREE.LineBasicMaterial({
      color: theme.primary,
      transparent: true,
      opacity: 1,
      linewidth: 2,
    }));
  }, [initialLineGeo, theme.primary]);

  // Update materials when theme changes
  useEffect(() => {
    if (glowMeshRef.current) {
      const mat = glowMeshRef.current.material as THREE.LineBasicMaterial;
      mat.color.copy(theme.glow);
    }
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.LineBasicMaterial;
      mat.color.copy(theme.primary);
    }
  }, [theme]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Gradient Fill */}
      <mesh ref={fillMeshRef} geometry={initialFillGeo}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Glow Line (behind) */}
      <primitive ref={glowMeshRef} object={glowLine} />

      {/* Main Ridge Line */}
      <primitive ref={lineMeshRef} object={mainLine} />
    </group>
  );
}

// ============================================================================
// ATMOSPHERIC ELEMENTS
// ============================================================================
function Atmosphere({ scenario }: { scenario: string }) {
  const fogRef = useRef<THREE.Mesh>(null);
  const theme = SCENARIO_THEMES[scenario as keyof typeof SCENARIO_THEMES];

  useFrame((state) => {
    if (fogRef.current) {
      fogRef.current.position.y = -1.5 + Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
      const mat = fogRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <>
      {/* Bottom fog layer */}
      <mesh ref={fogRef} position={[0, -1.5, -2]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[20, 6]} />
        <meshBasicMaterial
          color={theme.hex}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ambient particles effect */}
      <points position={[0, 1, -3]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(150).map(() => (Math.random() - 0.5) * 16), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={theme.glow}
          size={0.03}
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </>
  );
}

// ============================================================================
// SCENE SETUP
// ============================================================================
interface SceneProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
  activeKPIIndex: number | null;
  onTimelineUpdate: (positions: { x: number; y: number; label: string }[]) => void;
}

function Scene({ dataPoints, scenario, timePeriod, activeKPIIndex, onTimelineUpdate }: SceneProps) {
  const { camera, size } = useThree();
  const theme = SCENARIO_THEMES[scenario];

  // Fixed camera (NO USER CONTROL)
  useEffect(() => {
    camera.position.set(0, 1.8, 9);
    camera.lookAt(0, 0.8, 0);
  }, [camera]);

  // Subtle camera drift
  useFrame((state) => {
    camera.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.05;
  });

  // Project 3D → 2D for timeline
  const handlePositions = (points: THREE.Vector3[]) => {
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

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 6, 4]} intensity={1.2} color={theme.hex} distance={20} decay={2} />
      <pointLight position={[-5, 3, 2]} intensity={0.6} color={0x14b8a6} distance={15} />
      <pointLight position={[5, 3, 2]} intensity={0.6} color={0x5eead4} distance={15} />

      {/* Mountain */}
      <MountainMesh
        dataPoints={dataPoints}
        scenario={scenario}
        activeKPIIndex={activeKPIIndex}
        onPositionsReady={handlePositions}
      />

      {/* Atmosphere */}
      <Atmosphere scenario={scenario} />

      {/* Scene fog */}
      <fog attach="fog" args={['#0a1628', 6, 18]} />
    </>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function SplineEngine({
  dataPoints,
  scenario,
  timePeriod,
  activeKPIIndex,
  onTimelineUpdate,
}: SplineEngineProps) {
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
          timePeriod={timePeriod}
          activeKPIIndex={activeKPIIndex}
          onTimelineUpdate={onTimelineUpdate}
        />

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