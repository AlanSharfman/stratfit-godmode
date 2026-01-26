// src/components/mountain/DormantInstrument.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// DORMANT INSTRUMENT — Landing Page Strategic Mountain
// A blank canvas that awakens with user curiosity
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  OrbitControls,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLEX NOISE — For ridge detail
// ═══════════════════════════════════════════════════════════════════════════════

class SimplexNoise {
  private perm: number[] = [];
  private gradP: { x: number; y: number }[] = [];
  
  private grad3 = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  ];

  constructor(seed: number = 42) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    
    let n = 256;
    let random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    
    while (n--) {
      const i = Math.floor(random() * (n + 1));
      [p[n], p[i]] = [p[i], p[n]];
    }
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 8];
    }
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.gradP[ii + this.perm[jj]];
      t0 *= t0;
      n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]];
      t1 *= t1;
      n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]];
      t2 *= t2;
      n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2);
    }
    
    return 70 * (n0 + n1 + n2);
  }
}

const simplex = new SimplexNoise(42);

// ═══════════════════════════════════════════════════════════════════════════════
// DORMANT MASSIF GEOMETRY — Reduced noise for blank canvas feel
// ═══════════════════════════════════════════════════════════════════════════════

function createDormantGeometry(ridgeIntensity: number = 0.5): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(12, 10, 256, 256);
  const pos = geo.attributes.position;
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    
    const dist = Math.sqrt(x * x + y * y);
    const islandMask = Math.pow(Math.max(0, 1.0 - dist / 5.5), 2.0);
    
    // Primary summit with clinical sharpness
    const normalizedDist = dist / 5.0;
    const radialPeak = Math.pow(Math.max(0, 1 - normalizedDist), 2.5) * 4.5;
    
    // Reduced ridge sharpening for dormant state (controlled by ridgeIntensity)
    const ridgeNoise = Math.abs(simplex.noise2D(x * 0.6, y * 0.6)) * ridgeIntensity;
    const valleyNoise = Math.abs(simplex.noise2D(x * 1.2, y * 1.2)) * ridgeIntensity * 0.5;
    
    const totalHeight = radialPeak + ridgeNoise + valleyNoise;
    pos.setZ(i, totalHeight * islandMask);
  }
  
  geo.computeVertexNormals();
  return geo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMIT PULSE — Breathing white glow at peak
// ═══════════════════════════════════════════════════════════════════════════════

