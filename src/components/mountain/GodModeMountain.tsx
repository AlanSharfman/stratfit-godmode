// src/components/mountain/GodModeMountain.tsx
// STRATFIT — TRUE GOD MODE (Gemini-Corrected Implementation)
// Single mountain with radial peak + surface-conforming lava rivers

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Sparkles,
  Html,
  OrbitControls,
  Line
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import './GodModeMountain.css';

const noise2D = createNoise2D();

// ═══════════════════════════════════════════════════════════════════════════════
// DELTA NARRATIVE ENGINE - AI Strategic Analysis
// ═══════════════════════════════════════════════════════════════════════════════

interface ScenarioData {
  arr: number;
  survival: number;
  runway: number;
  cash: number;
  score: number;
}

interface Briefing {
  verdict: string;
  verdictColor: string;
  analysis: string;
  recommendation: string;
}

export const generateBriefing = (scenarioA: ScenarioData, scenarioB: ScenarioData): Briefing => {
  const arrDelta = ((scenarioB.arr - scenarioA.arr) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;
  const scoreDelta = scenarioB.score - scenarioA.score;

  if (arrDelta > 30 && survivalDelta < -20) {
    return {
      verdict: "HIGH-STAKES AGGRESSION",
      verdictColor: "#ef4444",
      analysis: `Scenario B accelerates ARR by ${arrDelta.toFixed(0)}%, but creates a 'Survival Gap' of ${Math.abs(survivalDelta).toFixed(0)} points. This is a high-risk trajectory.`,
      recommendation: "Consider staggered hiring intensity to recover 12 months of runway before committing."
    };
  }

  if (arrDelta > 5 && survivalDelta >= 0) {
    return {
      verdict: "OPTIMAL ASCENT",
      verdictColor: "#10b981",
      analysis: "You have found a growth vector that increases revenue without compromising stability. This is the ideal strategic corridor.",
      recommendation: "Lock this configuration as your new Baseline Trajectory."
    };
  }

  if (arrDelta < -10 && survivalDelta > 15) {
    return {
      verdict: "DEFENSIVE RETREAT",
      verdictColor: "#3b82f6",
      analysis: `Trading ${Math.abs(arrDelta).toFixed(0)}% ARR for ${survivalDelta.toFixed(0)} points of survival. This extends runway but sacrifices momentum.`,
      recommendation: "Acceptable for bridge periods. Set a 6-month review trigger."
    };
  }

  if (arrDelta < -5 && survivalDelta < -10) {
    return {
      verdict: "CRITICAL DIVERGENCE",
      verdictColor: "#dc2626",
      analysis: "Both growth and stability are declining. This trajectory leads to accelerated runway depletion.",
      recommendation: "Revert to Baseline immediately. Review Cost Discipline and Market Volatility levers."
    };
  }

  return {
    verdict: "MARGINAL VARIANCE",
    verdictColor: "#fbbf24",
    analysis: "Strategic divergence is minimal. Current lever shifts do not significantly alter the long-term mountain profile.",
    recommendation: "Explore more aggressive Pricing Power or Demand Strength adjustments."
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Get terrain height at any XY point
// ═══════════════════════════════════════════════════════════════════════════════

const getTerrainHeight = (x: number, y: number): number => {
  const dist = Math.sqrt(x * x + y * y);
  const radial = Math.max(0, 1 - dist / 5);
  const noise = noise2D(x * 0.5, y * 0.5) * 0.3;
  return (radial * 3.5) + (noise * radial);
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAVA RIVER COMPONENT - Surface-conforming path
// ═══════════════════════════════════════════════════════════════════════════════

interface LavaRiverProps {
  color: string;
  score: number;
  side: 'left' | 'right';
}

function LavaRiver({ color, score, side }: LavaRiverProps) {
  
  // Calculate drift based on score - lower score = more lateral drift
  const driftMultiplier = (100 - score) / 100;
  const sideMultiplier = side === 'left' ? -1 : 1;
  
  // Generate path points that conform to mountain surface
  const points = useMemo(() => {
    const pathPoints: THREE.Vector3[] = [];
    const steps = 60;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 to 1 (peak to base)
      
      // Y position: from peak (0) to base (-4.5)
      const y = -t * 4.5;
      
      // X position: starts at center, drifts based on score
      // More drift as we go down the mountain
      const baseDrift = t * t * 2.5; // Quadratic drift
      const scoreDrift = baseDrift * driftMultiplier * 0.5;
      const x = (baseDrift + scoreDrift) * sideMultiplier;
      
      // Z position: query the terrain height at this XY
      const z = getTerrainHeight(x, y) + 0.05; // Slight offset above surface
      
      pathPoints.push(new THREE.Vector3(x, y, z));
    }
    
    return pathPoints;
  }, [score, driftMultiplier, sideMultiplier]);
  
  // Convert points to array format for drei Line
  const pointsArray = useMemo(() => {
    return points.map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [points]);

  return (
    <>
      {/* Glow layer */}
      <Line
        points={pointsArray}
        color={color}
        transparent
        opacity={0.3}
        lineWidth={4}
      />
      
      {/* Core line */}
      <Line
        points={pointsArray}
        color={color}
        transparent
        opacity={0.9}
        lineWidth={2}
        dashed
        dashSize={0.15}
        gapSize={0.08}
      />
      
      {/* Animated particles along path */}
      <PathParticles points={points} color={color} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH PARTICLES - Glowing dots flowing along the lava river
// ═══════════════════════════════════════════════════════════════════════════════

interface PathParticlesProps {
  points: THREE.Vector3[];
  color: string;
}

function PathParticles({ points, color }: PathParticlesProps) {
  const particlesRef = useRef<THREE.Group>(null!);
  const particleCount = 5;
  
  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    particlesRef.current.children.forEach((particle, i) => {
      // Each particle at different phase
      const phase = (t * 0.3 + i * 0.2) % 1;
      const index = Math.floor(phase * (points.length - 1));
      const nextIndex = Math.min(index + 1, points.length - 1);
      const localT = (phase * (points.length - 1)) % 1;
      
      // Interpolate between points
      const pos = new THREE.Vector3().lerpVectors(points[index], points[nextIndex], localT);
      particle.position.copy(pos);
      
      // Pulse size
      const scale = 0.8 + Math.sin(t * 4 + i) * 0.3;
      particle.scale.setScalar(scale);
    });
  });

  return (
    <group ref={particlesRef}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEACON PULSE - Peak milestone light
// ═══════════════════════════════════════════════════════════════════════════════

function BeaconPulse() {
  const lightRef = useRef<THREE.PointLight>(null!);
  
  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.getElapsedTime();
    lightRef.current.intensity = Math.sin(t * 4) * 1.5 + 3;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 4]}
      color="#ffffff"
      distance={10}
      decay={2}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MOUNTAIN SCENE
// ═══════════════════════════════════════════════════════════════════════════════

interface MountainSceneProps {
  scenarioA: ScenarioData;
  scenarioB: ScenarioData;
}

function MountainScene({ scenarioA, scenarioB }: MountainSceneProps) {
  // Generate the displaced mountain geometry ONCE
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, 128, 128);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Use the same height function
      const z = getTerrainHeight(x, y);
      pos.setZ(i, z);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      {/* ENVIRONMENT - Critical for glass reflections */}
      <Environment preset="city" />
      
      {/* LIGHTING */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <BeaconPulse />
      
      {/* FOG for depth */}
      <fog attach="fog" args={['#0a1628', 8, 25]} />
      
      {/* THE MOUNTAIN GROUP */}
      <group rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
        
        {/* THE HOLOGRAPHIC GLASS SLAB */}
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            backside
            samples={16}
            resolution={512}
            transmission={0.92}
            roughness={0.08}
            thickness={3.5}
            chromaticAberration={0.03}
            anisotropy={0.3}
            distortion={0.08}
            distortionScale={0.2}
            color="#0a1a2a"
            attenuationColor="#00aaff"
            attenuationDistance={5}
          />
        </mesh>
        
        {/* THE DATA WIREFRAME (Etched Look) */}
        <mesh geometry={geometry} position={[0, 0, 0.02]}>
          <meshStandardMaterial
            wireframe
            transparent
            opacity={0.12}
            color="#00D9FF"
            emissive="#00D9FF"
            emissiveIntensity={1.5}
          />
        </mesh>
        
        {/* LAVA RIVERS */}
        <LavaRiver color="#00D9FF" score={scenarioA.score} side="left" />
        <LavaRiver color="#F59E0B" score={scenarioB.score} side="right" />
        
        {/* PEAK MARKER */}
        <mesh position={[0, 0, 3.6]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        {/* DIVERGENCE SPARKLES at split zone */}
        <Sparkles
          count={40}
          scale={[6, 6, 2]}
          position={[0, -2, 1.5]}
          size={2}
          speed={0.3}
          color="#ffffff"
        />
      </group>
      
      {/* POST-PROCESSING */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          intensity={1.2}
        />
      </EffectComposer>
      
      {/* CAMERA CONTROLS */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={20}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModeMountain() {
  // Get real data from stores
  const summary = useSimulationStore((s) => s.summary);
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
  
  // Scenario data
  const scenarioA: ScenarioData = useMemo(() => {
    if (savedBaseline) {
      return {
        arr: savedBaseline.summary.arrMedian,
        survival: savedBaseline.summary.survivalRate * 100,
        runway: savedBaseline.summary.runwayMedian,
        cash: savedBaseline.summary.cashMedian,
        score: savedBaseline.summary.overallScore,
      };
    }
    return { arr: 1900000, survival: 75, runway: 16, cash: 4200000, score: 65 };
  }, [savedBaseline]);
  
  const scenarioB: ScenarioData = useMemo(() => {
    if (summary) {
      return {
        arr: summary.arrMedian,
        survival: summary.survivalRate * 100,
        runway: summary.runwayMedian,
        cash: summary.cashMedian,
        score: summary.overallScore,
      };
    }
    return { arr: 2400000, survival: 82, runway: 20, cash: 4800000, score: 78 };
  }, [summary]);
  
  // Generate AI briefing
  const briefing = useMemo(() => generateBriefing(scenarioA, scenarioB), [scenarioA, scenarioB]);
  
  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };
  
  const scoreDelta = scenarioB.score - scenarioA.score;

  return (
    <div className="godmode-container">
      {/* ═══════════════════════════════════════════════════════════════════
          TITANIUM COMMAND BRIDGE (Header)
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="titanium-bridge">
        <div className="bridge-wet-glass" />
        <div className="bridge-split-border">
          <div className="border-cyan" />
          <div className="border-amber" />
        </div>
        
        <div className="bridge-content">
          {/* LEFT: Baseline Metrics */}
          <div className="bridge-section baseline">
            <span className="section-tag">BASELINE (A)</span>
            <div className="metrics-row">
              <div className="metric">
                <span className="metric-label">ARR</span>
                <span className="metric-value">{formatCurrency(scenarioA.arr)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Survival</span>
                <span className="metric-value">{scenarioA.survival.toFixed(0)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Runway</span>
                <span className="metric-value">{scenarioA.runway.toFixed(0)} Mo</span>
              </div>
              <div className="metric">
                <span className="metric-label">Score</span>
                <span className="metric-value cyan">{scenarioA.score.toFixed(0)}</span>
              </div>
            </div>
          </div>
          
          {/* CENTER: Divergence Badge */}
          <div className="bridge-delta">
            <span className="delta-label">DIVERGENCE</span>
            <span className="delta-value" style={{ color: briefing.verdictColor }}>
              {scoreDelta >= 0 ? '+' : ''}{scoreDelta.toFixed(0)} pts
            </span>
          </div>
          
          {/* RIGHT: Exploration Metrics */}
          <div className="bridge-section current">
            <span className="section-tag">EXPLORATION (B)</span>
            <div className="metrics-row">
              <div className="metric">
                <span className="metric-label">ARR</span>
                <span className="metric-value">{formatCurrency(scenarioB.arr)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Survival</span>
                <span className="metric-value">{scenarioB.survival.toFixed(0)}%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Runway</span>
                <span className="metric-value">{scenarioB.runway.toFixed(0)} Mo</span>
              </div>
              <div className="metric">
                <span className="metric-label">Score</span>
                <span className="metric-value amber">{scenarioB.score.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          3D TERRAIN VIEWPORT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="terrain-viewport">
        <Canvas
          camera={{ position: [0, 6, 12], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <MountainScene scenarioA={scenarioA} scenarioB={scenarioB} />
        </Canvas>
        
        {/* Legend */}
        <div className="viewport-legend">
          <div className="legend-item">
            <span className="legend-dot cyan" />
            <span>Baseline (A)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot amber" />
            <span>Exploration (B)</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DELTA NARRATIVE PANEL (AI Briefing)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="narrative-panel">
        <div className="narrative-header">
          <span className="narrative-icon">🎯</span>
          <span className="narrative-title">STRATEGIC AUTOPILOT</span>
        </div>
        
        <div className="narrative-content">
          <div 
            className="verdict-badge" 
            style={{ 
              background: briefing.verdictColor + '20', 
              borderColor: briefing.verdictColor 
            }}
          >
            <span style={{ color: briefing.verdictColor }}>{briefing.verdict}</span>
          </div>
          
          <p className="analysis-text">{briefing.analysis}</p>
          
          <div className="recommendation-box">
            <span className="rec-label">RECOMMENDATION:</span>
            <span className="rec-text">{briefing.recommendation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
