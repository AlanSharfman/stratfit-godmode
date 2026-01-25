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

// ═══════════════════════════════════════════════════════════════════════════════
// PATH DIVERGENCE CALCULATOR — Measures distance between undulating trajectories
// ═══════════════════════════════════════════════════════════════════════════════

interface DivergenceMetrics {
  totalArea: number;           // Total area between paths (cumulative divergence)
  maxDivergence: number;       // Maximum distance between paths at any point
  maxDivergenceMonth: number;  // Month where max divergence occurs
  momentum: 'accelerating' | 'decelerating' | 'stable';  // Is divergence growing?
  crossoverPoints: number[];   // Months where paths intersect
  earlyDivergence: number;     // Divergence in months 1-12
  lateDivergence: number;      // Divergence in months 25-36
}

const calculatePathDivergence = (
  scoreA: number, 
  scoreB: number,
  arrA: number,
  arrB: number
): DivergenceMetrics => {
  const MONTHS = 36;
  const divergences: number[] = [];
  const crossoverPoints: number[] = [];
  
  // Simulate path X-positions over time (mirrors LavaRiver logic)
  const driftA = (1 - scoreA / 100) * 3.0;
  const driftB = (1 - scoreB / 100) * 3.0;
  
  let prevDiff = 0;
  for (let month = 0; month <= MONTHS; month++) {
    const t = month / MONTHS;
    
    // Path A (baseline, left side)
    const spreadA = t * t * 2.0;
    const driftTermA = driftA * t * 1.5;
    const xA = -1 * (0.2 + spreadA + driftTermA);
    
    // Path B (exploration, right side)
    const spreadB = t * t * 2.0;
    const driftTermB = driftB * t * 1.5;
    const xB = 1 * (0.2 + spreadB + driftTermB);
    
    // ARR-weighted divergence (accounts for business impact)
    const arrWeight = 1 + (arrB - arrA) / arrA * t;
    const divergence = Math.abs(xB - xA) * arrWeight;
    divergences.push(divergence);
    
    // Detect crossover (sign change in difference)
    const currentDiff = xB - xA;
    if (month > 0 && Math.sign(currentDiff) !== Math.sign(prevDiff)) {
      crossoverPoints.push(month);
    }
    prevDiff = currentDiff;
  }
  
  // Calculate metrics
  const totalArea = divergences.reduce((sum, d) => sum + d, 0);
  const maxDivergence = Math.max(...divergences);
  const maxDivergenceMonth = divergences.indexOf(maxDivergence);
  
  const earlyDivergence = divergences.slice(0, 12).reduce((sum, d) => sum + d, 0);
  const lateDivergence = divergences.slice(24, 36).reduce((sum, d) => sum + d, 0);
  
  // Momentum: compare first half vs second half growth rate
  const firstHalfGrowth = divergences[18] - divergences[0];
  const secondHalfGrowth = divergences[36] - divergences[18];
  const momentum = secondHalfGrowth > firstHalfGrowth * 1.2 ? 'accelerating' 
    : secondHalfGrowth < firstHalfGrowth * 0.8 ? 'decelerating' 
    : 'stable';
  
  return {
    totalArea,
    maxDivergence,
    maxDivergenceMonth,
    momentum,
    crossoverPoints,
    earlyDivergence,
    lateDivergence
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT ENGINE — Board-ready executive verdict based on path divergence
// ═══════════════════════════════════════════════════════════════════════════════

interface StrategicBriefing extends StrategicVerdict {
  divergenceMetrics: DivergenceMetrics;
  executiveSummary: string;
  keyInsight: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
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

const getStrategicBriefing = (scenarioA: ScenarioData, scenarioB: ScenarioData): StrategicBriefing => {
  const baseVerdict = getStrategicVerdict(scenarioA, scenarioB);
  const divergence = calculatePathDivergence(scenarioA.score, scenarioB.score, scenarioA.arr, scenarioB.arr);
  
  const arrDelta = scenarioB.arr - scenarioA.arr;
  const arrDeltaPercent = ((arrDelta) / scenarioA.arr) * 100;
  const survivalDelta = scenarioB.survival - scenarioA.survival;
  
  // Determine risk level based on divergence momentum and survival
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  if (survivalDelta < -15 || divergence.momentum === 'accelerating' && arrDeltaPercent < 0) {
    riskLevel = 'CRITICAL';
  } else if (survivalDelta < -5 || divergence.maxDivergence > 8) {
    riskLevel = 'HIGH';
  } else if (Math.abs(arrDeltaPercent) > 10 || divergence.lateDivergence > divergence.earlyDivergence * 2) {
    riskLevel = 'MODERATE';
  } else {
    riskLevel = 'LOW';
  }
  
  // Generate executive summary based on divergence analysis
  let executiveSummary: string;
  let keyInsight: string;
  
  if (divergence.momentum === 'accelerating') {
    executiveSummary = `Path divergence is ACCELERATING. The gap between trajectories widens significantly after Month ${divergence.maxDivergenceMonth}, reaching ${divergence.maxDivergence.toFixed(1)} units of strategic separation.`;
    keyInsight = `⚠️ Late-stage divergence (${divergence.lateDivergence.toFixed(1)}) is ${(divergence.lateDivergence / divergence.earlyDivergence).toFixed(1)}x higher than early-stage. Decision impact compounds over time.`;
  } else if (divergence.momentum === 'decelerating') {
    executiveSummary = `Path divergence is STABILIZING. Initial separation of ${divergence.earlyDivergence.toFixed(1)} units narrows to ${divergence.lateDivergence.toFixed(1)} units by Month 36.`;
    keyInsight = `✓ Trajectories are converging. Strategic choices become less critical after Month ${Math.floor(divergence.maxDivergenceMonth)}.`;
  } else {
    executiveSummary = `Path divergence is STABLE at ${divergence.totalArea.toFixed(1)} cumulative units over 36 months. Peak separation occurs at Month ${divergence.maxDivergenceMonth}.`;
    keyInsight = `→ Consistent ${Math.abs(arrDeltaPercent).toFixed(0)}% ARR variance maintained throughout projection period.`;
  }
  
  // Add crossover insight if paths intersect
  if (divergence.crossoverPoints.length > 0) {
    keyInsight += ` Paths intersect at Month ${divergence.crossoverPoints[0]} — critical decision point.`;
  }
  
  return {
    ...baseVerdict,
    divergenceMetrics: divergence,
    executiveSummary,
    keyInsight,
    riskLevel
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
    
    // RIDGE SHARPENING: abs(simplex.noise2D(x * 0.6, y * 0.6)) creates sharp "Teeth"
    const ridgeNoise = Math.abs(simplex.noise2D(x * 0.6, y * 0.6)) * 1.0;
    // Valley carving for depth
    const valleyNoise = Math.abs(simplex.noise2D(x * 1.2, y * 1.2)) * 0.5;
    // Micro detail for surface texture
    const microDetail = simplex.noise2D(x * 2.5, y * 2.5) * 0.15;
    
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
  // CRITICAL: Every point MUST sample the Mountain's Z-height
  // The lava physically CLIMBS ridges and DIPS into valleys
  const { curve, endPosition } = useMemo(() => {
    const curvePoints: THREE.Vector3[] = [];
    const SURFACE_OFFSET = 0.06; // Normal offset to flow OVER the glass, not through it
    const STEPS = 120; // High resolution for precise ridge/valley following
    
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS; // 0 = Month 0 (summit), 1 = Month 36 (base)
      
      // Y-AXIS: Time progression down the mountain (Strategic High Ground → Base)
      // Start at summit ridge (y=3.5), end at base valley (y=-4)
      const y = 3.5 - t * 7.5;
      
      // X-AXIS: Resource Velocity divergence based on strategic score
      // Both paths start near center, then diverge based on score quality
      const timeBasedSpread = t * t * 2.0; // Accelerating spread over timeline
      const scoreDrift = driftIntensity * t * 1.5; // Linear drift for worse scores
      
      // Sinuous path that follows terrain ridges naturally
      const ridgeWave = Math.sin(t * Math.PI * 3) * 0.3 * (1 - t * 0.5);
      const microWave = Math.sin(t * Math.PI * 7) * 0.1 * t;
      
      const x = side * (0.2 + timeBasedSpread + scoreDrift) + (ridgeWave + microWave) * side;
      
      // Z-AXIS: Sample EXACT terrain height at [x, y] + normal offset
      // THIS IS THE "CLING LOGIC" - makes lava tethered to ridges
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
  
  // PLASMA VEIN — Clean 3-layer approach: Bloom + Core + Particles
  // TubeGeometry gives 3D mass, high emissive makes it look like liquid light
  const tubeGeo = useMemo(() => ({
    bloom: new THREE.TubeGeometry(curve, 100, 0.12, 16, false),    // Outer glow bloom
    core: new THREE.TubeGeometry(curve, 100, 0.04, 8, false),      // Main plasma vein
    center: new THREE.TubeGeometry(curve, 100, 0.015, 8, false),   // White-hot center
  }), [curve]);

  // Animate emissive intensity for liquid light pulsing
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Main core pulsing - looks like flowing plasma
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 8 + Math.sin(time * 3) * 2;
    }
    
    // Energy particles flowing along the path
    pipRefs.current.forEach((pip, i) => {
      if (pip) {
        const speed = 0.06 + (i % 4) * 0.02;
        const t = ((time * speed + i * 0.1) % 1);
        const point = curve.getPointAt(t);
        pip.position.copy(point);
        pip.scale.setScalar(0.8 + Math.sin(time * 8 + i * 2) * 0.3);
      }
    });
  });

  // Flowing energy particles
  const pips = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  return (
    <group>
      {/* BLOOM LAYER — Soft outer glow for atmosphere */}
      <mesh geometry={tubeGeo.bloom}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* PLASMA CORE — High emissive, looks like liquid light */}
      <mesh ref={tubeRef} geometry={tubeGeo.core}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={8}
          toneMapped={false}
        />
      </mesh>
      
      {/* WHITE-HOT CENTER — Pure brightness */}
      <mesh geometry={tubeGeo.center}>
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
      
      {/* BOARD-DECK HUD — Calculated variance at intersection point */}
      <Html
        position={[0.5, 4.5, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div 
          className="backdrop-blur-xl rounded-lg border border-cyan-500/30 p-4 min-w-[220px]"
          style={{
            background: 'linear-gradient(180deg, rgba(0,20,40,0.95) 0%, rgba(5,10,20,0.98) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(0,217,255,0.15), inset 0 1px 0 rgba(0,217,255,0.2)',
          }}
        >
          {/* Month-X Variance Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
            <div>
              <span className="text-[8px] font-bold tracking-[0.25em] text-cyan-400/60 block">
                MONTH-{month + 1} VARIANCE
              </span>
              <span className="text-[10px] text-white/40">Strategic Intersection</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          </div>
          
          {/* Total ARR Delta — The key metric */}
          <div className="mb-3">
            <div className="text-[8px] font-bold tracking-[0.2em] text-white/40 mb-1">TOTAL ARR DELTA</div>
            <div className="flex items-baseline gap-3">
              <div className={`text-3xl font-black tracking-tight ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {delta >= 0 ? '+' : ''}${delta.toFixed(2)}M
              </div>
              <div className={`text-sm font-bold ${delta >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(divergence).toFixed(1)}%
              </div>
            </div>
          </div>
          
          {/* Path Intersection Values */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
                <span className="text-[8px] font-bold tracking-wider text-cyan-400/80">BASELINE</span>
              </div>
              <div className="text-lg font-black text-white">${valA.toFixed(2)}M</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-[8px] font-bold tracking-wider text-amber-400/80">EXPLORE</span>
              </div>
              <div className="text-lg font-black text-white">${valB.toFixed(2)}M</div>
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

  // FIXED OPTIMAL POSITION - Perfectly visible, no animation
  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -1.5, 0]}>
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
// GHOST RANGE — Distant faint wireframe mountains for market scale context
// Provides visual depth and represents the broader market landscape
// ═══════════════════════════════════════════════════════════════════════════════

function GhostRange() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 20, 64, 64);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Distant mountain range silhouette
      const dist = Math.sqrt(x * x + y * y);
      const mask = Math.pow(Math.max(0, 1 - dist / 14), 1.5);
      
      // Multiple peaks for range effect
      const peak1 = Math.exp(-((x + 8) ** 2 + (y - 3) ** 2) / 20) * 3;
      const peak2 = Math.exp(-((x - 10) ** 2 + (y + 2) ** 2) / 25) * 2.5;
      const peak3 = Math.exp(-((x - 2) ** 2 + (y - 6) ** 2) / 15) * 2;
      const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5;
      
      const height = (peak1 + peak2 + peak3 + noise) * mask;
      pos.setZ(i, height);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -8, -15]} rotation={[-Math.PI / 3, 0, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          wireframe
          color="#4a5568"
          transparent
          opacity={0.06}
          toneMapped={false}
        />
      </mesh>
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
  const arrDelta = scenarioB.arr - scenarioA.arr;
  const arrDeltaPercent = ((arrDelta / scenarioA.arr) * 100);

  // Titanium panel styling
  const panelStyle = {
    background: 'linear-gradient(135deg, rgba(15,20,30,0.92) 0%, rgba(8,12,20,0.96) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LEFT WING: Scenario A (Baseline) Telemetry — Anchored top-left */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-4 z-20 w-64">
        <div className="rounded-xl overflow-hidden" style={panelStyle}>
          {/* Cyan accent strip */}
          <div 
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, #00D9FF 0%, #0891b2 50%, transparent 100%)' }}
          />
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,217,255,0.8)]" />
              <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-400">
                SCENARIO A: BASELINE
              </span>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">ARR</div>
                <div className="text-lg font-black text-white">{formatCurrency(scenarioA.arr)}</div>
              </div>
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">SURVIVAL</div>
                <div className="text-lg font-black text-white">{scenarioA.survival.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">SCORE</div>
                <div className="text-lg font-black text-cyan-400">{scenarioA.score}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT WING: Scenario B (Exploration) Telemetry — Anchored top-right */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 right-4 z-20 w-64">
        <div className="rounded-xl overflow-hidden" style={panelStyle}>
          {/* Amber accent strip */}
          <div 
            className="h-1 w-full"
            style={{ background: 'linear-gradient(90deg, transparent 0%, #d97706 50%, #F59E0B 100%)' }}
          />
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 justify-end">
              <span className="text-[9px] font-bold tracking-[0.2em] text-amber-400">
                SCENARIO B: EXPLORATION
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-right">
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">ARR</div>
                <div className="text-lg font-black text-white">{formatCurrency(scenarioB.arr)}</div>
              </div>
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">SURVIVAL</div>
                <div className="text-lg font-black text-white">{scenarioB.survival.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[8px] text-white/40 tracking-wider mb-1">SCORE</div>
                <div className="text-lg font-black text-amber-400">{scenarioB.score}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOP CENTER: Delta Badge — Small, non-intrusive */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div 
          className="px-4 py-2 rounded-lg flex items-center gap-3"
          style={{
            ...panelStyle,
            border: `1px solid ${scoreDelta >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          <div className="text-[8px] text-white/50 tracking-[0.15em]">Δ SCORE</div>
          <div 
            className={`text-xl font-black ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ textShadow: scoreDelta >= 0 ? '0 0 15px rgba(16,185,129,0.5)' : '0 0 15px rgba(239,68,68,0.5)' }}
          >
            {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="text-[8px] text-white/50 tracking-[0.15em]">Δ ARR</div>
          <div className={`text-sm font-bold ${arrDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {arrDelta >= 0 ? '+' : ''}{arrDeltaPercent.toFixed(0)}%
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGIC AUTOPILOT PANEL — AI executive verdict
// ═══════════════════════════════════════════════════════════════════════════════

function StrategicAutopilotPanel({ scenarioA, scenarioB }: { scenarioA: ScenarioData; scenarioB: ScenarioData }) {
  const briefing = useMemo(() => getStrategicBriefing(scenarioA, scenarioB), [scenarioA, scenarioB]);
  const { divergenceMetrics: dm } = briefing;

  const riskColors = {
    'LOW': '#10b981',
    'MODERATE': '#fbbf24', 
    'HIGH': '#f97316',
    'CRITICAL': '#ef4444'
  };

  return (
    <div 
      className="absolute bottom-4 right-4 w-96 overflow-hidden z-10"
      style={{
        background: 'linear-gradient(180deg, rgba(10,15,25,0.97) 0%, rgba(5,8,15,0.99) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid rgba(0,217,255,0.15)',
        borderRadius: '12px',
      }}
    >
      {/* Header with Risk Indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,217,255,0.5)]">
            ⚡
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/70 block">STRATEGIC AUTOPILOT</span>
            <span className="text-[8px] text-cyan-400/60 tracking-wider">PATH DIVERGENCE ANALYSIS</span>
          </div>
        </div>
        <div 
          className="px-2 py-1 rounded text-[9px] font-black tracking-wider"
          style={{ 
            backgroundColor: `${riskColors[briefing.riskLevel]}20`,
            color: riskColors[briefing.riskLevel],
            border: `1px solid ${riskColors[briefing.riskLevel]}40`
          }}
        >
          {briefing.riskLevel} RISK
        </div>
      </div>
      
      <div className="p-4">
        {/* Verdict Badge */}
        <div 
          className="inline-block px-4 py-2 rounded-lg text-xs font-black tracking-wider mb-3"
          style={{ 
            backgroundColor: `${briefing.color}15`, 
            color: briefing.color,
            border: `1px solid ${briefing.color}40`,
            boxShadow: `0 0 20px ${briefing.color}25`
          }}
        >
          {briefing.verdict}
        </div>
        
        {/* Executive Summary */}
        <p className="text-xs text-white/85 leading-relaxed mb-3">
          {briefing.executiveSummary}
        </p>
        
        {/* Divergence Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">TOTAL AREA</div>
            <div className="text-sm font-black text-cyan-400">{dm.totalArea.toFixed(1)}</div>
            <div className="text-[7px] text-white/30">units²</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">MAX GAP</div>
            <div className="text-sm font-black text-amber-400">{dm.maxDivergence.toFixed(1)}</div>
            <div className="text-[7px] text-white/30">@ Month {dm.maxDivergenceMonth}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-bold tracking-wider text-white/40 mb-1">MOMENTUM</div>
            <div className={`text-sm font-black ${
              dm.momentum === 'accelerating' ? 'text-red-400' : 
              dm.momentum === 'decelerating' ? 'text-emerald-400' : 'text-white/60'
            }`}>
              {dm.momentum === 'accelerating' ? '↗' : dm.momentum === 'decelerating' ? '↘' : '→'}
            </div>
            <div className="text-[7px] text-white/30">{dm.momentum}</div>
          </div>
        </div>
        
        {/* Key Insight */}
        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <p className="text-[10px] text-cyan-300/90 leading-relaxed">
            {briefing.keyInsight}
          </p>
        </div>
        
        {/* Original Analysis */}
        <p className="text-xs text-white/70 leading-relaxed mb-3">
          {briefing.analysis}
        </p>
        
        {/* Recommendation */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-[9px] font-bold tracking-[0.15em] text-white/40 mb-2">
            ⟐ BOARD RECOMMENDATION
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            {briefing.recommendation}
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

      {/* 3D CANVAS — Unobstructed view with summit clearance */}
      <div
        className="absolute inset-0"
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverData(null)}
      >
        <Canvas
          camera={{ 
            position: [8, 6, 12], // EXECUTIVE PERSPECTIVE: Looking at the Summit
            fov: 42 
          }}
          gl={{ 
            antialias: true, 
            alpha: true, 
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.5,
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#030508']} />
            <fog attach="fog" args={['#030508', 20, 50]} />
            
            {/* ENVIRONMENT: City preset for high-contrast glass reflections */}
            <Environment preset="city" />

            {/* GHOST RANGE — Distant faint wireframe mountains for market scale context */}
            <GhostRange />

            {/* UNIFIED DESTINY FIELD - Crystal Massif */}
            <UnifiedDestinyField 
              scenarioA={scenarioA} 
              scenarioB={scenarioB} 
              hoverData={hoverData}
            />
            
            {/* FIXED VIEW — No rotation, zoom only */}
            <OrbitControls
              target={[0, 1, 0]}
              enableZoom={true}
              enablePan={false}
              enableRotate={false}
              zoomSpeed={0.5}
              minDistance={10}
              maxDistance={25}
              enableDamping={true}
              dampingFactor={0.1}
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
