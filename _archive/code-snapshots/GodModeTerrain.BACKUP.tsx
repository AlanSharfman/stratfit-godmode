// src/components/compare/GodModeTerrain.tsx
// STRATFIT — REALISTIC DUAL MOUNTAINS WITH STREAM
// BACKUP — Dual Mountains with Sky, Background, Grass

import { useState, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════════════════
// NOISE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function makeNoise(seed: number) {
  const p = new Uint8Array(512)
  const perm = new Uint8Array(256)
  for (let i = 0; i < 256; i++) perm[i] = i
  let s = seed
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + t * (b - a)
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }

  return (x: number, y: number): number => {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = fade(x)
    const v = fade(y)
    const A = p[X] + Y
    const B = p[X + 1] + Y
    return lerp(
      lerp(grad(p[A], x, y), grad(p[B], x - 1, y), u),
      lerp(grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1), u),
      v
    )
  }
}

// Ridged multifractal noise for jagged mountains
function ridgedNoise(x: number, z: number, noise: (x: number, y: number) => number, octaves: number = 5): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let weight = 1
  
  for (let i = 0; i < octaves; i++) {
    let n = noise(x * frequency * 0.02, z * frequency * 0.02)
    n = 1 - Math.abs(n) // Create ridges
    n = n * n // Sharpen ridges
    n *= weight
    weight = Math.min(1, Math.max(0, n * 2))
    value += n * amplitude
    amplitude *= 0.5
    frequency *= 2.1
  }
  
  return value
}

const noise1 = makeNoise(42)
const noise2 = makeNoise(137)
const noise3 = makeNoise(256)
const noise4 = makeNoise(389)
const noise5 = makeNoise(512)

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO TYPE
// ═══════════════════════════════════════════════════════════════════════════════

