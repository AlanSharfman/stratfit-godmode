// src/components/compare/CompareScene.tsx
// STRATFIT — GOD MODE EXACT REPLICATION
// Dual Peaks • Dense Wireframe • White Peaks • Ethereal Glow

import { useState, useMemo, useEffect } from 'react'
import { Canvas, extend, useThree } from '@react-three/fiber'
import { OrbitControls, Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'

extend({ UnrealBloomPass })

// ═══════════════════════════════════════════════════════════════════════════════
// SCULPTED DUAL-PEAK TERRAIN
// Intentional form, not random noise — matches reference exactly
// ═══════════════════════════════════════════════════════════════════════════════

function getHeight(x: number, z: number): number {
  // ═══ MAIN PEAK (center-left, tall) ═══
  const peak1X = -8
  const peak1Z = -5
  const d1 = Math.sqrt((x - peak1X) ** 2 + (z - peak1Z) ** 2)
  const peak1 = Math.exp(-d1 * d1 / 800) * 1.0

  // ═══ SECONDARY PEAK (center-right, slightly shorter) ═══
  const peak2X = 15
  const peak2Z = 5
  const d2 = Math.sqrt((x - peak2X) ** 2 + (z - peak2Z) ** 2)
  const peak2 = Math.exp(-d2 * d2 / 600) * 0.75

  // ═══ RIDGE connecting peaks ═══
  const ridgeLine = Math.abs(z - (x * 0.15 - 2))
  const ridge = Math.exp(-ridgeLine * ridgeLine / 150) * 0.35
  const ridgeMask = Math.exp(-(x * x) / 2000) // Only in center

  // ═══ SHOULDER (front-left, lower) ═══
  const shoulder1X = -25
  const shoulder1Z = 20
  const ds1 = Math.sqrt((x - shoulder1X) ** 2 + (z - shoulder1Z) ** 2)
  const shoulder1 = Math.exp(-ds1 * ds1 / 400) * 0.4

  // ═══ SHOULDER (front-right, lower) ═══
  const shoulder2X = 30
  const shoulder2Z = 15
  const ds2 = Math.sqrt((x - shoulder2X) ** 2 + (z - shoulder2Z) ** 2)
  const shoulder2 = Math.exp(-ds2 * ds2 / 350) * 0.35

  // ═══ FOOTHILLS (gentle spread) ═══
  const foothill = Math.exp(-(x * x + z * z) / 4000) * 0.25

  // ═══ SUBTLE RIDGES for texture ═══
  const microRidge1 = Math.sin(x * 0.15 + z * 0.1) * 0.03 * Math.exp(-(x * x + z * z) / 2000)
  const microRidge2 = Math.sin(x * 0.08 - z * 0.12) * 0.025 * Math.exp(-(x * x + z * z) / 2500)

  // Combine all features
  const height = peak1 + peak2 + (ridge * ridgeMask) + shoulder1 + shoulder2 + foothill + microRidge1 + microRidge2

  return Math.max(0, height) * 70 // Scale to final height
}

// ═══════════════════════════════════════════════════════════════════════════════
// DENSE WIREFRAME WITH EDGE FADE
// 140x140 segments, alpha falloff at edges
// ═══════════════════════════════════════════════════════════════════════════════

function TerrainMesh() {
  const { geometry, maxH } = useMemo(() => {
    const width = 180
    const depth = 140
    const segsX = 140 // DENSE wireframe
    const segsZ = 110

    const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ)
    const pos = geo.attributes.position as THREE.BufferAttribute

    let maxHeight = 0
    const heights: number[] = []

    // Apply height displacement
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i)
      const h = getHeight(x, z)
      heights.push(h)
      pos.setZ(i, h)
      maxHeight = Math.max(maxHeight, h)
    }

    // Build line geometry with vertex colors
    const lineVerts: number[] = []
    const lineColors: number[] = []

    const cols = segsX + 1
    const rows = segsZ + 1
    const idx = (c: number, r: number) => r * cols + c
    const halfW = width / 2
    const halfD = depth / 2

    // Color function: dark blue → cyan → WHITE at peaks
    const getColor = (h: number, x: number, z: number) => {
      const t = Math.pow(h / maxHeight, 0.5) // Boost mid-tones
      
      // Edge fade - alpha falloff
      const edgeX = 1 - Math.pow(Math.abs(x) / halfW, 3)
      const edgeZ = 1 - Math.pow(Math.abs(z) / halfD, 3)
      const edgeFade = Math.min(edgeX, edgeZ)
      
      // Color ramp: #0a1628 → #0891b2 → #ffffff
      let r, g, b
      if (t < 0.4) {
        // Dark blue to cyan
        const lt = t / 0.4
        r = 0.04 + lt * 0.0
        g = 0.09 + lt * 0.48
        b = 0.16 + lt * 0.54
      } else {
        // Cyan to white
        const lt = (t - 0.4) / 0.6
        r = 0.04 + lt * 0.96
        g = 0.57 + lt * 0.43
        b = 0.70 + lt * 0.30
      }

      return {
        r: r * edgeFade,
        g: g * edgeFade,
        b: b * edgeFade,
      }
    }

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i1 = idx(c, r)
        const i2 = idx(c + 1, r)
        const x1 = pos.getX(i1), z1 = pos.getY(i1), h1 = heights[i1]
        const x2 = pos.getX(i2), z2 = pos.getY(i2), h2 = heights[i2]

        lineVerts.push(x1, h1, z1, x2, h2, z2)
        const c1 = getColor(h1, x1, z1)
        const c2 = getColor(h2, x2, z2)
        lineColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b)
      }
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows - 1; r++) {
        const i1 = idx(c, r)
        const i2 = idx(c, r + 1)
        const x1 = pos.getX(i1), z1 = pos.getY(i1), h1 = heights[i1]
        const x2 = pos.getX(i2), z2 = pos.getY(i2), h2 = heights[i2]

        lineVerts.push(x1, h1, z1, x2, h2, z2)
        const c1 = getColor(h1, x1, z1)
        const c2 = getColor(h2, x2, z2)
        lineColors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b)
      }
    }

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3))
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3))

    return { geometry: lineGeo, maxH: maxHeight }
  }, [])

  return (
    <group>
      {/* Main wireframe */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.95} />
      </lineSegments>
      {/* Glow layer 1 */}
      <lineSegments geometry={geometry} position={[0, -0.15, 0]}>
        <lineBasicMaterial color="#00bbdd" transparent opacity={0.25} />
      </lineSegments>
      {/* Glow layer 2 */}
      <lineSegments geometry={geometry} position={[0, -0.3, 0]}>
        <lineBasicMaterial color="#006688" transparent opacity={0.12} />
      </lineSegments>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH S-CURVE PATHS HUGGING TERRAIN
// Thick tubes with intense bloom
// ═══════════════════════════════════════════════════════════════════════════════

interface PathProps {
  type: 'baseline' | 'exploration'
  progress: number
}

function GlowingPath({ type, progress }: PathProps) {
  const isBaseline = type === 'baseline'
  const coreColor = isBaseline ? '#00ffff' : '#ffaa00'
  const glowColor = isBaseline ? '#00ddee' : '#ff8800'
  const direction = isBaseline ? -1 : 1

  const tubes = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const numPts = 120
    const visible = Math.max(3, Math.floor(numPts * progress))

    for (let i = 0; i <= visible; i++) {
      const t = i / numPts

      // ═══ SMOOTH S-CURVE ═══
      // Start from front, sweep wide, converge at peak
      const startZ = 60
      const endZ = -10
      const z = startZ + (endZ - startZ) * t

      // S-curve: wide at start, narrow at peak
      const sCurve = Math.sin(t * Math.PI) * (1 - t * 0.5)
      const x = sCurve * 35 * direction

      // Hug the terrain closely
      const terrainH = getHeight(x, z)
      const y = terrainH + 1.5 + t * 2

      pts.push(new THREE.Vector3(x, y, z))
    }

    if (pts.length < 2) {
      pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0))
    }

    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    const segs = Math.max(40, visible * 3)

    return {
      core: new THREE.TubeGeometry(curve, segs, 1.2, 16, false),
      glow1: new THREE.TubeGeometry(curve, segs, 2.5, 12, false),
      glow2: new THREE.TubeGeometry(curve, segs, 4.5, 10, false),
      glow3: new THREE.TubeGeometry(curve, segs, 8.0, 8, false),
    }
  }, [direction, progress])

  return (
    <group>
      {/* Outermost glow */}
      <mesh geometry={tubes.glow3}>
        <meshBasicMaterial color={glowColor} transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
      {/* Mid glow */}
      <mesh geometry={tubes.glow2}>
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner glow */}
      <mesh geometry={tubes.glow1}>
        <meshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Bright core */}
      <mesh geometry={tubes.core}>
        <meshBasicMaterial color={coreColor} transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSPECTIVE GRID FLOOR
