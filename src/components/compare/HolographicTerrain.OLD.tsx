// src/components/compare/HolographicTerrain.tsx
// STRATFIT — Holographic Terrain with Stunning Visuals

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noise1 = createNoise2D(mulberry32(42))
const noise2 = createNoise2D(mulberry32(1337))
const noiseWarp = createNoise2D(mulberry32(999))

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  width: 200,
  depth: 200,
  segments: 80,
  heightScale: 50,
  peakRadius: 85,
  peakFalloffPower: 1.3,
  
  // Noise
  ridgeFrequency: 0.018,
  ridgeOctaves: 5,
  ridgeLacunarity: 2.1,
  ridgePersistence: 0.48,
  ridgeSharpness: 2.4,
  
  warpStrength: 18,
  warpFrequency: 0.008,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERRAIN GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function ridgedNoise(x: number, z: number): number {
  let sum = 0
  let amp = 1
  let maxAmp = 0
  let freq = CONFIG.ridgeFrequency

  for (let i = 0; i < CONFIG.ridgeOctaves; i++) {
    let n = noise1(x * freq, z * freq)
    n = 1 - Math.abs(n)
    n = Math.pow(n, CONFIG.ridgeSharpness)
    sum += n * amp
    maxAmp += amp
    amp *= CONFIG.ridgePersistence
    freq *= CONFIG.ridgeLacunarity
  }

  return sum / maxAmp
}

