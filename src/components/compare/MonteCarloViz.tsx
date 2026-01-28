// src/components/compare/MonteCarloViz.tsx
// STRATFIT — MONTE CARLO SPAGHETTI VISUALIZATION

import { useRef, useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Scenario {
  revenueGrowth: number
  marketExpansion: number
  operationalRisk: number
}

interface MonteCarloVizProps {
  baseline: Scenario
  exploration: Scenario
  timeline: number // 0 to 1
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEEDED RANDOM FOR CONSISTENT SIMULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTE CARLO SIMULATION LINE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateSimulationPath(
  scenario: Scenario,
  seed: number,
  startValue: number,
  timeSteps: number
): number[] {
  const rand = seededRandom(seed)
  const values: number[] = [startValue]
  
  // Monthly growth rate with scenario parameters
  const baseGrowth = (scenario.revenueGrowth - 1) / 36
  const marketBoost = (scenario.marketExpansion - 1) * 0.02
  const riskVolatility = scenario.operationalRisk * 0.08
  
  for (let t = 1; t <= timeSteps; t++) {
    const prevValue = values[t - 1]
    
    // Geometric Brownian Motion style
    const drift = baseGrowth + marketBoost
    const shock = (rand() - 0.5) * 2 * riskVolatility
    const jump = rand() < 0.02 ? (rand() - 0.5) * riskVolatility * 3 : 0 // Rare jumps
    
    const growthRate = drift + shock + jump
    const newValue = prevValue * (1 + growthRate)
    
    values.push(Math.max(0.5, newValue)) // Floor at 0.5M
  }
  
  return values
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION BUNDLE (Multiple lines for one scenario)
// ═══════════════════════════════════════════════════════════════════════════════

interface SimulationBundleProps {
  scenario: Scenario
  color: string
  seedOffset: number
  numLines: number
  timeline: number
  opacity: number
}

function SimulationBundle({ 
  scenario, 
  color, 
  seedOffset, 
  numLines, 
  opacity 
}: SimulationBundleProps) {
  const linesRef = useRef<THREE.Group>(null)
  
  const { lineGeometries, meanPath, p5Path, p95Path } = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    const allPaths: number[][] = []
    const timeSteps = 36
    const startValue = 3.2
    
    // Generate all simulation paths
    for (let i = 0; i < numLines; i++) {
      const path = generateSimulationPath(scenario, seedOffset + i * 7919, startValue, timeSteps)
      allPaths.push(path)
      
      // Create line geometry
      const points: THREE.Vector3[] = []
      for (let t = 0; t <= timeSteps; t++) {
        const x = (t / timeSteps) * 12 - 6 // -6 to 6
        const y = (path[t] - startValue) * 0.8 // Scale Y
        points.push(new THREE.Vector3(x, y, 0))
      }
      
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      geometries.push(geo)
    }
    
    // Calculate statistics
    const mean: number[] = []
    const p5: number[] = []
    const p95: number[] = []
    
    for (let t = 0; t <= timeSteps; t++) {
      const valuesAtT = allPaths.map(p => p[t]).sort((a, b) => a - b)
      mean.push(valuesAtT.reduce((a, b) => a + b, 0) / valuesAtT.length)
      p5.push(valuesAtT[Math.floor(valuesAtT.length * 0.05)])
      p95.push(valuesAtT[Math.floor(valuesAtT.length * 0.95)])
    }
    
    // Create mean line geometry
    const meanPoints: THREE.Vector3[] = []
    const p5Points: THREE.Vector3[] = []
    const p95Points: THREE.Vector3[] = []
    
    for (let t = 0; t <= timeSteps; t++) {
      const x = (t / timeSteps) * 12 - 6
      meanPoints.push(new THREE.Vector3(x, (mean[t] - startValue) * 0.8, 0.01))
      p5Points.push(new THREE.Vector3(x, (p5[t] - startValue) * 0.8, 0.01))
      p95Points.push(new THREE.Vector3(x, (p95[t] - startValue) * 0.8, 0.01))
    }
    
    return {
      lineGeometries: geometries,
      meanPath: new THREE.BufferGeometry().setFromPoints(meanPoints),
      p5Path: new THREE.BufferGeometry().setFromPoints(p5Points),
      p95Path: new THREE.BufferGeometry().setFromPoints(p95Points),
    }
  }, [scenario, seedOffset, numLines])

  return (
    <group ref={linesRef}>
      {/* Individual simulation lines */}
      {lineGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial 
            color={color} 
            transparent 
            opacity={opacity * 0.15}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
      
      {/* Mean line (bold) */}
      <line geometry={meanPath}>
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity * 0.9}
          linewidth={2}
        />
      </line>
      
      {/* P5 line (dashed feel via lower opacity) */}
      <line geometry={p5Path}>
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity * 0.4}
        />
      </line>
      
      {/* P95 line */}
      <line geometry={p95Path}>
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity * 0.4}
        />
      </line>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME MARKER (Vertical line at current timeline position)
// ═══════════════════════════════════════════════════════════════════════════════

function TimeMarker({ timeline }: { timeline: number }) {
  const x = timeline * 12 - 6
  
  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(x, -2, 0.02),
      new THREE.Vector3(x, 6, 0.02),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [x])

  return (
    <group>
      {/* Vertical line */}
      <line geometry={geometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </line>
      
      {/* Time marker dot */}
      <mesh position={[x, -2.3, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AXIS LINES AND LABELS
// ═══════════════════════════════════════════════════════════════════════════════

function AxisSystem() {
  // Horizontal axis (time)
  const xAxisGeo = useMemo(() => {
    const points = [
      new THREE.Vector3(-6.5, -1.8, 0),
      new THREE.Vector3(6.5, -1.8, 0),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])
  
  // Vertical axis (value)
  const yAxisGeo = useMemo(() => {
    const points = [
      new THREE.Vector3(-6.5, -1.8, 0),
      new THREE.Vector3(-6.5, 5.5, 0),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])
  
  // Grid lines
  const gridLines = useMemo(() => {
    const lines: THREE.BufferGeometry[] = []
    
    // Horizontal grid
    for (let y = 0; y <= 4; y++) {
      const points = [
        new THREE.Vector3(-6.5, y - 0.8, -0.01),
        new THREE.Vector3(6.5, y - 0.8, -0.01),
      ]
      lines.push(new THREE.BufferGeometry().setFromPoints(points))
    }
    
    // Vertical grid (time markers)
    for (let t = 0; t <= 3; t++) {
      const x = (t / 3) * 12 - 6
      const points = [
        new THREE.Vector3(x, -1.8, -0.01),
        new THREE.Vector3(x, 5.5, -0.01),
      ]
      lines.push(new THREE.BufferGeometry().setFromPoints(points))
    }
    
    return lines
  }, [])

  return (
    <group>
      {/* Axes */}
      <line geometry={xAxisGeo}>
        <lineBasicMaterial color="#334155" />
      </line>
      <line geometry={yAxisGeo}>
        <lineBasicMaterial color="#334155" />
      </line>
      
      {/* Grid */}
      {gridLines.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#1e293b" transparent opacity={0.5} />
        </line>
      ))}
      
      {/* Time labels */}
      <Text position={[-6, -2.5, 0]} fontSize={0.28} color="#64748b" anchorX="center">
        T+0
      </Text>
      <Text position={[-2, -2.5, 0]} fontSize={0.28} color="#64748b" anchorX="center">
        T+12
      </Text>
      <Text position={[2, -2.5, 0]} fontSize={0.28} color="#64748b" anchorX="center">
        T+24
      </Text>
      <Text position={[6, -2.5, 0]} fontSize={0.28} color="#64748b" anchorX="center">
        T+36
      </Text>
      
      {/* Value labels */}
      <Text position={[-7.2, -0.8, 0]} fontSize={0.24} color="#64748b" anchorX="right">
        $4M
      </Text>
      <Text position={[-7.2, 1.2, 0]} fontSize={0.24} color="#64748b" anchorX="right">
        $6M
      </Text>
      <Text position={[-7.2, 3.2, 0]} fontSize={0.24} color="#64748b" anchorX="right">
        $8M
      </Text>
      <Text position={[-7.2, 5.2, 0]} fontSize={0.24} color="#64748b" anchorX="right">
        $10M
      </Text>
      
      {/* Axis titles */}
      <Text position={[0, -3.2, 0]} fontSize={0.22} color="#475569" anchorX="center">
        TIMELINE (MONTHS)
      </Text>
      <Text 
        position={[-8.2, 2, 0]} 
        fontSize={0.22} 
        color="#475569" 
        anchorX="center"
        rotation={[0, 0, Math.PI / 2]}
      >
        VALUATION ($M)
      </Text>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════════════════

function Legend() {
  return (
    <group position={[4.5, 5, 0]}>
      {/* Background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3, 1.4]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.9} />
      </mesh>
      
      {/* Baseline */}
      <mesh position={[-1, 0.35, 0]}>
        <planeGeometry args={[0.5, 0.06]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <Text position={[-0.3, 0.35, 0]} fontSize={0.2} color="#22d3ee" anchorX="left">
        BASELINE
      </Text>
      
      {/* Exploration */}
      <mesh position={[-1, -0.1, 0]}>
        <planeGeometry args={[0.5, 0.06]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Text position={[-0.3, -0.1, 0]} fontSize={0.2} color="#f59e0b" anchorX="left">
        EXPLORATION
      </Text>
      
      {/* Simulations count */}
      <Text position={[0, -0.5, 0]} fontSize={0.16} color="#64748b" anchorX="center">
        10,000 SIMULATIONS
      </Text>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MonteCarloViz({
  baseline,
  exploration,
  timeline,
}: MonteCarloVizProps) {
  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      
      {/* Axis system */}
      <AxisSystem />
      
      {/* Baseline simulations (cyan) */}
      <SimulationBundle
        scenario={baseline}
        color="#22d3ee"
        seedOffset={1000}
        numLines={200}
        timeline={timeline}
        opacity={1}
      />
      
      {/* Exploration simulations (amber) */}
      <SimulationBundle
        scenario={exploration}
        color="#f59e0b"
        seedOffset={50000}
        numLines={200}
        timeline={timeline}
        opacity={1}
      />
      
      {/* Time marker */}
      <TimeMarker timeline={timeline} />
      
      {/* Legend */}
      <Legend />
    </group>
  )
}

