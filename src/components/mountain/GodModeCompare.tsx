// src/components/mountain/GodModeCompare.tsx
// GOD MODE COMPARE: Unified Destiny Field with Titanium Command Bridge
// Single refractive glass slab with internal Lava Rivers

import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';

// ═══════════════════════════════════════════════════════════════════════════════
// LAVA PATH - Internal Emissive Flow
// ═══════════════════════════════════════════════════════════════════════════════

interface LavaPathProps {
  color: string;
  score: number;
  direction: number; // -1 for left, 1 for right
}

function LavaPath({ color, score, direction }: LavaPathProps) {
  const ref = useRef<THREE.Mesh>(null);
  const drift = (100 - score) / 100;
  
  // Animate the path flow
  useFrame((state) => {
    if (ref.current) {
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });
  
  // Generate path curve from peak down the slope
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const x = direction * (t * 3 + drift * t * 2);
      const y = -4 + t * 8; // From bottom to near top
      // Calculate Z based on mountain surface (simplified radial)
      const dist = Math.sqrt(x * x + (y - 2) * (y - 2));
      const radial = Math.pow(Math.max(0, 1.0 - dist / 6.0), 2.2);
      const z = radial * 4.2 + 0.1; // Slightly above surface
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [direction, drift]);
  
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
  }, [curve]);

  return (
    <mesh ref={ref} geometry={tubeGeometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DESTINY FIELD - The Titanium Slab
// ═══════════════════════════════════════════════════════════════════════════════

interface UnifiedFieldProps {
  scenarioA: { score: number; arr: number };
  scenarioB: { score: number; arr: number };
}

function UnifiedDestinyField({ scenarioA, scenarioB }: UnifiedFieldProps) {
  // Generate the "Titanium Slab" geometry with radial peak
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 10, 128, 128);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // RADIAL PEAK LOGIC: Force the center into a sharp peak
      const dist = Math.sqrt(x * x + y * y);
      const radial = Math.pow(Math.max(0, 1.0 - dist / 6.0), 2.2);
      
      // Topographic ridges based on combined scenario scores
      const avgScore = (scenarioA.score + scenarioB.score) / 200;
      const noise = (Math.sin(x * 1.5) * Math.cos(y * 1.5)) * 0.5 * avgScore;
      
      pos.setZ(i, (radial * 4.2) + (noise * radial));
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [scenarioA.score, scenarioB.score]);

  return (
    <group rotation={[-Math.PI / 2.6, 0, 0]} position={[0, -1, 0]}>
      {/* THE REFRACTIVE GLASS CHASSIS */}
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          transmission={0.98}
          thickness={5.0} // Thick aerospace glass
          roughness={0.08}
          chromaticAberration={0.12} // PRISM EFFECT
          anisotropy={0.4}
          distortion={0.3}
          color="#0d111a"
          backside={true} // Crucial for internal path refraction
        />
      </mesh>

      {/* THE NEURAL WIREFRAME (Etched Data) */}
      <mesh geometry={geometry} position={[0, 0, 0.03]}>
        <meshStandardMaterial
          wireframe
          color="#00D9FF"
          transparent
          opacity={0.2}
          emissive="#00D9FF"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* THE LAVA RIVERS (Internal Emissive Paths) */}
      <LavaPath color="#00D9FF" score={scenarioA.score} direction={-1} />
      <LavaPath color="#F59E0B" score={scenarioB.score} direction={1} />

      <Environment preset="city" />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELTA BLADE HUD
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

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: position.x + 20, top: position.y - 60 }}
    >
      <div className="bg-black/90 border border-white/20 p-4 backdrop-blur-xl rounded-lg shadow-2xl">
        <div className="text-[9px] uppercase tracking-widest text-white/40">
          Month {month} Variance
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-2xl font-bold text-white">${valB.toFixed(1)}M</div>
          <div className={`text-xs ${isOptimal ? 'text-cyan-400' : 'text-amber-500'}`}>
            {isOptimal ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)}M
          </div>
        </div>
        <div className="mt-2 h-[1px] w-full bg-white/10" />
        <div className="text-[10px] text-white/50 mt-2">
          STRATEGIC DIVERGENCE: {valA > 0 ? ((delta / valA) * 100).toFixed(1) : '0.0'}%
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI COMPARISON BAR
// ═══════════════════════════════════════════════════════════════════════════════