function generateHeight(x: number, z: number, timeOffset: number = 0): number {
  // Domain warp for natural flow
  const wx = x + noiseWarp(x * CONFIG.warpFrequency, z * CONFIG.warpFrequency) * CONFIG.warpStrength
  const wz = z + noiseWarp(x * CONFIG.warpFrequency + 100, z * CONFIG.warpFrequency + 100) * CONFIG.warpStrength

  // Mountain envelope
  const dist = Math.sqrt(x * x + z * z)
  const envelope = Math.max(0, 1 - Math.pow(dist / CONFIG.peakRadius, CONFIG.peakFalloffPower))

  // Ridged terrain
  const ridged = ridgedNoise(wx + timeOffset * 5, wz)
  
  // Add subtle micro-detail at peaks
  const micro = noise2(wx * 0.05, wz * 0.05) * 0.12
  
  // Combine
  let h = ridged * envelope
  h += micro * envelope * h
  
  return h * CONFIG.heightScale
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC SHADER
// ═══════════════════════════════════════════════════════════════════════════════

const vertexShader = `
  uniform float uTime;
  uniform float uHeightScale;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vHeight;
  varying float vScanline;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vHeight = position.z / uHeightScale;
    
    // Scanline effect based on world position
    vScanline = sin(position.y * 0.3 + uTime * 2.0) * 0.5 + 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uColorPeak;
  uniform vec3 uRimColor;
  uniform float uRimPower;
  uniform float uRimIntensity;
  uniform float uGlowIntensity;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vHeight;
  varying float vScanline;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    // Height-based gradient (4-band color ramp)
    vec3 terrainColor;
    float h = clamp(vHeight, 0.0, 1.0);
    
    if (h < 0.25) {
      terrainColor = mix(uColorLow, uColorMid, h / 0.25);
    } else if (h < 0.55) {
      terrainColor = mix(uColorMid, uColorHigh, (h - 0.25) / 0.3);
    } else if (h < 0.8) {
      terrainColor = mix(uColorHigh, uColorPeak, (h - 0.55) / 0.25);
    } else {
      terrainColor = uColorPeak;
    }
    
    // Lighting
    vec3 lightDir1 = normalize(vec3(0.5, 1.0, 0.3));
    vec3 lightDir2 = normalize(vec3(-0.4, 0.6, -0.5));
    float diff1 = max(0.0, dot(normal, lightDir1));
    float diff2 = max(0.0, dot(normal, lightDir2)) * 0.4;
    float ambient = 0.25;
    float lighting = ambient + diff1 * 0.6 + diff2;
    
    // Rim/fresnel glow (holographic edge effect)
    float rim = 1.0 - max(0.0, dot(viewDir, normal));
    rim = pow(rim, uRimPower);
    vec3 rimGlow = uRimColor * rim * uRimIntensity;
    
    // Scanline effect (subtle horizontal lines)
    float scanlineAlpha = 0.92 + vScanline * 0.08;
    
    // Grid overlay at low altitudes
    float gridX = abs(sin(vPosition.x * 0.5));
    float gridY = abs(sin(vPosition.y * 0.5));
    float grid = (gridX * gridY) * 0.15 * (1.0 - h);
    
    // Combine
    vec3 finalColor = terrainColor * lighting;
    finalColor += rimGlow;
    finalColor += uRimColor * grid * 0.3;
    
    // Peak glow
    if (h > 0.7) {
      float peakGlow = (h - 0.7) / 0.3;
      finalColor += uColorPeak * peakGlow * uGlowIntensity * 0.5;
    }
    
    // Pulsing energy at ridges (based on normal angle)
    float ridgeEnergy = pow(1.0 - abs(normal.z), 3.0);
    finalColor += uRimColor * ridgeEnergy * 0.2 * (sin(uTime * 3.0) * 0.3 + 0.7);
    
    gl_FragColor = vec4(finalColor * scanlineAlpha, 1.0);
  }
`

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Props {
  timeline?: number
  scenarioModifier?: number
  colorScheme?: 'cyan' | 'magenta' | 'gold'
}

const COLOR_SCHEMES = {
  cyan: {
    low: new THREE.Color('#0a1628'),
    mid: new THREE.Color('#0d3b4d'),
    high: new THREE.Color('#0891b2'),
    peak: new THREE.Color('#22d3ee'),
    rim: new THREE.Color('#67e8f9'),
  },
  magenta: {
    low: new THREE.Color('#1a0a1e'),
    mid: new THREE.Color('#4a1259'),
    high: new THREE.Color('#a855f7'),
    peak: new THREE.Color('#e879f9'),
    rim: new THREE.Color('#f0abfc'),
  },
  gold: {
    low: new THREE.Color('#1a150a'),
    mid: new THREE.Color('#4d3a1a'),
    high: new THREE.Color('#d97706'),
    peak: new THREE.Color('#fbbf24'),
    rim: new THREE.Color('#fde68a'),
  },
}

export default function HolographicTerrain({
  timeline = 0,
  scenarioModifier = 0,
  colorScheme = 'cyan',
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const colors = COLOR_SCHEMES[colorScheme]

  // Generate geometry based on props
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      CONFIG.width,
      CONFIG.depth,
      CONFIG.segments,
      CONFIG.segments
    )

    const pos = geo.attributes.position as THREE.BufferAttribute
    let maxH = 0

    // Apply scenario offset to create different but related terrains
    const scenarioOffset = scenarioModifier * 0.3

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const h = generateHeight(x, y, scenarioOffset)
      pos.setZ(i, h)
      maxH = Math.max(maxH, h)
    }

    pos.needsUpdate = true
    geo.computeVertexNormals()

    console.log(`[HolographicTerrain] Rebuilt | Scenario: ${scenarioModifier} | MaxH: ${maxH.toFixed(1)}`)

    return geo
  }, [scenarioModifier]) // Re-generate when scenario changes

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeightScale: { value: CONFIG.heightScale },
        uColorLow: { value: colors.low },
        uColorMid: { value: colors.mid },
        uColorHigh: { value: colors.high },
        uColorPeak: { value: colors.peak },
        uRimColor: { value: colors.rim },
        uRimPower: { value: 2.5 },
        uRimIntensity: { value: 0.8 },
        uGlowIntensity: { value: 1.0 },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    })
  }, [colors])

  // Animate time uniform
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  // Update material ref when colors change
  useMemo(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColorLow.value = colors.low
      materialRef.current.uniforms.uColorMid.value = colors.mid
      materialRef.current.uniforms.uColorHigh.value = colors.high
      materialRef.current.uniforms.uColorPeak.value = colors.peak
      materialRef.current.uniforms.uRimColor.value = colors.rim
    }
  }, [colors])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  )
}