interface Scenario {
  name: string
  revenueGrowth: number
  marketExpansion: number
  operationalRisk: number
  color: string
  accentColor: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// REALISTIC MOUNTAIN HEIGHT - Rugged, jagged, multiple peaks
// ═══════════════════════════════════════════════════════════════════════════════

function getMountainHeight(
  x: number, 
  z: number, 
  _centerX: number, 
  scenario: Scenario, 
  timeline: number
): number {
  // Adjust x relative to mountain center
  const localX = x
  
  const timeProgress = timeline / 36
  const eased = timeProgress < 0.5
    ? 2 * timeProgress * timeProgress
    : 1 - Math.pow(-2 * timeProgress + 2, 2) / 2

  const growthFactor = 1 + (scenario.revenueGrowth - 1) * eased
  const marketFactor = 1 + (scenario.marketExpansion - 1) * eased
  const riskFactor = scenario.operationalRisk * eased

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN MASS - Wide base
  // ═══════════════════════════════════════════════════════════════════════════
  
  const massRadius = 50
  const dist = Math.sqrt(localX * localX + z * z)
  let baseMass = Math.max(0, 1 - dist / massRadius)
  baseMass = Math.pow(baseMass, 1.5) * 18 * growthFactor

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTIPLE PEAKS - Creates realistic mountain ridge
  // ═══════════════════════════════════════════════════════════════════════════
  
  const peaks = [
    { x: -2, z: -5, radius: 18, height: 22, sharpness: 2.2 },   // Main peak
    { x: 8, z: 2, radius: 15, height: 16, sharpness: 2.0 },     // Secondary
    { x: -10, z: 3, radius: 14, height: 14, sharpness: 1.9 },   // Tertiary
    { x: 3, z: -12, radius: 12, height: 12, sharpness: 2.1 },   // Back peak
    { x: -5, z: 8, radius: 10, height: 10, sharpness: 1.8 },    // Front peak
  ]

  let peakContribution = 0
  for (const peak of peaks) {
    const dx = localX - peak.x
    const dz = z - peak.z
    const d = Math.sqrt(dx * dx + dz * dz)
    
    // Irregular radius from noise
    const radiusNoise = 1 + noise3(localX * 0.08 + peak.x, z * 0.08 + peak.z) * 0.35
    const effectiveRadius = peak.radius * radiusNoise * marketFactor
    
    if (d < effectiveRadius) {
      let p = 1 - d / effectiveRadius
      p = Math.pow(p, peak.sharpness) // Sharper peaks
      peakContribution += p * peak.height * growthFactor
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RIDGELINES - Connect peaks
  // ═══════════════════════════════════════════════════════════════════════════
  
  function ridge(x1: number, z1: number, x2: number, z2: number, width: number, height: number): number {
    const dx = x2 - x1
    const dz = z2 - z1
    const len = Math.sqrt(dx * dx + dz * dz)
    const dirX = dx / len
    const dirZ = dz / len
    
    const toX = localX - x1
    const toZ = z - z1
    const along = toX * dirX + toZ * dirZ
    const perp = Math.abs(toX * (-dirZ) + toZ * dirX)
    
    if (along < 0 || along > len) return 0
    
    // Sagging ridge profile
    const t = along / len
    const sag = 1 - 0.3 * Math.sin(t * Math.PI)
    const widthNoise = 1 + noise4(localX * 0.1, z * 0.1) * 0.3
    
    let r = Math.max(0, 1 - perp / (width * widthNoise))
    r = Math.pow(r, 1.5) * sag
    return r * height * growthFactor
  }

  const ridges = 
    ridge(-2, -5, 8, 2, 8, 8) +
    ridge(-2, -5, -10, 3, 7, 7) +
    ridge(8, 2, -10, 3, 6, 5) +
    ridge(-2, -5, 3, -12, 6, 6)

  // ═══════════════════════════════════════════════════════════════════════════
  // SPURS - Radiating ridges down the mountain
  // ═══════════════════════════════════════════════════════════════════════════
  
  function spur(ox: number, oz: number, angle: number, length: number, width: number, height: number): number {
    const dirX = Math.cos(angle)
    const dirZ = Math.sin(angle)
    const toX = localX - ox
    const toZ = z - oz
    const along = toX * dirX + toZ * dirZ
    const perp = Math.abs(toX * (-dirZ) + toZ * dirX)
    
    if (along < 0 || along > length) return 0
    
    const falloff = 1 - along / length
    const widen = width * (1 + along / length * 0.8) // Widens as it goes down
    const noiseW = 1 + noise5(localX * 0.08, z * 0.08) * 0.4
    
    let s = Math.max(0, 1 - perp / (widen * noiseW)) * falloff
    return Math.pow(s, 1.4) * height * growthFactor
  }

  const spurs = 
    spur(-2, -5, Math.PI * 0.7, 30, 6, 6) +
    spur(-2, -5, Math.PI * 1.3, 28, 5, 5) +
    spur(8, 2, Math.PI * 0.3, 25, 5, 5) +
    spur(8, 2, Math.PI * 1.6, 22, 5, 4) +
    spur(-10, 3, Math.PI * 0.9, 20, 5, 4)

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBINE BASE STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  
  let height = baseMass + peakContribution + ridges + spurs

  // ═══════════════════════════════════════════════════════════════════════════
  // JAGGED DETAIL - Ridged fractal noise
  // ═══════════════════════════════════════════════════════════════════════════
  
  const detailStrength = Math.min(1, height / 12)
  
  // Ridged noise for rocky crags
  const ridged = ridgedNoise(localX, z, noise1, 5) * 5 * detailStrength
  
  // Medium rocky detail
  const rocky = noise2(localX * 0.12, z * 0.12) * 2.5 * detailStrength
  
  // Fine detail
  const fine = noise4(localX * 0.25, z * 0.25) * 1 * detailStrength
  
  // Risk adds more chaos
  const chaos = noise5(localX * 0.15, z * 0.15) * 3 * riskFactor * detailStrength

  height += ridged + rocky + fine + chaos

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE FALLOFF
  // ═══════════════════════════════════════════════════════════════════════════
  
  const edgeFalloff = Math.max(0, 1 - Math.pow(dist / 55, 3))
  
  return Math.max(0, height * edgeFalloff)
}

function getScenarioValue(scenario: Scenario, timeline: number): number {
  const timeProgress = timeline / 36
  const eased = timeProgress < 0.5
    ? 2 * timeProgress * timeProgress
    : 1 - Math.pow(-2 * timeProgress + 2, 2) / 2
  const currentRevenue = 1 + (scenario.revenueGrowth - 1) * eased
  const currentMarket = 1 + (scenario.marketExpansion - 1) * eased
  return (22 * currentRevenue + 16 * currentMarket + 14 * currentRevenue) * 0.075
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKY
// ═══════════════════════════════════════════════════════════════════════════════

function Sky() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        
        void main() {
          float h = normalize(vWorldPos).y;
          
          vec3 deep = vec3(0.02, 0.04, 0.12);
          vec3 mid = vec3(0.05, 0.1, 0.22);
          vec3 horizon = vec3(0.15, 0.2, 0.35);
          vec3 glow = vec3(0.5, 0.3, 0.15);
          
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.2, h));
          col = mix(col, deep, smoothstep(0.2, 0.6, h));
          
          float glowAmt = exp(-pow(h / 0.1, 2.0)) * 0.35;
          col = mix(col, glow, glowAmt);
          
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  }, [])

