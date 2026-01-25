// src/components/mountain/GodModeCompare.tsx
// GOD MODE COMPARE: Unified Destiny Field with Titanium Command Bridge
// Volumetric Refractive Slab - Data flows THROUGH the core, not on top

import React, { useMemo, useRef, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
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
  direction: number;
}

function ProbabilityFan({ color, score, direction }: ProbabilityFanProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  // Generate fan particles representing Monte Carlo uncertainty
  const { positions, scales } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    const uncertainty = (100 - score) / 100; // Higher uncertainty = wider spread
    
    for (let i = 0; i < count; i++) {
      // Fan out at the base of the mountain
      const spread = (Math.random() - 0.5) * 3 * uncertainty;
      const baseX = direction * 3 + spread;
      const baseY = -4.5 + Math.random() * 0.5;
      const baseZ = Math.random() * 0.3;
      
      pos[i * 3] = baseX;
      pos[i * 3 + 1] = baseY;
      pos[i * 3 + 2] = baseZ;
      scl[i] = 0.03 + Math.random() * 0.05;
    }
    
    return { positions: pos, scales: scl };
  }, [score, direction]);

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
// LAVA PATH - Internal Emissive Flow with Surface Snapping
// ═══════════════════════════════════════════════════════════════════════════════

interface LavaPathProps {
  color: string;
  score: number;
  direction: number;
  geometry: THREE.PlaneGeometry;
}

function LavaPath({ color, score, direction, geometry }: LavaPathProps) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const pipRefs = useRef<THREE.Mesh[]>([]);
  const drift = (100 - score) / 100;
  
  // Generate path curve snapped to surface topology
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const pos = geometry.attributes.position;
    
    for (let t = 0; t <= 1; t += 0.015) {
      const x = direction * (t * 3.5 + drift * t * 2.5);
      const y = -4.5 + t * 9;
      
      // Sample Z from geometry using raycasting logic (simplified)
      const dist = Math.sqrt(x * x + (y - 0.5) * (y - 0.5));
      const radialBase = Math.max(0, 1.0 - dist / 6.0);
      const peakShape = Math.pow(radialBase, 2.5);
      const ridgeDetail = noise2D(x * 0.5, y * 0.5) * 0.6;
      const z = (peakShape * 4.5) + (ridgeDetail * peakShape) - 0.05; // Slightly inside surface
      
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [direction, drift, geometry]);
  
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 80, 0.05, 8, false);
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
      {/* ULTRA WIDE GLOW - Outer atmosphere */}
      <mesh geometry={new THREE.TubeGeometry(curve, 80, 0.35, 8, false)}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          toneMapped={false}
        />
      </mesh>
      
      {/* Wide glow aura */}
      <mesh geometry={new THREE.TubeGeometry(curve, 80, 0.22, 8, false)}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.2}
          toneMapped={false}
        />
      </mesh>
      
      {/* Internal core path - BRIGHT AND VISIBLE */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={6}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>
      
      {/* White hot center core */}
      <mesh geometry={new THREE.TubeGeometry(curve, 80, 0.025, 8, false)}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
      
      {/* Kinetic data pips - velocity indicators */}
      {pips.map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { if (el) pipRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={10}
            toneMapped={false}
          />
        </mesh>
      ))}
      
      {/* Probability Fan at base */}
      <ProbabilityFan color={color} score={score} direction={direction} />
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
  
  // Generate the "Topographic Slab" geometry - HIGH RES 256x256
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 10, 256, 256);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // 1. Calculate distance from peak center
      const dist = Math.sqrt(x * x + y * y);
      
      // 2. HIGH-POWER RADIAL FALLOFF - Creates the "Slab Peak" not dome
      const radialBase = Math.max(0, 1.0 - dist / 6.0);
      const peakShape = Math.pow(radialBase, 2.5);
      
      // 3. SIMPLEX RIDGE DETAIL - Only where peak exists
      const ridgeDetail = noise2D(x * 0.5, y * 0.5) * 0.6;
      
      // 4. Combined height - peak + ridges scaled by peak shape
      pos.setZ(i, (peakShape * 4.5) + (ridgeDetail * peakShape));
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
    <group ref={groupRef} rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -0.8, 0]}>
      {/* SOLID BASE LAYER - Ensures mountain is always visible */}
      <mesh geometry={geometry} position={[0, 0, -0.05]}>
        <meshStandardMaterial
          color="#0a1525"
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* THE MACHINED AEROSPACE GLASS CHASSIS */}
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          transmission={0.7} // Reduced for better visibility
          thickness={2.5} // Reduced for clearer rendering
          roughness={0.1}
          chromaticAberration={0.06} // Subtle prism effect
          anisotropy={0.2}
          distortion={0.2}
          distortionScale={0.2}
          temporalDistortion={0.05}
          color="#0d1a2a" // Slightly lighter for visibility
          backside={true}
        />
      </mesh>

      {/* SURFACE HIGHLIGHT - Emissive edge glow */}
      <mesh geometry={geometry} position={[0, 0, 0.01]}>
        <meshStandardMaterial
          color="#1a3050"
          transparent
          opacity={0.3}
          emissive="#0a2040"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* INTERNAL ETCHING - Wireframe overlay */}
      <mesh geometry={geometry} position={[0, 0, 0.03]}>
        <meshStandardMaterial
          wireframe
          color="#00D9FF"
          transparent
          opacity={0.25}
          emissive="#00D9FF"
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* THE LAVA RIVERS - Internal emissive paths */}
      <LavaPath color="#00D9FF" score={scenarioA.score} direction={-1} geometry={geometry} />
      <LavaPath color="#F59E0B" score={scenarioB.score} direction={1} geometry={geometry} />

      {/* LASER SLICER - Vertical light beam following cursor */}
      {laserX !== null && (
        <mesh position={[laserX * 6 - 3, 0, 2.5]}>
          <boxGeometry args={[0.02, 12, 5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      <Environment preset="night" />
      
      {/* Enhanced lighting for visibility */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[0, 10, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-4, 2, 4]} intensity={3} color="#00D9FF" distance={12} decay={2} />
      <pointLight position={[4, 2, 4]} intensity={3} color="#F59E0B" distance={12} decay={2} />
      <pointLight position={[0, 5, 2]} intensity={2} color="#ffffff" distance={15} decay={2} />
      {/* Rim light for definition */}
      <spotLight position={[0, 8, -5]} intensity={1.5} angle={0.5} penumbra={0.8} color="#00aaff" />
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
          camera={{ position: [0, 7, 14], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#050810']} />
            <fog attach="fog" args={['#050810', 15, 35]} />
            
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 20, 10]} intensity={0.6} />
            <spotLight position={[0, 15, 0]} intensity={1} angle={0.4} penumbra={0.5} color="#ffffff" />

            <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.1}>
              <UnifiedDestinyField 
                scenarioA={scenarioA} 
                scenarioB={scenarioB} 
                laserX={hoverData?.normalizedX ?? null}
              />
            </Float>
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
