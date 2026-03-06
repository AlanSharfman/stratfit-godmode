import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useLoader, useThree } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { PRIMARY_KPI_KEYS, PRIMARY_ANCHOR_POSITIONS, KPI_CATEGORY_COLORS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  focusedKpi: KpiKey | null
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  visible: boolean
}

const CUBE_SIZE = 14
const CUBE_DEPTH = 6
const NEON_HEIGHT = 5
const LOGO_FACE_INSET = 0.05

const FOCUSED_SCALE = 1.35
const STORYLINE_SCALE = 1.18

const REST_Y_LIFT = 22
const HOVER_Y_LIFT = 30
const STORYLINE_Y_LIFT = 26
const TERRAIN_SURFACE_LIFT = 0.25

const STORY_INITIAL_DELAY = 1.0
const STORY_PER_KPI = 1.1

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uGlowStrength;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < 0.05) discard;

    float gb = tex.g + tex.b;
    float rRatio = tex.r / max(gb, 0.001);
    float cyanness = smoothstep(0.8, 1.3, gb) * smoothstep(0.35, 0.10, rRatio);

    float brightness = max(tex.r, max(tex.g, tex.b));
    float brightEdge = smoothstep(0.55, 0.80, brightness) * step(tex.r * 1.8, gb) * 0.9;
    float bandMask = clamp(max(cyanness, brightEdge), 0.0, 1.0);

    float bandLum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 tintedBand = uTint * (bandLum * 3.2 + 1.1 + uGlowStrength * 0.8);

    vec3 result = mix(tex.rgb, tintedBand, bandMask);
    result += uTint * bandMask * (0.45 + uGlowStrength * 0.6);

    vec3 boosted = result * 1.4 + 0.08;
    gl_FragColor = vec4(boosted, tex.a * uOpacity);
  }