// ═══════════════════════════════════════════════════════════════════════════════

function GridFloor() {
  const geometry = useMemo(() => {
    const verts: number[] = []
    const colors: number[] = []

    const sizeX = 400
    const sizeZ = 300
    const divsX = 60
    const divsZ = 40
    const stepX = sizeX / divsX
    const stepZ = sizeZ / divsZ
    const halfX = sizeX / 2
    const startZ = -80
    const endZ = startZ + sizeZ

    // Horizontal lines
    for (let i = 0; i <= divsZ; i++) {
      const z = startZ + i * stepZ
      const fade = Math.pow(1 - i / divsZ, 0.6) * 0.7
      verts.push(-halfX, 0, z, halfX, 0, z)
      colors.push(0, 0.35 * fade, 0.45 * fade, 0, 0.35 * fade, 0.45 * fade)
    }

    // Vertical lines
    for (let i = 0; i <= divsX; i++) {
      const x = -halfX + i * stepX
      const distFromCenter = Math.abs(x) / halfX
      const fade = Math.pow(1 - distFromCenter, 0.4) * 0.5
      verts.push(x, 0, startZ, x, 0, endZ)
      colors.push(0, 0.3 * fade, 0.4 * fade, 0, 0.25 * fade, 0.35 * fade)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <lineSegments geometry={geometry} position={[0, 0, 0]}>
      <lineBasicMaterial vertexColors transparent opacity={0.6} />
    </lineSegments>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOOM POST-PROCESSING
// Intense bloom for ethereal glow
// ═══════════════════════════════════════════════════════════════════════════════

function BloomEffect() {
  const { size } = useThree()
  return (
    <Effects disableGamma>
      {/* @ts-ignore */}
      <unrealBloomPass
        threshold={0.15}
        strength={1.0}
        radius={0.7}
        resolution={new THREE.Vector2(size.width, size.height)}
      />
    </Effects>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

interface SceneProps {
  timeline: number
  showBaseline: boolean
  showExploration: boolean
}

function Scene({ timeline, showBaseline, showExploration }: SceneProps) {
  return (
    <>
      {/* Deep space background */}
      <color attach="background" args={['#000810']} />
      
      {/* Atmospheric fog */}
      <fog attach="fog" args={['#000810', 100, 380]} />

      {/* Subtle ambient */}
      <ambientLight intensity={0.2} />
      
      {/* Key lights */}
      <pointLight position={[0, 100, 30]} intensity={0.5} color="#00ddff" distance={250} />
      <pointLight position={[-50, 60, 60]} intensity={0.3} color="#00aaff" distance={180} />
      <pointLight position={[50, 60, 60]} intensity={0.3} color="#00ffcc" distance={180} />

      {/* Grid floor */}
      <GridFloor />

      {/* Terrain */}
      <TerrainMesh />

      {/* Paths */}
      {showBaseline && <GlowingPath type="baseline" progress={timeline} />}
      {showExploration && <GlowingPath type="exploration" progress={timeline} />}

      {/* Bloom */}
      <BloomEffect />

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={60}
        maxDistance={350}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 25, 0]}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CompareScene() {
  const [timeline, setTimeline] = useState(0.7)
  const [showBaseline, setShowBaseline] = useState(true)
  const [showExploration, setShowExploration] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => setReady(true), [])

  if (!ready) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#000810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#00ccff', fontFamily: 'monospace', letterSpacing: '3px', fontSize: '12px' }}>INITIALIZING...</span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', background: '#000810' }}>
      <Canvas
        camera={{ position: [0, 55, 120], fov: 52, near: 1, far: 600 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        dpr={2}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene timeline={timeline} showBaseline={showBaseline} showExploration={showExploration} />
      </Canvas>

      {/* Timeline Control */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(0, 12, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '12px 24px',
        border: '1px solid rgba(0, 180, 220, 0.35)',
        boxShadow: '0 0 40px rgba(0, 140, 180, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{
            color: '#00ccdd',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '2px',
          }}>
            TIMELINE
          </span>
          <span style={{
            color: '#88ddee',
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}>
            T+{Math.round(timeline * 36)}m
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={timeline}
            onChange={(e) => setTimeline(parseFloat(e.target.value))}
            style={{ width: '160px', accentColor: '#00ddff', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Path toggles */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        zIndex: 10,
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => setShowBaseline(!showBaseline)}
          style={{
            background: showBaseline ? 'rgba(0, 200, 230, 0.15)' : 'rgba(0, 20, 40, 0.8)',
            border: `1px solid ${showBaseline ? 'rgba(0, 220, 255, 0.5)' : 'rgba(50, 70, 90, 0.5)'}`,
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: showBaseline ? '#00ffff' : '#334455',
            boxShadow: showBaseline ? '0 0 12px #00ffff' : 'none',
          }} />
          <span style={{
            color: showBaseline ? '#00ffff' : '#667788',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}>
            BASELINE
          </span>
        </button>

        <button
          onClick={() => setShowExploration(!showExploration)}
          style={{
            background: showExploration ? 'rgba(255, 170, 0, 0.15)' : 'rgba(40, 25, 0, 0.8)',
            border: `1px solid ${showExploration ? 'rgba(255, 180, 0, 0.5)' : 'rgba(90, 70, 50, 0.5)'}`,
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: showExploration ? '#ffaa00' : '#554433',
            boxShadow: showExploration ? '0 0 12px #ffaa00' : 'none',
          }} />
          <span style={{
            color: showExploration ? '#ffaa00' : '#887766',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}>
            STRATFIT
          </span>
        </button>
      </div>
    </div>
  )
}