function SummitPulse() {
  const pulseRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Soft breathing rhythm
    const breath = 0.8 + Math.sin(time * 0.8) * 0.2;
    const glow = 0.4 + Math.sin(time * 1.2) * 0.15;
    
    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(breath);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.sin(time * 1.5) * 0.2;
    }
    
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.5 + glow);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(time * 0.8) * 0.08;
    }
  });
  
  return (
    <group position={[0, 0, 4.8]}>
      {/* Core pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      
      {/* Soft outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL COLOR BLEED — Reactive glow based on hover state
// ═══════════════════════════════════════════════════════════════════════════════

interface ColorBleedProps {
  activeHover: 'growth' | 'risk' | null;
  intensity: number;
}

function ColorBleed({ activeHover, intensity }: ColorBleedProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const color = activeHover === 'growth' ? '#00ffff' : activeHover === 'risk' ? '#f59e0b' : '#ffffff';
  const targetIntensity = activeHover ? intensity : 0;
  
  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      // Smooth transition
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetIntensity * 0.15, 0.05);
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, 2]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DORMANT MOUNTAIN — The main reactive terrain
// ═══════════════════════════════════════════════════════════════════════════════

interface DormantMountainProps {
  activeHover: 'growth' | 'risk' | null;
  ridgeIntensity: number;
}

function DormantMountain({ activeHover, ridgeIntensity }: DormantMountainProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Regenerate geometry when ridge intensity changes significantly
  const geometry = useMemo(() => createDormantGeometry(ridgeIntensity), [ridgeIntensity]);
  
  // Determine internal glow color
  const glowColor = activeHover === 'growth' ? '#00ffff' : activeHover === 'risk' ? '#f59e0b' : '#1a2a3a';
  
  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -1.5, 0]}>
      {/* LAYER 1: DEEP CHARCOAL BASE */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#0a0f18"
          roughness={0.3}
          metalness={0.7}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* LAYER 2: DORMANT CRYSTAL SURFACE — High opacity, muted */}
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <MeshTransmissionMaterial
          transmission={0.9}
          thickness={5.0}
          roughness={0.08}
          ior={1.15}
          chromaticAberration={0.05}
          backside={true}
          color="#0a1018"
          distortion={0.02}
          distortionScale={0.05}
        />
      </mesh>

      {/* LAYER 3: DORMANT WIREFRAME — Very faint */}
      <mesh geometry={geometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial
          wireframe
          color="#2a3a4a"
          transparent
          opacity={0.06}
          toneMapped={false}
        />
      </mesh>
      
      {/* LAYER 4: REACTIVE WIREFRAME — Glows on hover */}
      <mesh geometry={geometry} position={[0, 0, 0.03]}>
        <meshBasicMaterial
          wireframe
          color={glowColor}
          transparent
          opacity={activeHover ? 0.12 : 0.02}
          toneMapped={false}
        />
      </mesh>

      {/* SUMMIT PULSE — Breathing beacon */}
      <SummitPulse />
      
      {/* INTERNAL COLOR BLEED — Reactive glow */}
      <ColorBleed activeHover={activeHover} intensity={ridgeIntensity} />

      {/* DRAMATIC TOP-DOWN SPOTLIGHT */}
      <spotLight
        position={[0, 0, 15]}
        angle={0.5}
        penumbra={0.8}
        intensity={30}
        color="#ffffff"
        distance={40}
        decay={2}
        castShadow
      />
      
      {/* Subtle rim lights */}
      <pointLight 
        position={[-8, 0, 4]} 
        intensity={3} 
        color="#1a3a5a" 
        distance={15} 
      />
      <pointLight 
        position={[8, 0, 4]} 
        intensity={3} 
        color="#1a3a5a" 
        distance={15} 
      />
      
      {/* Deep ambient */}
      <ambientLight intensity={0.08} color="#0a1520" />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DORMANT INSTRUMENT — Main Export Component
// ═══════════════════════════════════════════════════════════════════════════════

interface DormantInstrumentProps {
  onGrowthHover?: (hovering: boolean) => void;
  onRiskHover?: (hovering: boolean) => void;
}

export default function DormantInstrument({ onGrowthHover, onRiskHover }: DormantInstrumentProps) {
  const [activeHover, setActiveHover] = useState<'growth' | 'risk' | null>(null);
  const [ridgeIntensity, setRidgeIntensity] = useState(0.5);
  
  // Handle hover state changes
  const handleGrowthHover = useCallback((hovering: boolean) => {
    setActiveHover(hovering ? 'growth' : null);
    setRidgeIntensity(hovering ? 0.8 : 0.5);
    onGrowthHover?.(hovering);
  }, [onGrowthHover]);
  
  const handleRiskHover = useCallback((hovering: boolean) => {
    setActiveHover(hovering ? 'risk' : null);
    setRidgeIntensity(hovering ? 0.9 : 0.5);
    onRiskHover?.(hovering);
  }, [onRiskHover]);
  
  return (
    <div 
      className="relative w-full h-full min-h-[400px] overflow-hidden"
      style={{ 
        background: 'radial-gradient(ellipse at 50% 40%, #0a1520 0%, #050a10 50%, #030508 100%)' 
      }}
    >
      {/* INTERACTIVE UI TRIGGERS */}
      <div className="absolute top-8 left-8 z-20">
        <div 
          className="group cursor-pointer"
          onMouseEnter={() => handleGrowthHover(true)}
          onMouseLeave={() => handleGrowthHover(false)}
        >
          <span className={`text-2xl font-black tracking-tight transition-all duration-300 ${
            activeHover === 'growth' 
              ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]' 
              : 'text-white/60'
          }`}>
            GROWTH
          </span>
          <div className={`h-0.5 mt-1 transition-all duration-300 ${
            activeHover === 'growth' ? 'w-full bg-cyan-400' : 'w-0 bg-transparent'
          }`} />
        </div>
      </div>
      
      <div className="absolute top-8 right-8 z-20">
        <div 
          className="group cursor-pointer text-right"
          onMouseEnter={() => handleRiskHover(true)}
          onMouseLeave={() => handleRiskHover(false)}
        >
          <span className={`text-2xl font-black tracking-tight transition-all duration-300 ${
            activeHover === 'risk' 
              ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
              : 'text-white/60'
          }`}>
            RISK
          </span>
          <div className={`h-0.5 mt-1 transition-all duration-300 ml-auto ${
            activeHover === 'risk' ? 'w-full bg-amber-400' : 'w-0 bg-transparent'
          }`} />
        </div>
      </div>
      
      {/* STATUS INDICATOR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
            activeHover ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'
          }`} />
          <span className="text-[10px] tracking-[0.3em] text-white/40 font-medium">
            {activeHover ? 'ANALYZING' : 'AWAITING INPUT'}
          </span>
        </div>
      </div>

      {/* 3D CANVAS */}
      <Canvas
        camera={{ 
          position: [12, 10, 16], // HERO FRAMING: Uncarved trophy view
          fov: 38 
        }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#030508']} />
          <fog attach="fog" args={['#050a10', 25, 60]} />
          
          <Environment preset="night" />

          <DormantMountain 
            activeHover={activeHover} 
            ridgeIntensity={ridgeIntensity}
          />
          
          <OrbitControls
            target={[0, 1, 0]}
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            makeDefault
          />
        </Suspense>
      </Canvas>
      
      {/* CRT SCAN LINES */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FOR USE IN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export { DormantInstrument };

