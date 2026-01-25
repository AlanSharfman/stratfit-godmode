// src/components/mountain/GodModeCompare.tsx
// GOD MODE COMPARE: Unified Destiny Field with Titanium Command Bridge
// Volumetric Refractive Slab - Data flows THROUGH the core, not on top

import React, { useMemo, useRef, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLEX NOISE - For ridge detail
// ═══════════════════════════════════════════════════════════════════════════════

// Fast 2D Simplex-like noise using sine waves (deterministic, no lib needed)
const noise2D = (x: number, y: number): number => {
  const s1 = Math.sin(x * 1.27 + y * 2.89) * 0.5;
  const s2 = Math.sin(x * 3.17 - y * 1.43) * 0.25;
  const s3 = Math.sin(x * 0.73 + y * 4.21) * 0.125;
  return s1 + s2 + s3;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT ENGINE
// Interprets the "Lava Rivers" to provide executive verdict
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

  // HIGH-STAKES AGGRESSION: Growth at the cost of safety
  if (arrDelta > 30 && survivalDelta < -20) {
    return {
      verdict: "HIGH-STAKES AGGRESSION",
      color: "#ef4444",
      analysis: `Scenario B accelerates ARR by ${arrDelta.toFixed(0)}%, but creates a 'Survival Gap' of ${Math.abs(survivalDelta).toFixed(0)} points.`,
      recommendation: "Stagger hiring intensity to recover 12 months of runway."
    };
  }

  // OPTIMAL ASCENT: The "Genius" trajectory
  if (arrDelta > 5 && survivalDelta >= 0) {
    return {
      verdict: "OPTIMAL ASCENT",
      color: "#10b981",
      analysis: "You have found a growth vector that increases revenue without compromising stability.",
      recommendation: "Lock this as your new Baseline Trajectory."
    };
  }

  // DEFENSIVE RETREAT: Trading growth for safety
  if (arrDelta < -10 && survivalDelta > 15) {
    return {
      verdict: "DEFENSIVE RETREAT",
      color: "#3b82f6",
      analysis: `Trading ${Math.abs(arrDelta).toFixed(0)}% ARR for ${survivalDelta.toFixed(0)} points of survival.`,
      recommendation: "Acceptable for bridge periods. Set a 6-month review trigger."
    };
  }

  // CRITICAL DIVERGENCE: Both declining
  if (arrDelta < -5 && survivalDelta < -10) {
    return {
      verdict: "CRITICAL DIVERGENCE",
      color: "#dc2626",
      analysis: "Both growth and stability are declining. This trajectory leads to accelerated runway depletion.",
      recommendation: "Revert to Baseline immediately. Review Cost Discipline and Market Volatility levers."
    };
  }

  // MARGINAL VARIANCE: No significant change
  return {
    verdict: "MARGINAL VARIANCE",
    color: "#fbbf24",
    analysis: "Strategic divergence is minimal. Current lever shifts do not significantly alter outcomes.",
    recommendation: "Explore more aggressive Pricing Power or Demand Strength."
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MONTE CARLO PROBABILITY FAN - Uncertainty particles at base
// ═══════════════════════════════════════════════════════════════════════════════

interface ProbabilityFanProps {
  color: string;
  score: number;
  isBaseline: boolean;
}

function ProbabilityFan({ color, score, isBaseline }: ProbabilityFanProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  // Generate fan particles representing Monte Carlo uncertainty (outcome spread)
  const { positions, scales } = useMemo(() => {
    const count = 100;
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    const uncertainty = (100 - score) / 100; // Lower score = more uncertainty spread
    
    // Fan appears at the END of the path (outcome zone)
    const baseX = isBaseline ? -2.5 : 2.5;
    const baseY = 5; // Front of mountain (where paths end)
    
    for (let i = 0; i < count; i++) {
      // Spread based on uncertainty
      const spreadX = (Math.random() - 0.5) * 3 * uncertainty;
      const spreadY = (Math.random() - 0.5) * 2 * uncertainty;
      const spreadZ = Math.random() * 1.5 * uncertainty;
      
      pos[i * 3] = baseX + spreadX;
      pos[i * 3 + 1] = baseY + spreadY;
      pos[i * 3 + 2] = spreadZ + 0.3;
      scl[i] = 0.02 + Math.random() * 0.04;
    }
    
    return { positions: pos, scales: scl };
  }, [score, isBaseline]);

  // Animate particles
  useFrame((state) => {
    if (particlesRef.current && particlesRef.current.geometry) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const idx = i * 3 + 1; // Y index
        arr[idx] += 0.003;
        // Reset when too high
        if (arr[idx] > -3.5) {
          arr[idx] = -4.5;
        }
      }
      pos.needsUpdate = true;
      // Pulse opacity
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
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
        size={0.08}
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
// SURFACE HEIGHT SAMPLER - Gets exact Z height from mountain geometry
// This is THE FIX that makes lava "undulate" over ridges and valleys
// ═══════════════════════════════════════════════════════════════════════════════

function getMountainHeight(x: number, y: number, geometry: THREE.PlaneGeometry): number {
  const pos = geometry.attributes.position;
  const width = 16; // Geometry width
  const height = 14; // Geometry height
  const segmentsX = 128; // Geometry X segments
  const segmentsY = 128; // Geometry Y segments
  
  // Convert world XY coordinates to geometry grid indices
  const normalizedX = (x + width / 2) / width; // 0-1 range
  const normalizedY = (y + height / 2) / height; // 0-1 range
  
  // Get grid position with bilinear interpolation for smooth sampling
  const gx = normalizedX * segmentsX;
  const gy = normalizedY * segmentsY;
  
  // Integer indices for the 4 surrounding vertices
  const ix0 = Math.max(0, Math.min(segmentsX - 1, Math.floor(gx)));
  const iy0 = Math.max(0, Math.min(segmentsY - 1, Math.floor(gy)));
  const ix1 = Math.min(segmentsX, ix0 + 1);
  const iy1 = Math.min(segmentsY, iy0 + 1);
  
  // Fractional parts for interpolation
  const fx = gx - ix0;
  const fy = gy - iy0;
  
  // Get Z heights at 4 corners (row-major vertex indexing)
  const stride = segmentsX + 1;
  const z00 = pos.getZ(iy0 * stride + ix0);
  const z10 = pos.getZ(iy0 * stride + ix1);
  const z01 = pos.getZ(iy1 * stride + ix0);
  const z11 = pos.getZ(iy1 * stride + ix1);
  
  // Bilinear interpolation for smooth height
  const z0 = z00 * (1 - fx) + z10 * fx;
  const z1 = z01 * (1 - fx) + z11 * fx;
  const z = z0 * (1 - fy) + z1 * fy;
  
  return z;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAVA PATH - Surface-Aware Undulating Flow
// Paths "cling" to ridges and dip into valleys
// ═══════════════════════════════════════════════════════════════════════════════

interface LavaPathProps {
  color: string;
  score: number;
  isBaseline: boolean;
  otherScore: number;
  geometry: THREE.PlaneGeometry;
}

function LavaPath({ color, score, isBaseline, otherScore, geometry }: LavaPathProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const pipRefs = useRef<THREE.Mesh[]>([]);
  
  const side = isBaseline ? -1 : 1;
  // STRATEGIC DRIFT: The worse the score, the further from optimal center path
  const driftIntensity = (100 - score) * 0.04 * side;
  
  // SURFACE-AWARE FLOW: Sample 100 points along mountain surface
  const curve = useMemo(() => {
    const curvePoints: THREE.Vector3[] = [];
    
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      
      // 1. Calculate the XY trajectory down the slab
      // Both paths START at peak [0, 0] then diverge
      const x = t * 5.5 * side + driftIntensity * Math.sin(t * Math.PI);
      const y = (1 - t) * 5.5; // Flow from peak (y=5.5) toward base (y=0)
      
      // 2. THE FIX: Sample the mountain's actual height at this coordinate
      const z = getMountainHeight(x, y, geometry);
      
      // 3. NORMAL OFFSET: Sit 0.06 units above surface for photorealism
      const surfaceOffset = 0.06;
      
      curvePoints.push(new THREE.Vector3(x, y, z + surfaceOffset));
    }
    
    return new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);
  }, [score, driftIntensity, side, geometry]);
  
  // 3D Tube with high emissive intensity
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 100, 0.04, 8, false);
  }, [curve]);

  // Animate the path glow and kinetic pips
  useFrame((state) => {
    if (tubeRef.current) {
      const material = tubeRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 3.5 + Math.sin(state.clock.elapsedTime * 2.5) * 1;
    }
    
    // Animate kinetic data pips along the curve
    pipRefs.current.forEach((pip, i) => {
      if (pip) {
        const t = ((state.clock.elapsedTime * 0.12 + i * 0.2) % 1);
        const point = curve.getPointAt(t);
        pip.position.copy(point);
        const scale = 1.2 + Math.sin(state.clock.elapsedTime * 5 + i * 2) * 0.4;
        pip.scale.setScalar(scale);
      }
    });
  });

  const pips = useMemo(() => [0, 1, 2, 3, 4, 5], []);

  return (
    <group>
      {/* OUTER BLOOM - Soft atmospheric glow */}
      <mesh geometry={new THREE.TubeGeometry(curve, 100, 0.15, 8, false)}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      
      {/* MAIN LAVA TUBE - High-velocity neon glow (emissiveIntensity: 5) */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
      
      {/* WHITE HOT CORE - Plasma conduit center */}
      <mesh geometry={new THREE.TubeGeometry(curve, 100, 0.015, 8, false)}>
        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
        />
      </mesh>
      
      {/* KINETIC DATA PIPS - Velocity particles */}
      {pips.map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) pipRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={5}
            toneMapped={false}
          />
        </mesh>
      ))}
      
      {/* PROBABILITY FAN - Monte Carlo uncertainty spread */}
      <ProbabilityFan color={color} score={score} isBaseline={isBaseline} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DESTINY FIELD - The Volumetric Refractive Slab
// 256x256 subdivisions with radial peak and Simplex ridges
// ═══════════════════════════════════════════════════════════════════════════════

interface UnifiedFieldProps {
  scenarioA: { score: number; arr: number };
  scenarioB: { score: number; arr: number };
  laserX: number | null;
}

function UnifiedDestinyField({ scenarioA, scenarioB, laserX }: UnifiedFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate proper MOUNTAIN geometry - cone-like peak
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(16, 14, 128, 128);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Distance from center (where peak will be)
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = 8.0;
      
      // MOUNTAIN PEAK - Cone shape that rises to a point
      const normalized = Math.max(0, 1.0 - dist / maxDist);
      const peakHeight = Math.pow(normalized, 1.8) * 6.0; // Sharp peak, 6 units tall
      
      // Add some ridge noise for texture
      const ridge = noise2D(x * 0.3, y * 0.3) * 0.4 * normalized;
      
      // Set Z as the height (plane is XY, Z is up)
      pos.setZ(i, peakHeight + ridge);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -2, 2]}>
      {/* SOLID MOUNTAIN BASE - Dark core */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#0a1828"
          roughness={0.4}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* GLASS SURFACE LAYER */}
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <MeshTransmissionMaterial
          transmission={0.4}
          thickness={1.5}
          roughness={0.15}
          chromaticAberration={0.03}
          color="#1a3050"
          backside={false}
        />
      </mesh>

      {/* GLOWING WIREFRAME GRID */}
      <mesh geometry={geometry} position={[0, 0, 0.05]}>
        <meshBasicMaterial
          wireframe
          color="#00D9FF"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* CONVERGENCE POINT - "YOU ARE HERE" - Summit where both paths begin
          Both paths start at peak [0, 5.5] which is maximum potential */}
      <group position={[0, 5.5, getMountainHeight(0, 5.5, geometry) + 0.2]}>
        {/* Core sphere */}
        <mesh>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={5}
            toneMapped={false}
          />
        </mesh>
        {/* Inner glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Outer pulse ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.6, 32]} />
          <meshBasicMaterial color="#00D9FF" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Vertical beacon */}
        <mesh position={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.015, 0.015, 1.5, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      </group>
      
      {/* THE LAVA RIVERS - Strategic Divergence Visualization
          Both paths START at the convergence point (current state)
          Then DIVERGE based on where each strategy leads
          Higher score = stays higher on mountain = better outcome */}
      <LavaPath 
        color="#00D9FF" 
        score={scenarioA.score} 
        otherScore={scenarioB.score}
        isBaseline={true}
        geometry={geometry} 
      />
      <LavaPath 
        color="#F59E0B" 
        score={scenarioB.score}
        otherScore={scenarioA.score}
        isBaseline={false}
        geometry={geometry} 
      />
      
      {/* DIVERGENCE GAP INDICATOR - Shows the strategic delta */}
      {Math.abs(scenarioA.score - scenarioB.score) > 3 && (
        <mesh position={[0, 3, 2]}>
          <planeGeometry args={[0.05, 3]} />
          <meshBasicMaterial 
            color={scenarioA.score > scenarioB.score ? "#00D9FF" : "#F59E0B"} 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* LASER SLICER - Vertical light beam following cursor */}
      {laserX !== null && (
        <mesh position={[laserX * 6 - 3, 0, 2.5]}>
          <boxGeometry args={[0.02, 12, 5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* LIGHTING FOR MOUNTAIN */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 8]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[-5, 3, 3]} intensity={4} color="#00D9FF" distance={15} decay={2} />
      <pointLight position={[5, 3, 3]} intensity={4} color="#F59E0B" distance={15} decay={2} />
      <pointLight position={[0, 8, 0]} intensity={2} color="#ffffff" distance={20} decay={2} />
      
      <Environment preset="night" />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELTA BLADE HUD - Surgical precision tooltip
// ═══════════════════════════════════════════════════════════════════════════════

interface DeltaBladeProps {
  month: number;
  valA: number;
  valB: number;
  position: { x: number; y: number };
}

function DeltaBlade({ month, valA, valB, position }: DeltaBladeProps) {
  const delta = valB - valA;
  const isOptimal = delta >= 0;
  const divergence = valA > 0 ? ((delta / valA) * 100) : 0;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: position.x + 24, top: position.y - 80 }}
    >
      {/* Vertical laser line */}
      <div 
        className="absolute left-[-12px] top-0 w-[1px] h-[160px] bg-gradient-to-b from-white via-white/50 to-transparent"
        style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
      />
      
      <div className="bg-black/95 border border-white/20 p-4 backdrop-blur-xl rounded-lg shadow-2xl min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">
            Month {month + 1}
          </div>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
        
        {/* Values */}
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black text-white tracking-tight">
            ${valB.toFixed(1)}M
          </div>
          <div className={`text-sm font-bold ${isOptimal ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOptimal ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)}M
          </div>
        </div>
        
        {/* Separator */}
        <div className="mt-3 h-[1px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Divergence */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[10px] text-white/50 uppercase tracking-wider">Strategic Divergence</div>
          <div className={`text-sm font-bold ${Math.abs(divergence) > 10 ? 'text-amber-400' : 'text-white/70'}`}>
            {divergence > 0 ? '+' : ''}{divergence.toFixed(1)}%
          </div>
        </div>
        
        {/* ARR Breakdown */}
        <div className="mt-2 flex gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-white/50">A:</span>
            <span className="text-white/80">${valA.toFixed(2)}M</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-white/50">B:</span>
            <span className="text-white/80">${valB.toFixed(2)}M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TITANIUM COMMAND BRIDGE - Split bezel header with wet glass highlights
// ═══════════════════════════════════════════════════════════════════════════════

interface TitaniumBridgeProps {
  scenarioA: { arr: number; survival: number; runway: number; score: number };
  scenarioB: { arr: number; survival: number; runway: number; score: number };
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
      {/* Titanium texture bar with wet glass highlights */}
      <div 
        className="mx-4 mt-4 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(30,35,45,0.95) 0%, rgba(15,18,25,0.98) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Wet glass highlight strip */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 80%, transparent)' }}
        />
        
        <div className="flex items-stretch">
          {/* Scenario A - Cyan Anchor */}
          <div className="flex-1 px-6 py-4 border-r border-cyan-500/20 relative">
            <div 
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(180deg, #00D9FF 0%, #0891b2 100%)' }}
            />
            <div className="text-[10px] font-bold tracking-[0.15em] text-cyan-400 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
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

          {/* Delta Badge - Center */}
          <div className="px-6 py-4 flex flex-col items-center justify-center bg-black/30 min-w-[120px]">
            <div className="text-[9px] text-white/40 tracking-[0.2em] mb-1">DELTA</div>
            <div 
              className={`text-3xl font-black tracking-tight ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ textShadow: scoreDelta >= 0 ? '0 0 20px rgba(16,185,129,0.5)' : '0 0 20px rgba(239,68,68,0.5)' }}
            >
              {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
            </div>
            <div className="text-[8px] text-white/30 mt-1">STRATEGIC SHIFT</div>
          </div>

          {/* Scenario B - Amber Anchor */}
          <div className="flex-1 px-6 py-4 border-l border-amber-500/20 relative">
            <div 
              className="absolute right-0 top-0 bottom-0 w-1"
              style={{ background: 'linear-gradient(180deg, #F59E0B 0%, #d97706 100%)' }}
            />
            <div className="text-[10px] font-bold tracking-[0.15em] text-amber-400 mb-2 flex items-center gap-2 justify-end">
              EXPLORATION PATH
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
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
// STRATEGIC AUTOPILOT PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function StrategicAutopilotPanel({ scenarioA, scenarioB }: { scenarioA: ScenarioData; scenarioB: ScenarioData }) {
  const verdict = useMemo(() => getStrategicVerdict(scenarioA, scenarioB), [scenarioA, scenarioB]);

  return (
    <div 
      className="absolute bottom-4 right-4 w-80 overflow-hidden z-10"
      style={{
        background: 'linear-gradient(180deg, rgba(20,25,35,0.95) 0%, rgba(10,12,18,0.98) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs">
          ⚡
        </div>
        <span className="text-[10px] font-bold tracking-[0.15em] text-white/60">STRATEGIC AUTOPILOT</span>
      </div>
      
      {/* Verdict Badge */}
      <div className="p-4">
        <div 
          className="inline-block px-4 py-2 rounded-lg text-xs font-black tracking-wider mb-3"
          style={{ 
            backgroundColor: `${verdict.color}15`, 
            color: verdict.color,
            border: `1px solid ${verdict.color}30`,
            boxShadow: `0 0 20px ${verdict.color}20`
          }}
        >
          {verdict.verdict}
        </div>
        
        {/* Analysis */}
        <p className="text-xs text-white/80 leading-relaxed mb-4">
          {verdict.analysis}
        </p>
        
        {/* Recommendation */}
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModeCompare() {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; month: number; normalizedX: number } | null>(null);

  // Get simulation data
  const summary = useSimulationStore((s) => s.summary);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find((sim) => sim.isBaseline));

  // Scenario data
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
    const y = e.clientY - rect.top;
    const normalizedX = x / rect.width;
    const month = Math.floor(normalizedX * 36);
    if (month >= 0 && month < 36) {
      setHoverData({ x, y, month, normalizedX });
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden" style={{ background: 'linear-gradient(180deg, #050810 0%, #0a0e18 50%, #050810 100%)' }}>
      {/* Titanium Command Bridge Header */}
      <TitaniumCommandBridge scenarioA={scenarioA} scenarioB={scenarioB} />

      {/* 3D Canvas */}
      <div
        className="absolute inset-0 pt-28"
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <Canvas
          camera={{ position: [0, 12, 18], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#080c14']} />
            <fog attach="fog" args={['#080c14', 20, 50]} />
            
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1.0} color="#ffffff" />
            <spotLight position={[0, 20, 5]} intensity={1.5} angle={0.5} penumbra={0.5} color="#ffffff" />

            <Float speed={0.3} rotationIntensity={0.02} floatIntensity={0.05}>
              <UnifiedDestinyField 
                scenarioA={scenarioA} 
                scenarioB={scenarioB} 
                laserX={hoverData?.normalizedX ?? null}
              />
            </Float>
            
            {/* ORBIT CONTROLS - Drag to rotate the mountain 360° */}
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              rotateSpeed={0.8}
              zoomSpeed={0.5}
              minDistance={10}
              maxDistance={35}
              minPolarAngle={Math.PI / 6}      // Don't go below horizon
              maxPolarAngle={Math.PI / 2.2}    // Don't flip upside down
              minAzimuthAngle={-Math.PI / 2}   // 90° left
              maxAzimuthAngle={Math.PI / 2}    // 90° right
              autoRotate={false}
              makeDefault
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Delta Blade HUD - Surgical tooltip */}
      {hoverData && (
        <DeltaBlade
          month={hoverData.month}
          valA={trajectoryA[hoverData.month] || 0}
          valB={trajectoryB[hoverData.month] || 0}
          position={{ x: hoverData.x, y: hoverData.y }}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-6 z-10">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(0,217,255,0.8)]" />
          <span className="text-white/80 text-xs font-medium">Baseline (A)</span>
        </div>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          <span className="text-white/80 text-xs font-medium">Exploration (B)</span>
        </div>
      </div>

      {/* Strategic Autopilot Panel */}
      <StrategicAutopilotPanel scenarioA={scenarioA} scenarioB={scenarioB} />
      
      {/* Scan line effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-30 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,217,255,0.1) 2px, rgba(0,217,255,0.1) 4px)',
        }}
      />
    </div>
  );
}
