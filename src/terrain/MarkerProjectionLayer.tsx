// src/terrain/MarkerProjectionLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Marker Projection Layer
//
// Renders a persistent vertical "laser beam" at each StrategicMarker
// position — independent of the strategic path.
//
// Each beam rises from the terrain surface upward with a downward-travelling
// energy-pulse shader. Mounted inside TerrainStage (R3F Canvas context).
// Uses depthTest:false so beams are always visible through terrain.
//
// Data source: STRATEGIC_MARKERS (same list as StrategicMarkers).
// Controlled by: showMarkers && !hideMarkers in TerrainStage.
// ═══════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { STRATEGIC_MARKERS } from "./strategicMarkerDefs"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"

// ── Constants ────────────────────────────────────────────────────────────────

const BEAM_COLOR = new THREE.Color(0x00e5ff)
/** How far above terrain surface each beam extends (world units) */
const BEAM_HEIGHT = 70
/** Fraction of beam height that remains fully opaque at the base */
const BASE_SOLID = 0.12
const PULSE_SPEED = 2.2
const SEGMENTS = 40

// ── Shaders ─────────────────────────────────────────────────────────────────

const VERT = /* glsl */ `
  uniform float uGroundY;
  uniform float uTopY;
  varying float vT;
  void main() {
    float range = max(uTopY - uGroundY, 0.001);
    vT = clamp((position.y - uGroundY) / range, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uPulseSpeed;
  varying float vT;
  void main() {
    // Height fade: full opacity at base, transparent at top
    float fade  = pow(1.0 - vT, 1.4);
    // Travelling wave moving downward (vT decreases toward ground)
    float wave  = 0.45 + 0.55 * abs(sin(vT * 7.0 - uTime * uPulseSpeed));
    float alpha = fade * wave * 0.72;
    gl_FragColor = vec4(uColor, alpha);
  }
`

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>
}

interface BeamEntry {
  line: THREE.Line
  mat: THREE.ShaderMaterial
}

function MarkerProjectionLayer({ terrainRef }: Props) {
  const { scene } = useThree()
  const beamsRef = useRef<BeamEntry[]>([])

  // Build one Line per marker, add imperatively to R3F scene
  useEffect(() => {
    const terrain = terrainRef.current

    const beams: BeamEntry[] = STRATEGIC_MARKERS.map((marker) => {
      const mx = marker.position.x
      const mz = marker.position.z
      const groundY = terrain ? terrain.getHeightAt(mx, mz) : 0
      const topY = groundY + BEAM_HEIGHT

      const points: THREE.Vector3[] = []
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS
        points.push(new THREE.Vector3(mx, groundY + t * (topY - groundY), mz))
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points)

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime:       { value: 0 },
          uColor:      { value: BEAM_COLOR.clone() },
          uGroundY:    { value: groundY },
          uTopY:       { value: topY },
          uPulseSpeed: { value: PULSE_SPEED },
        },
        vertexShader:   VERT,
        fragmentShader: FRAG,
      })

      const line = new THREE.Line(geo, mat)
      line.frustumCulled = false
      line.renderOrder = 22
      scene.add(line)

      return { line, mat }
    })

    beamsRef.current = beams

    return () => {
      for (const { line, mat } of beams) {
        scene.remove(line)
        line.geometry.dispose()
        mat.dispose()
      }
      beamsRef.current = []
    }
  }, [scene, terrainRef])

  // Animate pulse time uniform
  useFrame((_, delta) => {
    for (const { mat } of beamsRef.current) {
      mat.uniforms.uTime.value += delta
    }
  })

  return null
}

export default memo(MarkerProjectionLayer)
