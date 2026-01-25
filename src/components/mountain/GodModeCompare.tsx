// src/components/mountain/GodModeCompare.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// STRATFIT UNIFIED DESTINY FIELD — CRITICAL SYSTEM OVERRIDE
// High-fidelity refractive Topographic Slab with internal light paths
// Machined aerospace glass with surface-aware lava rivers
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  OrbitControls,
  Html,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLEX NOISE — Industrial-grade procedural noise for ridge detail
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
    
    // Seeded shuffle
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
    
    const gi0 = this.gradP[ii + this.perm[jj]];
    const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]];
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2);
    }
    
    return 70 * (n0 + n1 + n2);
  }
}

const simplex = new SimplexNoise(12345);

// ═══════════════════════════════════════════════════════════════════════════════
// GAUSSIAN PEAK FUNCTION — For multi-peak massif generation
// ═══════════════════════════════════════════════════════════════════════════════

const gaussianPeak = (
  x: number, 
  y: number, 
  cx: number, 
  cy: number, 
  height: number, 
  power: number,
  spread: number = 2.5
): number => {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return height * Math.pow(Math.max(0, 1 - dist / spread), power);
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT ENGINE — Executive verdict interpreter
// ═══════════════════════════════════════════════════════════════════════════════

interface ScenarioData {
  arr: number;
  survival: number;
  runway: number;
  score: number;
}

interface StrategicVerdict {
  verdict: string;
  color: string;
  analysis: string;
  recommendation: string;
}

const getStrategicVerdict = (scenarioA: ScenarioData, scenarioB: ScenarioData): StrategicVerdict => {
  const arrDelta = ((scenarioB.arr - scenarioA.arr) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;

  if (arrDelta > 30 && survivalDelta < -20) {
    return {
      verdict: "HIGH-STAKES AGGRESSION",
      color: "#ef4444",
      analysis: `Scenario B accelerates ARR by ${arrDelta.toFixed(0)}%, but creates a 'Survival Gap' of ${Math.abs(survivalDelta).toFixed(0)} points.`,
      recommendation: "Stagger hiring intensity to recover 12 months of runway."
    };
  }

  if (arrDelta > 5 && survivalDelta >= 0) {
    return {
      verdict: "OPTIMAL ASCENT",
      color: "#10b981",
      analysis: "You have found a growth vector that increases revenue without compromising stability.",
      recommendation: "Lock this as your new Baseline Trajectory."
    };
  }

  if (arrDelta < -10 && survivalDelta > 15) {
    return {
      verdict: "DEFENSIVE RETREAT",
      color: "#3b82f6",
      analysis: `Trading ${Math.abs(arrDelta).toFixed(0)}% ARR for ${survivalDelta.toFixed(0)} points of survival.`,
      recommendation: "Acceptable for bridge periods. Set a 6-month review trigger."
    };
  }

  if (arrDelta < -5 && survivalDelta < -10) {
    return {
      verdict: "CRITICAL DIVERGENCE",
      color: "#dc2626",
      analysis: "Both growth and stability are declining. This trajectory leads to accelerated runway depletion.",
      recommendation: "Revert to Baseline immediately. Review Cost Discipline and Market Volatility levers."
    };
  }

  return {
    verdict: "MARGINAL VARIANCE",
    color: "#fbbf24",
    analysis: "Strategic divergence is minimal. Current lever shifts do not significantly alter outcomes.",
    recommendation: "Explore more aggressive Pricing Power or Demand Strength."
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MONTE CARLO UNCERTAINTY FAN — Probability particles at path terminus
// ═══════════════════════════════════════════════════════════════════════════════

interface UncertaintyFanProps {
  color: string;
  score: number;
  position: THREE.Vector3;
}

function UncertaintyFan({ color, score, position }: UncertaintyFanProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const { positions, velocities } = useMemo(() => {
    const count = 150;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const uncertainty = (100 - score) / 100;
    
    for (let i = 0; i < count; i++) {
      // Fan spread based on uncertainty
      const spreadX = (Math.random() - 0.5) * 4 * uncertainty;
      const spreadY = (Math.random() - 0.5) * 3 * uncertainty;
      const spreadZ = Math.random() * 2 * uncertainty;
      
      pos[i * 3] = position.x + spreadX;
      pos[i * 3 + 1] = position.y + spreadY;
      pos[i * 3 + 2] = position.z + spreadZ + 0.3;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = Math.random() * 0.02;
      vel[i * 3 + 2] = Math.random() * 0.01;
    }
    
    return { positions: pos, velocities: vel };
  }, [score, position]);

  useFrame((state) => {
    if (particlesRef.current && particlesRef.current.geometry) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      
      for (let i = 0; i < pos.count; i++) {
        arr[i * 3] += velocities[i * 3];
        arr[i * 3 + 1] += velocities[i * 3 + 1];
        arr[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Reset particles that drift too far
        const dx = arr[i * 3] - position.x;
        const dy = arr[i * 3 + 1] - position.y;
        if (Math.sqrt(dx * dx + dy * dy) > 3) {
          arr[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
          arr[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
          arr[i * 3 + 2] = position.z + Math.random() * 0.5;
        }
      }
      pos.needsUpdate = true;
      
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2.5) * 0.2;
    }
  });

  const bufferGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  return (
    <points ref={particlesRef} geometry={bufferGeometry}>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PEAK MASSIF GEOMETRY GENERATOR
// Single 12x10 PlaneGeometry with 256x256 subdivisions
// Island Mask + 4 Gaussian Peaks + Ridge Sharpening
// ═══════════════════════════════════════════════════════════════════════════════

function createMassifGeometry(): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(12, 10, 256, 256);
  const pos = geo.attributes.position;
  
  // Secondary Gaussian peaks for massif character
  const secondaryPeaks = [
    { cx: -3, cy: 2, height: 2.5, power: 2.0, spread: 2.5 },     // Strategic Ridge 1
    { cx: 4, cy: -1, height: 2.0, power: 2.2, spread: 2.2 },     // Strategic Ridge 2
    { cx: 1, cy: 3, height: 1.8, power: 1.8, spread: 2.0 },      // Strategic Ridge 3
  ];
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    
    // Distance from center
    const dist = Math.sqrt(x * x + y * y);
    
    // ISLAND MASK: Force perimeter to flat zero
    const islandMask = Math.pow(Math.max(0, 1.0 - dist / 5.5), 2.0);
    
    // PRIMARY SUMMIT: Radial Peak using pow(dist, 2.5) * 4.5
    // Inverted: highest at center (dist=0), falls off with distance
    const normalizedDist = dist / 5.0; // Normalize to 0-1 range
    const radialPeak = Math.pow(Math.max(0, 1 - normalizedDist), 2.5) * 4.5;
    
    // Sum secondary Gaussian peaks
    let secondaryHeight = 0;
    for (const peak of secondaryPeaks) {
      secondaryHeight += gaussianPeak(x, y, peak.cx, peak.cy, peak.height, peak.power, peak.spread);
    }
    
    // RIDGE SHARPENING: abs(simplex.noise2D) for sharp geological ridges
    const ridgeNoise = Math.abs(simplex.noise2D(x * 0.8, y * 0.8)) * 0.8;
    // Deep valleys with additional noise layer
    const valleyNoise = Math.abs(simplex.noise2D(x * 1.5, y * 1.5)) * 0.4;
    // Micro detail for surface texture
    const microDetail = simplex.noise2D(x * 3.0, y * 3.0) * 0.1;
    
    // Combine: Primary radial peak + secondary peaks + ridge detail
    const totalHeight = radialPeak + secondaryHeight + ridgeNoise + valleyNoise + microDetail;
    
    // Apply island mask constraint
    const finalHeight = totalHeight * islandMask;
    
    pos.setZ(i, finalHeight);
  }
  
  geo.computeVertexNormals();
  return geo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SURFACE HEIGHT SAMPLER — Bilinear interpolation for precise surface cling
// ═══════════════════════════════════════════════════════════════════════════════

function getMassifHeight(x: number, y: number, geometry: THREE.PlaneGeometry): number {
  const pos = geometry.attributes.position;
  const width = 12;
  const height = 10;
  const segmentsX = 256;
  const segmentsY = 256;
  
  const normalizedX = (x + width / 2) / width;
  const normalizedY = (y + height / 2) / height;
  
  const gx = Math.max(0, Math.min(segmentsX - 1, normalizedX * segmentsX));
  const gy = Math.max(0, Math.min(segmentsY - 1, normalizedY * segmentsY));
  
  const ix0 = Math.floor(gx);
  const iy0 = Math.floor(gy);
  const ix1 = Math.min(segmentsX, ix0 + 1);
  const iy1 = Math.min(segmentsY, iy0 + 1);
  
  const fx = gx - ix0;
  const fy = gy - iy0;
  
  const stride = segmentsX + 1;
  const z00 = pos.getZ(iy0 * stride + ix0);
  const z10 = pos.getZ(iy0 * stride + ix1);
  const z01 = pos.getZ(iy1 * stride + ix0);
  const z11 = pos.getZ(iy1 * stride + ix1);
  
  const z0 = z00 * (1 - fx) + z10 * fx;
  const z1 = z01 * (1 - fx) + z11 * fx;
  
  return z0 * (1 - fy) + z1 * fy;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SURFACE-AWARE LAVA RIVER — Strategic Timeline Paths (36-Month Projection)
// 
// LOGIC:
// - Month 0 (t=0): Both paths START at the SUMMIT (current state/position)
// - Month 36 (t=1): Paths END at the BASE (projected future outcome)
// - Higher score = path stays closer to center (optimal trajectory)
// - Lower score = path drifts outward (suboptimal trajectory)
// - Baseline (cyan) goes LEFT, Exploration (amber) goes RIGHT
// ═══════════════════════════════════════════════════════════════════════════════

interface LavaRiverProps {
  color: string;
  score: number;
  isBaseline: boolean;
  geometry: THREE.PlaneGeometry;
}

function LavaRiver({ color, score, isBaseline, geometry }: LavaRiverProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const pipRefs = useRef<THREE.Mesh[]>([]);
  
  // STRATEGIC DRIFT CALCULATION:
  // - side: baseline goes left (-1), exploration goes right (+1)
  // - driftIntensity: worse score = more outward drift from optimal center
  const side = isBaseline ? -1 : 1;
  const scoreNormalized = score / 100; // 0-1 range
  const driftIntensity = (1 - scoreNormalized) * 3.0; // 0-3 units of drift
  
  // Generate surface-aware curve representing 36-MONTH TIMELINE
  // CONSTRAINT: Every point MUST sample the Mountain's Z-height and offset by +0.05
  const { curve, endPosition } = useMemo(() => {
    const curvePoints: THREE.Vector3[] = [];
    const SURFACE_OFFSET = 0.05; // Normal displacement to sit perfectly "over the top"
    const STEPS = 100; // High resolution for smooth ridge/valley following
    
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS; // 0 = Month 0 (summit), 1 = Month 36 (base)
      
      // Y-AXIS: Time progression down the mountain
      // Geometry is 12x10, so Y ranges from -5 to +5
      // Start near summit (y=4), end near base (y=-4)
      const y = 4 - t * 8;
      
      // X-AXIS: Strategic divergence from optimal center
      // Both paths start near center, then diverge based on score
      const timeBasedSpread = t * 2.5; // Gradual spread over timeline
      const scoreDrift = driftIntensity * t * t; // Accelerating drift for worse scores
      const waviness = Math.sin(t * Math.PI * 2) * 0.4 * t; // Sinuous path follows terrain
      
      const x = side * (0.15 + timeBasedSpread + scoreDrift) + waviness * side;
      
      // Z-AXIS: Sample EXACT terrain height + offset
      // This makes paths flow OVER ridges and INTO valleys
      const terrainZ = getMassifHeight(x, y, geometry);
      const z = terrainZ + SURFACE_OFFSET;
      
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const lastPoint = curvePoints[curvePoints.length - 1];
    return { 
      curve: new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5),
      endPosition: lastPoint.clone()
    };
  }, [score, driftIntensity, side, geometry]);
  
  // REALISTIC MULTI-LAYER TUBE SYSTEM for volumetric lava appearance
  // Main conduit radius: 0.04 as specified
  const tubes = useMemo(() => ({
    // Layer 1: Wide atmospheric haze (heat distortion)
    atmosphericHaze: new THREE.TubeGeometry(curve, 100, 0.20, 16, false),
    // Layer 2: Outer glow corona
    outerGlow: new THREE.TubeGeometry(curve, 100, 0.12, 12, false),
    // Layer 3: Mid glow (main visible body)
    midGlow: new THREE.TubeGeometry(curve, 100, 0.06, 12, false),
    // Layer 4: Main lava conduit (radius: 0.04 as specified)
    mainTube: new THREE.TubeGeometry(curve, 100, 0.04, 12, false),
    // Layer 5: Hot inner core
    innerCore: new THREE.TubeGeometry(curve, 100, 0.015, 8, false),
    // Layer 6: White-hot plasma center
    plasmaCore: new THREE.TubeGeometry(curve, 100, 0.005, 6, false),
  }), [curve]);

  // Refs for animated materials
  const glowRef = useRef<THREE.Mesh>(null);
  const midRef = useRef<THREE.Mesh>(null);
  
  // Animate glow intensity with organic pulsing
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Pulsing glow layers
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 3 + Math.sin(time * 2.5) * 1.5 + Math.sin(time * 5.7) * 0.5;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(time * 3.2) * 0.04;
    }
    if (midRef.current) {
      const mat = midRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(time * 4.1) * 0.08;
    }
    
    // Flowing energy particles along the path
    pipRefs.current.forEach((pip, i) => {
      if (pip) {
        // Staggered flow with varying speeds (organic feel)
        const speed = 0.04 + (i % 3) * 0.015;
        const offset = i * 0.08;
        const t = ((time * speed + offset) % 1);
        const point = curve.getPointAt(t);
        pip.position.copy(point);
        
        // Organic pulsing size
        const pulse = Math.sin(time * 6 + i * 1.7) * 0.5 + Math.sin(time * 11 + i * 2.3) * 0.2;
        const baseScale = 0.6 + (1 - t) * 0.4; // Larger near summit, smaller at base
        pip.scale.setScalar(baseScale + pulse * 0.3);
        
        // Fade opacity near endpoints
        const edgeFade = Math.min(t * 5, (1 - t) * 5, 1);
        (pip.material as THREE.MeshStandardMaterial).opacity = edgeFade;
      }
    });
  });

  // More particles for realistic flow
  const pips = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <group>
      {/* LAYER 1: ATMOSPHERIC HEAT HAZE — Very subtle, wide */}
      <mesh geometry={tubes.atmosphericHaze}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* LAYER 2: OUTER GLOW CORONA — Soft bloom */}
      <mesh ref={glowRef} geometry={tubes.outerGlow}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* LAYER 3: MID GLOW — Visible body of the flow */}
      <mesh ref={midRef} geometry={tubes.midGlow}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* LAYER 4: MAIN LAVA CONDUIT — Solid emissive core */}
      <mesh ref={tubeRef} geometry={tubes.mainTube}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={4}
          toneMapped={false}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* LAYER 5: HOT INNER CORE — Brighter emission */}
      <mesh geometry={tubes.innerCore}>
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={6}
          toneMapped={false}
        />
      </mesh>
      
      {/* LAYER 6: WHITE-HOT PLASMA CENTER — Pure white */}
      <mesh geometry={tubes.plasmaCore}>
        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
        />
      </mesh>
      
      {/* FLOWING ENERGY PARTICLES — Organic movement */}
      {pips.map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) pipRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={8}
            toneMapped={false}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
      
      {/* MONTE CARLO UNCERTAINTY FAN at path terminus */}
      <UncertaintyFan color={color} score={score} position={endPosition} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE DELTA BLADE — Cursor-tracking vertical laser slicer