  return (
    <mesh>
      <sphereGeometry args={[500, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND MOUNTAINS - Realistic silhouettes
// ═══════════════════════════════════════════════════════════════════════════════

function BackgroundMountains() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    
    // Create jagged mountain silhouette
    const createMountainLine = (
      startX: number, 
      endX: number, 
      baseZ: number, 
      baseY: number,
      peaks: { x: number, h: number }[]
    ) => {
      const pts: THREE.Vector3[] = []
      const steps = 150
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = startX + (endX - startX) * t
        
        // Base height from peaks
        let y = baseY
        for (const peak of peaks) {
          const dist = Math.abs(x - peak.x)
          const influence = Math.max(0, 1 - dist / 40)
          y += Math.pow(influence, 1.8) * peak.h
        }
        
        // Add jagged noise
        const jag1 = noise1(x * 0.05, baseZ * 0.05) * 4
        const jag2 = noise2(x * 0.12, baseZ * 0.12) * 2
        const jag3 = noise3(x * 0.25, baseZ * 0.25) * 1
        y += jag1 + jag2 + jag3
        
        pts.push(new THREE.Vector3(x, Math.max(baseY, y), baseZ))
      }
      
      return pts
    }

    // Far background mountains
    const far1 = createMountainLine(-200, 200, -180, 5, [
      { x: -120, h: 35 },
      { x: -60, h: 45 },
      { x: 0, h: 30 },
      { x: 70, h: 50 },
      { x: 140, h: 38 },
    ])
    
    // Mid background
    const mid1 = createMountainLine(-180, 180, -140, 3, [
      { x: -100, h: 28 },
      { x: -30, h: 35 },
      { x: 50, h: 40 },
      { x: 120, h: 32 },
    ])

    // Near background
    const near1 = createMountainLine(-150, 150, -100, 2, [
      { x: -80, h: 20 },
      { x: 0, h: 25 },
      { x: 90, h: 22 },
    ])

    points.push(...far1, ...mid1, ...near1)
    
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [])

  return (
    <group>
      {/* Far mountains */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#3a4a5e" transparent opacity={0.5} />
      </lineSegments>
      
      {/* Additional far silhouettes */}
      {[-150, -80, 30, 100, 160].map((x, i) => {
        const height = 25 + Math.sin(i * 2.3) * 15
        return (
          <mesh key={i} position={[x, height / 2 + 5, -160 - i * 10]}>
            <coneGeometry args={[30 + i * 5, height, 4]} />
            <meshBasicMaterial color="#2a3a4a" transparent opacity={0.3} wireframe />
          </mesh>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRASS GROUND
// ═══════════════════════════════════════════════════════════════════════════════

function GrassGround() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(400, 400, 80, 80)
    const pos = geo.attributes.position as THREE.BufferAttribute
    
    // Gentle undulation
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const h = noise1(x * 0.01, y * 0.01) * 2 + noise2(x * 0.03, y * 0.03) * 0.5
      pos.setZ(i, h)
    }
    
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <meshBasicMaterial color="#0a1a0f" transparent opacity={0.8} wireframe />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TERRAIN MESH
// ═══════════════════════════════════════════════════════════════════════════════

interface TerrainProps {
  scenario: Scenario
  timeline: number
  centerX: number
}

function Terrain({ scenario, timeline, centerX }: TerrainProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(110, 100, 100, 90)
    return geo
  }, [])

  useMemo(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute
    let maxH = 0

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i)
      const h = getMountainHeight(x, z, 0, scenario, timeline)
      pos.setZ(i, h)
      if (h > maxH) maxH = h
    }

    // Vertex colors
    const baseColor = new THREE.Color(scenario.color)
    const peakColor = new THREE.Color('#ffffff')
    const darkColor = new THREE.Color('#0a1420')

    let colors = geometry.attributes.color as THREE.BufferAttribute
    if (!colors) {
      colors = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3)
      geometry.setAttribute('color', colors)
    }

    for (let i = 0; i < pos.count; i++) {
      const h = pos.getZ(i)
      const t = maxH > 0 ? h / maxH : 0

      const color = new THREE.Color()
      
      if (t < 0.1) {
        color.copy(darkColor)
      } else if (t < 0.35) {
        const lt = (t - 0.1) / 0.25
        color.copy(darkColor).lerp(baseColor, lt * 0.4)
      } else if (t < 0.65) {
        const lt = (t - 0.35) / 0.3
        color.copy(baseColor).multiplyScalar(0.4 + lt * 0.4)
      } else if (t < 0.85) {
        const lt = (t - 0.65) / 0.2
        color.copy(baseColor).lerp(peakColor, lt * 0.6)
      } else {
        const lt = (t - 0.85) / 0.15
        color.lerpColors(baseColor, peakColor, 0.6 + lt * 0.4)
      }

      colors.setXYZ(i, color.r, color.g, color.b)
    }

    pos.needsUpdate = true
    colors.needsUpdate = true
    geometry.computeVertexNormals()
  }, [scenario, timeline, geometry])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, 0]}>
      <meshBasicMaterial wireframe vertexColors transparent opacity={0.92} />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface TimelineControlProps {
  timeline: number
  setTimeline: (t: number) => void
  isPlaying: boolean
  setIsPlaying: (p: boolean) => void
}