interface KPIBarProps {
  scenarioA: { arr: number; survival: number; runway: number; score: number };
  scenarioB: { arr: number; survival: number; runway: number; score: number };
}

function KPIComparisonBar({ scenarioA, scenarioB }: KPIBarProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const scoreDelta = scenarioB.score - scenarioA.score;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-stretch gap-0 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
        {/* Scenario A */}
        <div className="px-5 py-3 border-r border-cyan-500/20">
          <div className="text-[9px] font-bold tracking-widest text-cyan-400 mb-2">BASELINE (A)</div>
          <div className="flex gap-4 text-sm">
            <div><span className="text-white/40 text-xs">ARR</span> <span className="text-white font-semibold">{formatCurrency(scenarioA.arr)}</span></div>
            <div><span className="text-white/40 text-xs">Survival</span> <span className="text-white font-semibold">{scenarioA.survival.toFixed(0)}%</span></div>
            <div><span className="text-white/40 text-xs">Score</span> <span className="text-cyan-400 font-bold">{scenarioA.score}</span></div>
          </div>
        </div>

        {/* Delta Badge */}
        <div className="px-4 py-3 flex flex-col items-center justify-center bg-white/5">
          <div className="text-[8px] text-white/40 tracking-widest">DELTA</div>
          <div className={`text-xl font-black ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
          </div>
        </div>

        {/* Scenario B */}
        <div className="px-5 py-3 border-l border-amber-500/20">
          <div className="text-[9px] font-bold tracking-widest text-amber-400 mb-2">EXPLORATION (B)</div>
          <div className="flex gap-4 text-sm">
            <div><span className="text-white/40 text-xs">ARR</span> <span className="text-white font-semibold">{formatCurrency(scenarioB.arr)}</span></div>
            <div><span className="text-white/40 text-xs">Survival</span> <span className="text-white font-semibold">{scenarioB.survival.toFixed(0)}%</span></div>
            <div><span className="text-white/40 text-xs">Score</span> <span className="text-amber-400 font-bold">{scenarioB.score}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModeCompare() {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; month: number } | null>(null);

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

  const handleCanvasMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const month = Math.floor((x / rect.width) * 36);
    if (month >= 0 && month < 36) {
      setHoverData({ x: e.clientX - rect.left, y: e.clientY - rect.top, month });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#050810] overflow-hidden">
      {/* KPI Comparison Bar */}
      <KPIComparisonBar scenarioA={scenarioA} scenarioB={scenarioB} />

      {/* 3D Canvas */}
      <div
        className="absolute inset-0"
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <Canvas
          camera={{ position: [0, 8, 12], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 20, 10]} intensity={0.8} />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#00D9FF" />

            <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
              <UnifiedDestinyField scenarioA={scenarioA} scenarioB={scenarioB} />
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* Delta Blade HUD */}
      {hoverData && (
        <DeltaBlade
          month={hoverData.month}
          valA={trajectoryA[hoverData.month] || 0}
          valB={trajectoryB[hoverData.month] || 0}
          position={{ x: hoverData.x, y: hoverData.y }}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
          <span className="text-white/70 text-xs">Baseline (A)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <span className="text-white/70 text-xs">Exploration (B)</span>
        </div>
      </div>

      {/* Strategic Autopilot Panel */}
      <div className="absolute bottom-4 right-4 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎯</span>
          <span className="text-[10px] font-bold tracking-widest text-white/60">STRATEGIC AUTOPILOT</span>
        </div>
        <div className={`inline-block px-3 py-1 rounded text-xs font-bold mb-2 ${
          scenarioB.score >= scenarioA.score
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {scenarioB.score >= scenarioA.score ? 'OPTIMAL ASCENT' : 'CRITICAL DIVERGENCE'}
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {scenarioB.score >= scenarioA.score
            ? 'Exploration scenario shows improved trajectory. Consider locking as new baseline.'
            : 'Both growth and stability declining. Revert to baseline immediately.'}
        </p>
      </div>
    </div>
  );
}