// ═══════════════════════════════════════════════════════════════════════════════

interface DeltaBladeProps {
  normalizedX: number;
  month: number;
  valA: number;
  valB: number;
}

function DeltaBlade3D({ normalizedX, month, valA, valB }: DeltaBladeProps) {
  const bladeRef = useRef<THREE.Mesh>(null);
  
  // Position in 3D space based on cursor X
  const xPos = (normalizedX - 0.5) * 10;
  
  useFrame((state) => {
    if (bladeRef.current) {
      // Subtle pulse animation
      const material = bladeRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });
  
  const delta = valB - valA;
  const divergence = valA > 0 ? ((delta / valA) * 100) : 0;

  return (
    <group position={[xPos, 0, 3]}>
      {/* THE DELTA BLADE — Vertical 1px white emissive laser */}
      <mesh ref={bladeRef}>
        <boxGeometry args={[0.008, 10, 0.008]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.9}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner glow halo */}
      <mesh>
        <boxGeometry args={[0.02, 10, 0.02]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.4}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer cyan bloom */}
      <mesh>
        <boxGeometry args={[0.06, 10, 0.06]} />
        <meshBasicMaterial 
          color="#00D9FF" 
          transparent 
          opacity={0.15}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* DYNAMIC HUD — Board-deck tooltip */}
      <Html
        position={[0.5, 4, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div 
          className="backdrop-blur-xl rounded-lg border border-white/20 p-4 min-w-[200px]"
          style={{
            background: 'linear-gradient(180deg, rgba(10,15,25,0.95) 0%, rgba(5,8,15,0.98) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Month Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
            <span className="text-[9px] font-bold tracking-[0.2em] text-white/40">
              MONTH {month + 1}
            </span>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          
          {/* ARR Values */}
          <div className="flex items-baseline gap-3 mb-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ${valB.toFixed(1)}M
            </div>
            <div className={`text-sm font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)}M
            </div>
          </div>
          
          {/* Strategic Divergence */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-[9px] text-white/40 tracking-wider">DIVERGENCE</span>
            <span className={`text-sm font-bold ${Math.abs(divergence) > 10 ? 'text-amber-400' : 'text-white/70'}`}>
              {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
            </span>
          </div>
          
          {/* Scenario Breakdown */}
          <div className="flex gap-4 mt-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
              <span className="text-white/50">A:</span>
              <span className="text-cyan-300">${valA.toFixed(2)}M</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <span className="text-white/50">B:</span>
              <span className="text-amber-300">${valB.toFixed(2)}M</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DESTINY FIELD — The Machined Crystal Topographic Slab
// ═══════════════════════════════════════════════════════════════════════════════

interface UnifiedFieldProps {
  scenarioA: { score: number; arr: number };
  scenarioB: { score: number; arr: number };
  hoverData: { normalizedX: number; month: number; valA: number; valB: number } | null;
}

function UnifiedDestinyField({ scenarioA, scenarioB, hoverData }: UnifiedFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate the MULTI-PEAK MASSIF geometry
  const geometry = useMemo(() => createMassifGeometry(), []);

  // FIXED POSITION - No floating animation
  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.8, 0, 0]} position={[0, 0, 0]}>
      {/* LAYER 1: SOLID OBSIDIAN BASE — Dark volcanic core (no white) */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#050810"
          roughness={0.5}
          metalness={0.9}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* LAYER 2: MACHINED CRYSTAL SURFACE — High transmission refractive glass */}
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <MeshTransmissionMaterial
          transmission={0.98}
          thickness={5.0}
          roughness={0.05}
          ior={1.15}
          chromaticAberration={0.12}
          backside={true}
          color="#0a1a30"
          distortion={0.08}
          distortionScale={0.15}
          temporalDistortion={0.08}
        />
      </mesh>

      {/* LAYER 3: INTERNAL ETCHING — High-frequency cyan wireframe */}
      <mesh geometry={geometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial
          wireframe
          color="#00D9FF"
          transparent
          opacity={0.1}
          toneMapped={false}
        />
      </mesh>
      
      {/* LAYER 4: SURFACE WIREFRAME GRID — Laser-etched data lines */}
      <mesh geometry={geometry} position={[0, 0, 0.04]}>
        <meshBasicMaterial
          wireframe
          color="#00D9FF"
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>

      
      {/* LAVA RIVERS — Surface-aware strategic paths */}
      <LavaRiver 
        color="#00D9FF" 
        score={scenarioA.score} 
        isBaseline={true}
        geometry={geometry} 
      />
      <LavaRiver 
        color="#F59E0B" 
        score={scenarioB.score}
        isBaseline={false}
        geometry={geometry} 
      />

      {/* THE DELTA BLADE — Cursor tracking laser */}
      {hoverData && (
        <DeltaBlade3D 
          normalizedX={hoverData.normalizedX}
          month={hoverData.month}
          valA={hoverData.valA}
          valB={hoverData.valB}
        />
      )}

      {/* COMMAND BRIDGE LIGHTING */}
      {/* High-intensity white light above summit */}
      <pointLight 
        position={[0, 0, 8]} 
        intensity={15} 
        color="#ffffff" 
        distance={20} 
        decay={2} 
      />
      
      {/* Cyan rim light — left edge */}
      <pointLight 
        position={[-8, 0, 3]} 
        intensity={8} 
        color="#00D9FF" 
        distance={15} 
        decay={2} 
      />
      
      {/* Amber rim light — right edge */}
      <pointLight 
        position={[8, 0, 3]} 
        intensity={8} 
        color="#F59E0B" 
        distance={15} 
        decay={2} 
      />
      
      {/* Subtle fill light */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 10]} intensity={0.6} color="#ffffff" />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITANIUM COMMAND BRIDGE — Split bezel header with wet glass highlights
// ═══════════════════════════════════════════════════════════════════════════════

interface TitaniumBridgeProps {
  scenarioA: ScenarioData;
  scenarioB: ScenarioData;
}

function TitaniumCommandBridge({ scenarioA, scenarioB }: TitaniumBridgeProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const scoreDelta = scenarioB.score - scenarioA.score;

  return (
    <div className="absolute top-0 left-0 right-0 z-20">
      <div 
        className="mx-4 mt-4 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(20,25,35,0.95) 0%, rgba(10,14,22,0.98) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Wet glass highlight strip */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.35) 80%, transparent)' }}
        />
        
        <div className="flex items-stretch">
          {/* Scenario A — Cyan Anchor */}
          <div className="flex-1 px-6 py-4 border-r border-cyan-500/20 relative">
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(180deg, #00D9FF 0%, #0891b2 100%)' }}
            />
            <div className="text-[10px] font-bold tracking-[0.15em] text-cyan-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
              BASELINE TRAJECTORY
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-[9px] text-white/40 tracking-wide">ARR</div>
                <div className="text-xl font-black text-white">{formatCurrency(scenarioA.arr)}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 tracking-wide">SURVIVAL</div>
                <div className="text-xl font-black text-white">{scenarioA.survival.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[9px] text-white/40 tracking-wide">SCORE</div>
                <div className="text-xl font-black text-cyan-400">{scenarioA.score}</div>
              </div>
            </div>
          </div>

          {/* Delta Badge — Center */}
          <div className="px-6 py-4 flex flex-col items-center justify-center bg-black/40 min-w-[120px]">
            <div className="text-[9px] text-white/40 tracking-[0.2em] mb-1">DELTA</div>
            <div 
              className={`text-3xl font-black tracking-tight ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ textShadow: scoreDelta >= 0 ? '0 0 20px rgba(16,185,129,0.6)' : '0 0 20px rgba(239,68,68,0.6)' }}
            >
              {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
            </div>
            <div className="text-[8px] text-white/30 mt-1">STRATEGIC SHIFT</div>
          </div>

          {/* Scenario B — Amber Anchor */}
          <div className="flex-1 px-6 py-4 border-l border-amber-500/20 relative">
            <div 
              className="absolute right-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(180deg, #F59E0B 0%, #d97706 100%)' }}
            />
            <div className="text-[10px] font-bold tracking-[0.15em] text-amber-400 mb-2 flex items-center gap-2 justify-end">
              EXPLORATION PATH
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            </div>
            <div className="flex gap-6 justify-end">
              <div className="text-right">
                <div className="text-[9px] text-white/40 tracking-wide">ARR</div>
                <div className="text-xl font-black text-white">{formatCurrency(scenarioB.arr)}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40 tracking-wide">SURVIVAL</div>
                <div className="text-xl font-black text-white">{scenarioB.survival.toFixed(0)}%</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/40 tracking-wide">SCORE</div>
                <div className="text-xl font-black text-amber-400">{scenarioB.score}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT PANEL — AI executive verdict
// ═══════════════════════════════════════════════════════════════════════════════

function StrategicAutopilotPanel({ scenarioA, scenarioB }: { scenarioA: ScenarioData; scenarioB: ScenarioData }) {
  const verdict = useMemo(() => getStrategicVerdict(scenarioA, scenarioB), [scenarioA, scenarioB]);

  return (
    <div 
      className="absolute bottom-4 right-4 w-80 overflow-hidden z-10"
      style={{
        background: 'linear-gradient(180deg, rgba(15,20,30,0.95) 0%, rgba(8,12,18,0.98) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs shadow-[0_0_12px_rgba(0,217,255,0.4)]">
          ⚡
        </div>
        <span className="text-[10px] font-bold tracking-[0.15em] text-white/60">STRATEGIC AUTOPILOT</span>
      </div>
      
      <div className="p-4">
        <div 
          className="inline-block px-4 py-2 rounded-lg text-xs font-black tracking-wider mb-3"
          style={{ 
            backgroundColor: `${verdict.color}15`, 
            color: verdict.color,
            border: `1px solid ${verdict.color}40`,
            boxShadow: `0 0 20px ${verdict.color}25`
          }}
        >
          {verdict.verdict}
        </div>
        
        <p className="text-xs text-white/80 leading-relaxed mb-4">
          {verdict.analysis}
        </p>
        
        <div className="pt-3 border-t border-white/10">
          <div className="text-[9px] font-bold tracking-[0.15em] text-white/40 mb-2">
            ⟐ RECOMMENDATION
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {verdict.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — GOD MODE COMPARE
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModeCompare() {
  const [hoverData, setHoverData] = useState<{ 
    normalizedX: number; 
    month: number; 
    valA: number; 
    valB: number 
  } | null>(null);

  // Get simulation data from stores
  const summary = useSimulationStore((s) => s.summary);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find((sim) => sim.isBaseline));

  // Scenario data with fallbacks
  const scenarioA = useMemo(() => ({
    arr: savedBaseline?.summary.arrMedian || 2100000,
    survival: savedBaseline?.summary.survivalRate ? savedBaseline.summary.survivalRate * 100 : 78,
    runway: savedBaseline?.summary.runwayMedian || 18,
    score: savedBaseline?.summary.overallScore || 72,
  }), [savedBaseline]);

  const scenarioB = useMemo(() => ({
    arr: summary?.arrMedian || 2400000,
    survival: summary?.survivalRate ? summary.survivalRate * 100 : 72,
    runway: summary?.runwayMedian || 16,
    score: summary?.overallScore || 65,
  }), [summary]);

  // Generate trajectory data for Delta Blade
  const trajectoryA = useMemo(() => {
    const data: number[] = [];
    let val = scenarioA.arr / 1000000;
    for (let i = 0; i < 36; i++) {
      data.push(val);
      val *= 1 + scenarioA.score / 1200;
    }
    return data;
  }, [scenarioA]);

  const trajectoryB = useMemo(() => {
    const data: number[] = [];
    let val = scenarioB.arr / 1000000;
    for (let i = 0; i < 36; i++) {
      data.push(val);
      val *= 1 + scenarioB.score / 1200;
    }
    return data;
  }, [scenarioB]);

  const handleCanvasMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const normalizedX = x / rect.width;
    const month = Math.floor(normalizedX * 36);
    if (month >= 0 && month < 36) {
      setHoverData({ 
        normalizedX, 
        month,
        valA: trajectoryA[month] || 0,
        valB: trajectoryB[month] || 0,
      });
    }
  }, [trajectoryA, trajectoryB]);

  return (
    <div 
      className="relative w-full h-full min-h-[500px] overflow-hidden" 
      style={{ 
        background: 'radial-gradient(ellipse at 50% 30%, #0a1020 0%, #050810 50%, #030508 100%)' 
      }}
    >
      {/* TITANIUM COMMAND BRIDGE */}
      <TitaniumCommandBridge scenarioA={scenarioA} scenarioB={scenarioB} />

      {/* 3D CANVAS — Command Bridge perspective */}
      <div
        className="absolute inset-0 pt-28"
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <Canvas
          camera={{ 
            position: [8, 6, 12], // HERO VIEW: Command perspective
            fov: 42 
          }}
          gl={{ 
            antialias: true, 
            alpha: true, 
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.4,
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#050810']} />
            <fog attach="fog" args={['#050810', 20, 50]} />
            
            {/* ENVIRONMENT: City preset for high-contrast glass reflections */}
            <Environment preset="city" />

            {/* UNIFIED DESTINY FIELD - Crystal Massif */}
            <UnifiedDestinyField 
              scenarioA={scenarioA} 
              scenarioB={scenarioB} 
              hoverData={hoverData}
            />
            
            {/* CONSTRAINED ORBIT CONTROLS — 90° rotation limit */}
            <OrbitControls
              target={[0, 1, 0]}
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              rotateSpeed={0.8}
              zoomSpeed={0.6}
              minDistance={8}
              maxDistance={35}
              minPolarAngle={Math.PI / 6}       // 30° from top
              maxPolarAngle={Math.PI / 2.2}     // ~82° (don't flip under)
              minAzimuthAngle={-Math.PI / 4}    // 45° left limit
              maxAzimuthAngle={Math.PI / 4}     // 45° right limit (total 90°)
              enableDamping={true}
              dampingFactor={0.08}
              autoRotate={false}
              makeDefault
            />
          </Suspense>
        </Canvas>
      </div>

      {/* LEGEND */}
      <div className="absolute bottom-4 left-4 flex gap-4 z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,217,255,0.8)]" />
          <span className="text-white/80 text-xs font-medium">Baseline (A)</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          <span className="text-white/80 text-xs font-medium">Exploration (B)</span>
        </div>
      </div>

      {/* STRATEGIC AUTOPILOT PANEL */}
      <StrategicAutopilotPanel scenarioA={scenarioA} scenarioB={scenarioB} />
      
      {/* CRT SCAN LINES */}
      <div 
        className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,217,255,0.15) 2px, rgba(0,217,255,0.15) 4px)',
        }}
      />
    </div>
  );
}
