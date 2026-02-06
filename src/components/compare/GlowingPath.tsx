// src/components/compare/GlowingPath.tsx
// STRATFIT — Holographic Glowing Path with Energy Effect

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  type: 'baseline' | 'exploration'
  progress?: number
}

const PATH_CONFIG = {
  baseline: {
    core: new THREE.Color('#0891b2'),
    glow: new THREE.Color('#22d3ee'),
    outer: new THREE.Color('#67e8f9'),
    direction: -1,
  },
  exploration: {
    core: new THREE.Color('#c2410c'),
    glow: new THREE.Color('#f97316'),
    outer: new THREE.Color('#fdba74'),
    direction: 1,
  },
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  varying vec3 vPosition;
  varying float vPathProgress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  attribute float pathT;
  
  void main() {
    vPosition = position;
    vPathProgress = pathT;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uCoreColor;
  uniform vec3 uGlowColor;
  uniform vec3 uOuterColor;
  
  varying vec3 vPosition;
  varying float vPathProgress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    // Fresnel/rim for tube glow
    float rim = 1.0 - max(0.0, dot(viewDir, normal));
    rim = pow(rim, 1.5);
    
    // Energy pulse traveling along path
    float pulse = sin((vPathProgress - uTime * 0.5) * 12.0) * 0.5 + 0.5;
    pulse = pow(pulse, 3.0);
    
    // Core to edge gradient
    vec3 baseColor = mix(uCoreColor, uGlowColor, rim * 0.7);
    
    // Add pulse energy
    baseColor += uOuterColor * pulse * 0.4;
    
    // Outer glow at edges
    baseColor += uOuterColor * rim * 0.5;
    
    // Fade based on progress
    float alpha = vPathProgress <= uProgress ? 1.0 : 0.0;
    
    // Leading edge glow
    float leadingEdge = smoothstep(uProgress - 0.05, uProgress, vPathProgress);
    baseColor += uOuterColor * leadingEdge * 2.0 * (1.0 - leadingEdge);
    
    // Pulsing intensity
    float breathe = sin(uTime * 2.0) * 0.1 + 0.9;
    
    gl_FragColor = vec4(baseColor * breathe, alpha);
  }
`

export default function GlowingPath({ type, progress = 1 }: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const config = PATH_CONFIG[type]

  const { geometry, material } = useMemo(() => {
    // Generate path points
    const points: THREE.Vector3[] = []
    const pathTValues: number[] = []
    const segments = 100

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const z = 75 - t * 95
      
      // Curved trajectory
      const xCurve = Math.sin(t * Math.PI * 0.9) * 28 * config.direction
      // Add slight S-curve
      const xWiggle = Math.sin(t * Math.PI * 2.5) * 3 * config.direction
      const x = xCurve + xWiggle
      
      // Height rises with progress, with terrain following
      const yBase = t * 38
      const yPeak = Math.sin(t * Math.PI) * 15
      const y = yBase + yPeak + 4

      points.push(new THREE.Vector3(x, y, z))
      pathTValues.push(t)
    }

    const curve = new THREE.CatmullRomCurve3(points)
    const geo = new THREE.TubeGeometry(curve, 80, 0.7, 12, false)

    // Add pathT attribute for progress-based effects
    const positionAttr = geo.attributes.position
    const pathTArray = new Float32Array(positionAttr.count)
    
    // Map each vertex to its approximate path position
    for (let i = 0; i < positionAttr.count; i++) {
      // TubeGeometry creates rings along the path
      // Each ring has (tubularSegments + 1) * (radialSegments) vertices
      const ringIndex = Math.floor(i / 12)
      pathTArray[i] = ringIndex / 80
    }
    
    geo.setAttribute('pathT', new THREE.BufferAttribute(pathTArray, 1))

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: progress },
        uCoreColor: { value: config.core },
        uGlowColor: { value: config.glow },
        uOuterColor: { value: config.outer },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [config, progress])

  // Animate
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uProgress.value = progress
    }
  })

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  )
}