`

/* ── Shared geometries (created once, reused by all markers) ── */
let _cubeGeo: THREE.BoxGeometry | null = null
let _neonGeo: THREE.BoxGeometry | null = null
let _logoGeo: THREE.PlaneGeometry | null = null

function getCubeGeo() {
  if (!_cubeGeo) _cubeGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_DEPTH)
  return _cubeGeo
}
function getNeonGeo() {
  if (!_neonGeo) _neonGeo = new THREE.BoxGeometry(CUBE_SIZE + 1.5, NEON_HEIGHT, CUBE_DEPTH + 1.5)
  return _neonGeo
}
function getLogoGeo(aspect: number) {
  const w = CUBE_SIZE * 0.88
  if (!_logoGeo) _logoGeo = new THREE.PlaneGeometry(w * aspect, w)
  return _logoGeo
}

/* ── Materials ── */
function createLogoMaterial(texture: THREE.Texture, tint: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uTint: { value: tint },
      uOpacity: { value: 1.0 },
      uGlowStrength: { value: 0.0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
}

function createCubeMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x2a3a55,
    emissive: 0x3a506e,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.65,
    transparent: false,
    depthWrite: true,
  })
}

function createNeonMaterial(color: THREE.Color): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
    depthWrite: true,
  })
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function TerrainKpiMarkers({ terrainRef, focusedKpi, onFocusKpi, onClickKpi, onFocusedMarkerScreen, kpis, revealedKpis, visible }: Props) {
  const texture = useLoader(THREE.TextureLoader, "/stratfit-logo.png")

  useMemo(() => {
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
    texture.colorSpace = THREE.SRGBColorSpace
    texture.premultiplyAlpha = false
    texture.generateMipmaps = true
    texture.needsUpdate = true
  }, [texture])

  const aspect = useMemo(() => {
    if (texture.image) {
      const img = texture.image as HTMLImageElement
      return img.width && img.height ? img.width / img.height : 1
    }
    return 1
  }, [texture])

  const markers = useMemo(() => {
    if (!kpis || !visible) return []
    return PRIMARY_KPI_KEYS.filter(k => revealedKpis.has(k)).map((key, idx) => {
      const anchor = PRIMARY_ANCHOR_POSITIONS.get(key)
      const color = KPI_CATEGORY_COLORS[key]
      const cx = anchor?.cx ?? 0.5
      const worldX = (cx - 0.5) * TERRAIN_CONSTANTS.width * 3.0
      return { key, worldX, color, storyIndex: idx }
    })
  }, [kpis, revealedKpis, visible])

  const storylineClockStart = useRef(-1)
  const prevKpiHash = useRef("")

  const kpiHash = useMemo(() => {
    if (!kpis) return ""
    return `${kpis.cashOnHand}|${kpis.runwayMonths}|${kpis.growthRatePct}|${kpis.revenueMonthly}|${kpis.burnMonthly}|${kpis.valuationEstimate}`
  }, [kpis])

  useEffect(() => {
    if (markers.length > 0 && kpiHash && prevKpiHash.current !== kpiHash) {
      prevKpiHash.current = kpiHash
      storylineClockStart.current = -1
    }
  }, [markers.length, kpiHash])

  if (!visible || markers.length === 0) return null

  return (
    <group name="kpi-terrain-markers">
      {markers.map(m => (
        <KpiBeaconMarker
          key={m.key}
          kpiKey={m.key}
          worldX={m.worldX}
          color={m.color}
          isFocused={focusedKpi === m.key}
          onFocusKpi={onFocusKpi}
          onClickKpi={onClickKpi}
          onFocusedMarkerScreen={onFocusedMarkerScreen}
          storyIndex={m.storyIndex}
          storylineClockStart={storylineClockStart}
          terrainRef={terrainRef}
          texture={texture}
          aspect={aspect}
        />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════
   3D BEACON MARKER — True 3D cube with neon sandwich
   ═══════════════════════════════════════════════════════════════ */

function KpiBeaconMarker({ kpiKey, worldX, color, isFocused, onFocusKpi, onClickKpi, onFocusedMarkerScreen, storyIndex, storylineClockStart, terrainRef, texture, aspect }: {
  kpiKey: KpiKey
  worldX: number
  color: { hex: string; r: number; g: number; b: number }
  isFocused: boolean
  onFocusKpi?: (kpi: KpiKey | null) => void
  onClickKpi?: (kpi: KpiKey | null) => void
  onFocusedMarkerScreen?: (pos: { x: number; y: number } | null) => void
  storyIndex: number
  storylineClockStart: React.MutableRefObject<number>
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  texture: THREE.Texture
  aspect: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const topCubeRef = useRef<THREE.Mesh>(null)
  const bottomCubeRef = useRef<THREE.Mesh>(null)
  const neonRef = useRef<THREE.Mesh>(null)
  const logoRef = useRef<THREE.Mesh>(null)
  const hasProjected = useRef(false)
  const { camera, gl } = useThree()

  const tintColor = useMemo(() => new THREE.Color(color.r, color.g, color.b), [color])
  const logoMat = useMemo(() => createLogoMaterial(texture, tintColor), [texture, tintColor])
  const topCubeMat = useMemo(() => createCubeMaterial(), [])
  const bottomCubeMat = useMemo(() => createCubeMaterial(), [])
  const neonMat = useMemo(() => createNeonMaterial(tintColor), [tintColor])

  const cubeGeo = useMemo(() => getCubeGeo(), [])
  const neonGeo = useMemo(() => getNeonGeo(), [])
  const logoGeo = useMemo(() => getLogoGeo(aspect), [aspect])

  const halfCube = CUBE_SIZE / 2
  const halfNeon = NEON_HEIGHT / 2

  useEffect(() => () => {
    logoMat.dispose()
    topCubeMat.dispose()
    bottomCubeMat.dispose()
    neonMat.dispose()
  }, [logoMat, topCubeMat, bottomCubeMat, neonMat])

  useFrame(({ clock }) => {
    if (!groupRef.current || !terrainRef.current) return

    if (storylineClockStart.current < 0) {
      storylineClockStart.current = clock.elapsedTime
    }

    const storyElapsed = clock.elapsedTime - storylineClockStart.current - STORY_INITIAL_DELAY
    const slotStart = storyIndex * STORY_PER_KPI
    const localT = (storyElapsed - slotStart) / STORY_PER_KPI
    const isStoryActive = localT >= 0 && localT < 1 && !isFocused
    const storyEnvelope = isStoryActive ? Math.sin(localT * Math.PI) : 0

    const h = terrainRef.current.getHeightAt(worldX, 0)
    const bob = Math.sin(clock.elapsedTime * 1.2 + worldX * 0.01) * 0.4

    let yLift: number
    let scale: number
    let glow: number

    if (isFocused) {
      yLift = HOVER_Y_LIFT
      scale = FOCUSED_SCALE
      glow = 1.0
    } else if (storyEnvelope > 0.01) {
      yLift = REST_Y_LIFT + (STORYLINE_Y_LIFT - REST_Y_LIFT) * storyEnvelope
      scale = 1.0 + (STORYLINE_SCALE - 1.0) * storyEnvelope
      glow = storyEnvelope
    } else {
      yLift = REST_Y_LIFT
      scale = 1.0
      glow = 0
    }

    const worldY = h + yLift + bob + TERRAIN_SURFACE_LIFT
    groupRef.current.position.set(worldX, worldY, 0)
    groupRef.current.scale.setScalar(scale)

    // Strobe the neon band when focused (clicked)
    if (isFocused) {
      const strobe = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 12.0)
      neonMat.emissiveIntensity = 2.2 + strobe * 3.0
      neonMat.opacity = 0.75 + strobe * 0.25
    } else {
      neonMat.emissiveIntensity = 2.2 + glow * 1.5
      neonMat.opacity = 0.95
    }

    // Cube brightness reacts to glow/focus
    const cubeEmissive = 0.45 + glow * 0.4
    topCubeMat.emissiveIntensity = cubeEmissive
    bottomCubeMat.emissiveIntensity = cubeEmissive

    // Logo face always looks at camera
    if (logoRef.current) {
      logoRef.current.lookAt(camera.position)
      logoMat.uniforms.uGlowStrength.value = glow
      logoMat.uniforms.uOpacity.value = 1.0
    }

    // Project focused marker to screen space (once per focus)
    if (isFocused && !hasProjected.current && onFocusedMarkerScreen) {
      hasProjected.current = true
      const v = new THREE.Vector3(worldX, worldY, 0)
      v.project(camera)
      const cw = gl.domElement.clientWidth
      const ch = gl.domElement.clientHeight
      onFocusedMarkerScreen({
        x: (v.x + 1) / 2 * cw,
        y: (-v.y + 1) / 2 * ch,
      })
    }
    if (!isFocused && hasProjected.current) {
      hasProjected.current = false
      onFocusedMarkerScreen?.(null)
    }
  })

  const handleClick = React.useCallback((e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.()
    const target = isFocused ? null : kpiKey
    onClickKpi?.(target)
    onFocusKpi?.(target)
  }, [onClickKpi, onFocusKpi, kpiKey, isFocused])

  const handlePointerOver = React.useCallback(() => {
    document.body.style.cursor = "pointer"
  }, [])

  const handlePointerOut = React.useCallback(() => {
    document.body.style.cursor = ""
  }, [])

  return (
    <group
      ref={groupRef}
      name={`kpi-beacon-${kpiKey}`}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Top cube block — bright metallic */}
      <mesh
        ref={topCubeRef}
        geometry={cubeGeo}
        material={topCubeMat}
        position={[0, halfNeon + halfCube, 0]}
        renderOrder={10}
      />

      {/* Neon sandwich band — emissive KPI-colored, strobes on click */}
      <mesh
        ref={neonRef}
        geometry={neonGeo}
        material={neonMat}
        position={[0, 0, 0]}
        renderOrder={11}
      />

      {/* Bottom cube block — bright metallic */}
      <mesh
        ref={bottomCubeRef}
        geometry={cubeGeo}
        material={bottomCubeMat}
        position={[0, -(halfNeon + halfCube), 0]}
        renderOrder={10}
      />

      {/* Logo face plate — camera-facing, sits on front of top cube */}
      <mesh
        ref={logoRef}
        geometry={logoGeo}
        position={[0, halfNeon + halfCube, CUBE_DEPTH / 2 + LOGO_FACE_INSET]}
        renderOrder={14}
      >
        <primitive object={logoMat} attach="material" />
      </mesh>
    </group>
  )
}
