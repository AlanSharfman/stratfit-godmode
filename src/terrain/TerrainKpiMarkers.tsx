import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useLoader } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, KPI_KEYS, KPI_CATEGORY_COLORS } from "@/domain/intelligence/kpiZoneMapping"
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

const BASE_SIZE = 20
const FOCUSED_SIZE = 28
const HOVER_Y_OFFSET = 18
const REST_Y_OFFSET = 13

/*
 * Minimal shader: renders the logo texture faithfully, only replacing
 * the cyan glowing band with the KPI tint colour.
 *
 * Detection uses direct RGB distance from the original cyan (~0.13, 0.83, 0.93
 * in sRGB). Pixels close to that hue get their color replaced. Everything else
 * passes through untouched — preserving the metallic 3D body exactly.
 *
 * NOTE: Three.js decodes SRGBColorSpace textures to LINEAR before the shader
 * sees them, so reference colours are in linear space.
 */
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

    // Hard alpha cutoff
    if (tex.a < 0.05) discard;

    // The original cyan band is approximately (0.13, 0.83, 0.93) in sRGB.
    // In linear space after sRGB decode: ~(0.015, 0.65, 0.85).
    // Detect by checking: is (G+B) high and R relatively low?
    float gb = tex.g + tex.b;
    float cyanness = smoothstep(0.6, 1.0, gb) * smoothstep(0.35, 0.15, tex.r / max(gb, 0.001));

    // Also catch the bright white-ish highlights at band edges
    float brightness = (tex.r + tex.g + tex.b) / 3.0;
    float isBright = smoothstep(0.55, 0.75, brightness);
    // Only count bright pixels that also have a cyan lean (B+G > R*2)
    float brightCyan = isBright * step(tex.r * 2.5, gb);

    float bandMask = clamp(max(cyanness, brightCyan * 0.8), 0.0, 1.0);

    // Replace band colour with KPI tint — preserve luminance structure
    float bandLum = brightness;
    vec3 tintedBand = uTint * (bandLum * 2.0 + 0.3 + uGlowStrength * 0.4);
    vec3 result = mix(tex.rgb, tintedBand, bandMask);

    // Subtle neon bloom ON the band only (no bleed into metal)
    result += uTint * bandMask * (0.15 + uGlowStrength * 0.3);

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

export default function TerrainKpiMarkers({ terrainRef, focusedKpi, kpis, revealedKpis, visible }: Props) {
  const texture = useLoader(THREE.TextureLoader, "/stratfit-logo.png")

  useMemo(() => {
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
    texture.colorSpace = THREE.SRGBColorSpace
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
    return KPI_KEYS.filter(k => revealedKpis.has(k)).map(key => {
      const zone = KPI_ZONE_MAP[key]
      const color = KPI_CATEGORY_COLORS[key]
      const nx = (zone.xStart + zone.xEnd) / 2
      const worldX = (nx - 0.5) * TERRAIN_CONSTANTS.width * 3.0
      return { key, worldX, color }
    })
  }, [kpis, revealedKpis, visible])

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
          terrainRef={terrainRef}
          texture={texture}
          aspect={aspect}
        />
      ))}
    </group>
  )
}

function KpiLogoMarker({ kpiKey, worldX, color, isFocused, terrainRef, texture, aspect }: {
  kpiKey: KpiKey
  worldX: number
  color: { hex: string; r: number; g: number; b: number }
  isFocused: boolean
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  texture: THREE.Texture
  aspect: number
}) {
  const spriteRef = useRef<THREE.Sprite>(null)
  const tintColor = useMemo(() => new THREE.Color(color.r, color.g, color.b), [color])
  const mat = useMemo(() => createMarkerMaterial(texture, tintColor), [texture, tintColor])

  useEffect(() => () => { mat.dispose() }, [mat])

  useFrame(({ clock }) => {
    if (!spriteRef.current || !terrainRef.current) return
    const h = terrainRef.current.getHeightAt(worldX, 0)
    const yOff = isFocused ? HOVER_Y_OFFSET : REST_Y_OFFSET
    const bob = Math.sin(clock.elapsedTime * 1.2 + worldX * 0.01) * 0.6

    const size = isFocused ? FOCUSED_SIZE : BASE_SIZE
    spriteRef.current.position.set(worldX, h + yOff + bob, 0)
    spriteRef.current.scale.set(size * aspect, size, 1)

    mat.uniforms.uGlowStrength.value = isFocused ? 1.0 : 0.0
    mat.uniforms.uOpacity.value = isFocused ? 1.0 : 0.85
  })

  return (
    <sprite ref={spriteRef} renderOrder={15} name={`kpi-marker-${kpiKey}`}>
      <primitive object={mat} attach="material" />
    </sprite>
  )
}
