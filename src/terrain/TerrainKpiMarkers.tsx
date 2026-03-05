import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useLoader } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { PRIMARY_KPI_KEYS, PRIMARY_ANCHOR_POSITIONS, KPI_CATEGORY_COLORS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  focusedKpi: KpiKey | null
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
  visible: boolean
}

const BASE_SIZE = 22
const FOCUSED_SIZE = 30
const STORYLINE_SIZE = 28
const HOVER_Y_OFFSET = 18
const REST_Y_OFFSET = 13
const STORYLINE_Y_OFFSET = 20

const STORY_INITIAL_DELAY = 1.0
const STORY_PER_KPI = 1.1
const STORY_TOTAL = STORY_INITIAL_DELAY + PRIMARY_KPI_KEYS.length * STORY_PER_KPI

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
    float cyanness = smoothstep(1.1, 1.5, gb) * smoothstep(0.25, 0.08, rRatio);

    float brightness = max(tex.r, max(tex.g, tex.b));
    float brightEdge = smoothstep(0.75, 0.90, brightness) * step(tex.r * 2.0, gb) * 0.7;
    float bandMask = clamp(max(cyanness, brightEdge), 0.0, 1.0);

    float bandLum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 tintedBand = uTint * (bandLum * 2.4 + 0.7 + uGlowStrength * 0.5);

    vec3 result = mix(tex.rgb, tintedBand, bandMask);
    result += uTint * bandMask * (0.25 + uGlowStrength * 0.4);

    gl_FragColor = vec4(result, tex.a * uOpacity);
  }
`

function createMarkerMaterial(texture: THREE.Texture, tint: THREE.Color): THREE.ShaderMaterial {
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
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
}

function createGlowDiscTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, "rgba(255,255,255,0.6)")
  gradient.addColorStop(0.3, "rgba(255,255,255,0.25)")
  gradient.addColorStop(0.7, "rgba(255,255,255,0.05)")
  gradient.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

let _glowDiscTex: THREE.Texture | null = null
function getGlowDiscTexture(): THREE.Texture {
  if (!_glowDiscTex) _glowDiscTex = createGlowDiscTexture()
  return _glowDiscTex
}

export default function TerrainKpiMarkers({ terrainRef, focusedKpi, kpis, revealedKpis, visible }: Props) {
  const texture = useLoader(THREE.TextureLoader, "/stratfit-logo.png")

  useMemo(() => {
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
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

  // Storyline trigger — restart when KPIs change (first load or recalculation)
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
        <KpiLogoMarker
          key={m.key}
          kpiKey={m.key}
          worldX={m.worldX}
          color={m.color}
          isFocused={focusedKpi === m.key}
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

function KpiLogoMarker({ kpiKey, worldX, color, isFocused, storyIndex, storylineClockStart, terrainRef, texture, aspect }: {
  kpiKey: KpiKey
  worldX: number
  color: { hex: string; r: number; g: number; b: number }
  isFocused: boolean
  storyIndex: number
  storylineClockStart: React.MutableRefObject<number>
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  texture: THREE.Texture
  aspect: number
}) {
  const spriteRef = useRef<THREE.Sprite>(null)
  const glowRef = useRef<THREE.Sprite>(null)
  const tintColor = useMemo(() => new THREE.Color(color.r, color.g, color.b), [color])
  const mat = useMemo(() => createMarkerMaterial(texture, tintColor), [texture, tintColor])
  const glowTex = useMemo(() => getGlowDiscTexture(), [])

  const glowMat = useMemo(() => new THREE.SpriteMaterial({
    map: glowTex,
    color: tintColor,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [glowTex, tintColor])

  useEffect(() => () => { mat.dispose(); glowMat.dispose() }, [mat, glowMat])

  useFrame(({ clock }) => {
    if (!spriteRef.current || !terrainRef.current) return

    // Initialise storyline clock on first frame
    if (storylineClockStart.current < 0) {
      storylineClockStart.current = clock.elapsedTime
    }

    // Compute storyline envelope for this marker
    const storyElapsed = clock.elapsedTime - storylineClockStart.current - STORY_INITIAL_DELAY
    const slotStart = storyIndex * STORY_PER_KPI
    const localT = (storyElapsed - slotStart) / STORY_PER_KPI
    const isStoryActive = localT >= 0 && localT < 1 && !isFocused
    const storyEnvelope = isStoryActive ? Math.sin(localT * Math.PI) : 0

    const h = terrainRef.current.getHeightAt(worldX, 0)
    const bob = Math.sin(clock.elapsedTime * 1.2 + worldX * 0.01) * 0.6

    let yOff: number
    let size: number
    let glow: number
    let opacity: number

    if (isFocused) {
      yOff = HOVER_Y_OFFSET
      size = FOCUSED_SIZE
      glow = 1.0
      opacity = 1.0
    } else if (storyEnvelope > 0.01) {
      yOff = REST_Y_OFFSET + (STORYLINE_Y_OFFSET - REST_Y_OFFSET) * storyEnvelope
      size = BASE_SIZE + (STORYLINE_SIZE - BASE_SIZE) * storyEnvelope
      glow = storyEnvelope
      opacity = 0.85 + 0.15 * storyEnvelope
    } else {
      yOff = REST_Y_OFFSET
      size = BASE_SIZE
      glow = 0
      opacity = 0.85
    }

    spriteRef.current.position.set(worldX, h + yOff + bob, 0)
    spriteRef.current.scale.set(size * aspect, size, 1)
    mat.uniforms.uGlowStrength.value = glow
    mat.uniforms.uOpacity.value = opacity

    // Ground glow disc
    if (glowRef.current) {
      const glowSize = 45 * storyEnvelope
      glowRef.current.position.set(worldX, h + 1, 0)
      glowRef.current.scale.set(glowSize, glowSize * 0.3, 1)
      glowMat.opacity = storyEnvelope * 0.35
    }
  })

  return (
    <>
      <sprite ref={spriteRef} renderOrder={15} name={`kpi-marker-${kpiKey}`}>
        <primitive object={mat} attach="material" />
      </sprite>
      <sprite ref={glowRef} renderOrder={4} name={`kpi-glow-${kpiKey}`}>
        <primitive object={glowMat} attach="material" />
      </sprite>
    </>
  )
}