function TimelineControl({ timeline, setTimeline, isPlaying, setIsPlaying }: TimelineControlProps) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      background: 'rgba(2, 6, 23, 0.92)',
      padding: '14px 28px',
      borderRadius: 14,
      border: '1px solid rgba(100, 116, 139, 0.25)',
      backdropFilter: 'blur(12px)',
    }}>
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        style={{
          background: isPlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${isPlaying ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          color: isPlaying ? '#ef4444' : '#22c55e',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 600,
          minWidth: 90,
        }}
      >
        {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
      </button>

      <div style={{ width: 1, height: 32, background: 'rgba(100, 116, 139, 0.3)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 }}>
            TIMELINE
          </span>
          <span style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, fontFamily: 'monospace', minWidth: 55 }}>
            T+{Math.round(timeline)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="range"
            min={0}
            max={36}
            step={1}
            value={timeline}
            onChange={(e) => setTimeline(parseInt(e.target.value))}
            style={{
              width: 280,
              height: 6,
              appearance: 'none',
              background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(timeline / 36) * 100}%, rgba(100, 116, 139, 0.3) ${(timeline / 36) * 100}%, rgba(100, 116, 139, 0.3) 100%)`,
              borderRadius: 3,
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 280 }}>
            {['T+0', 'T+12', 'T+24', 'T+36'].map((label) => (
              <span key={label} style={{ color: '#64748b', fontSize: 9, fontFamily: 'monospace' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface KPIPanelProps {
  baseline: Scenario
  exploration: Scenario
  timeline: number
}

function KPIPanel({ baseline, exploration, timeline }: KPIPanelProps) {
  const baselineValue = getScenarioValue(baseline, timeline)
  const explorationValue = getScenarioValue(exploration, timeline)
  const delta = explorationValue - baselineValue
  const deltaPercent = baselineValue > 0 ? ((explorationValue / baselineValue) - 1) * 100 : 0

  return (
    <div style={{
      position: 'absolute',
      top: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 24,
      alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(2, 6, 23, 0.9)',
        padding: '14px 24px',
        borderRadius: 10,
        border: '1px solid rgba(34, 211, 238, 0.3)',
        textAlign: 'center',
        minWidth: 120,
      }}>
        <div style={{ color: '#64748b', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>
          BASELINE
        </div>
        <div style={{ color: '#22d3ee', fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
          ${baselineValue.toFixed(1)}M
        </div>
      </div>

      <div style={{
        background: delta >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        padding: '10px 16px',
        borderRadius: 8,
        border: `1px solid ${delta >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        textAlign: 'center',
      }}>
        <div style={{
          color: delta >= 0 ? '#22c55e' : '#ef4444',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'monospace'
        }}>
          {delta >= 0 ? '+' : ''}{deltaPercent.toFixed(0)}%
        </div>
      </div>

      <div style={{
        background: 'rgba(2, 6, 23, 0.9)',
        padding: '14px 24px',
        borderRadius: 10,
        border: '1px solid rgba(230, 126, 34, 0.3)',
        textAlign: 'center',
        minWidth: 120,
      }}>
        <div style={{ color: '#64748b', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>
          EXPLORATION
        </div>
        <div style={{ color: '#e67e22', fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
          ${explorationValue.toFixed(1)}M
        </div>
      </div>
    </div>
  )
}

interface ScenarioControlsProps {
  baseline: Scenario
  setBaseline: (s: Scenario) => void
  exploration: Scenario
  setExploration: (s: Scenario) => void
}

function ScenarioControls({ baseline, setBaseline, exploration, setExploration }: ScenarioControlsProps) {
  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: 5,
    appearance: 'none',
    background: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 3,
    cursor: 'pointer',
  }

  const renderSliders = (scenario: Scenario, setScenario: (s: Scenario) => void, color: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>Revenue Growth</span>
          <span style={{ color }}>{(scenario.revenueGrowth * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={50} max={200} value={scenario.revenueGrowth * 100}
          onChange={(e) => setScenario({ ...scenario, revenueGrowth: parseInt(e.target.value) / 100 })}
          style={sliderStyle} />
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>Market Expansion</span>
          <span style={{ color }}>{(scenario.marketExpansion * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={50} max={200} value={scenario.marketExpansion * 100}
          onChange={(e) => setScenario({ ...scenario, marketExpansion: parseInt(e.target.value) / 100 })}
          style={sliderStyle} />
      </div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>Operational Risk</span>
          <span style={{ color: scenario.operationalRisk > 0.5 ? '#ef4444' : color }}>
            {(scenario.operationalRisk * 100).toFixed(0)}%
          </span>
        </div>
        <input type="range" min={0} max={100} value={scenario.operationalRisk * 100}
          onChange={(e) => setScenario({ ...scenario, operationalRisk: parseInt(e.target.value) / 100 })}
          style={sliderStyle} />
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 40,
      background: 'rgba(2, 6, 23, 0.92)',
      padding: '18px 28px',
      borderRadius: 14,
      border: '1px solid rgba(100, 116, 139, 0.2)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ width: 180 }}>
        <div style={{ color: '#22d3ee', fontSize: 11, fontWeight: 600, marginBottom: 12, fontFamily: 'monospace', letterSpacing: 1 }}>
          ◀ BASELINE
        </div>
        {renderSliders(baseline, setBaseline, '#22d3ee')}
      </div>
      <div style={{ width: 1, background: 'rgba(100, 116, 139, 0.3)' }} />
      <div style={{ width: 180 }}>
        <div style={{ color: '#e67e22', fontSize: 11, fontWeight: 600, marginBottom: 12, fontFamily: 'monospace', letterSpacing: 1 }}>
          EXPLORATION ▶
        </div>
        {renderSliders(exploration, setExploration, '#e67e22')}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GodModeTerrain() {
  const [timeline, setTimeline] = useState(18)
  const [isPlaying, setIsPlaying] = useState(false)

  const [baseline, setBaseline] = useState<Scenario>({
    name: 'BASELINE',
    revenueGrowth: 1.0,
    marketExpansion: 1.0,
    operationalRisk: 0.15,
    color: '#22d3ee',
    accentColor: '#67e8f9',
  })

  const [exploration, setExploration] = useState<Scenario>({
    name: 'EXPLORATION',
    revenueGrowth: 1.5,
    marketExpansion: 1.6,
    operationalRisk: 0.35,
    color: '#e67e22',
    accentColor: '#f39c12',
  })

  const frameRef = useRef<number>(0)

  useMemo(() => {
    if (isPlaying) {
      const animate = () => {
        setTimeline((t) => {
          if (t >= 36) {
            setIsPlaying(false)
            return 36
          }
          return t + 0.1
        })
        frameRef.current = requestAnimationFrame(animate)
      }
      frameRef.current = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(frameRef.current)
    }
  }, [isPlaying])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#030508' }}>
      <Canvas
        camera={{ position: [0, 50, 100], fov: 50, near: 1, far: 800 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={['#030508']} />
        <fog attach="fog" args={['#0a1628', 100, 350]} />

        <ambientLight intensity={0.35} color="#8facc4" />
        <directionalLight position={[50, 50, -80]} intensity={0.3} color="#ff9966" />
        <directionalLight position={[-40, 40, -50]} intensity={0.15} color="#66aaff" />

        <Sky />
        <BackgroundMountains />
        <GrassGround />

        {/* TWO MOUNTAINS - Left (Baseline) and Right (Exploration) */}
        <Terrain scenario={baseline} timeline={timeline} centerX={-55} />
        <Terrain scenario={exploration} timeline={timeline} centerX={55} />

        <OrbitControls
          target={[0, 15, 0]}
          minDistance={60}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0.2}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      <TimelineControl
        timeline={timeline}
        setTimeline={setTimeline}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <KPIPanel baseline={baseline} exploration={exploration} timeline={timeline} />

      <ScenarioControls
        baseline={baseline}
        setBaseline={setBaseline}
        exploration={exploration}
        setExploration={setExploration}
      />
    </div>
  )
}

