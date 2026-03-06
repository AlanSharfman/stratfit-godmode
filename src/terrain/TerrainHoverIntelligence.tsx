import React, { memo, useRef, useState, useMemo, useCallback } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { ProgressiveTerrainHandle } from "@/terrain/ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import {
  KPI_KEYS, KPI_ZONE_MAP,
  getHealthLevel,
  type KpiKey, type HealthLevel,
} from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

/* ═══════════════════════════════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════════════════════════════ */

const THROTTLE_MS = 33
const GLOW_RADIUS = 20
const GLOW_Y_LIFT = 0.6
const TOOLTIP_Y_LIFT = 18

const HOVER_COLORS: Record<KpiKey, string> = {
  cash:            "#34d399",
  runway:          "#3b82f6",
  growth:          "#ef4444",
  arr:             "#f59e0b",
  revenue:         "#22d3ee",
  burn:            "#a855f7",
  churn:           "#2dd4bf",
  grossMargin:     "#22d3ee",
  headcount:       "#7dd3fc",
  enterpriseValue: "#eab308",
}

/* ═══════════════════════════════════════════════════════════════════════
   Zone intelligence — brief contextual sentences per health level
   ═══════════════════════════════════════════════════════════════════════ */

const ZONE_INTEL: Record<KpiKey, Record<HealthLevel, string>> = {
  cash: {
    critical: "Cash reserves critically low — liquidity action required.",
    watch:    "Cash position thinning — monitor burn trajectory.",
    healthy:  "Liquidity stable — capital supports continued execution.",
    strong:   "Strong cash position — strategic investment capacity available.",
  },
  runway: {
    critical: "Runway dangerously short — survival timeline compressed.",
    watch:    "Runway narrowing — efficiency or capital needed soon.",
    healthy:  "Runway provides comfortable operating window.",
    strong:   "Extended runway — operational freedom to pursue growth.",
  },
  growth: {
    critical: "Growth stalled — compounding effects negligible.",
    watch:    "Growth below inflection — acceleration needed.",
    healthy:  "Growth momentum building — terrain gradient steepening.",
    strong:   "Exceptional growth — compounding reshapes valuation rapidly.",
  },
  arr: {
    critical: "ARR at early stage — revenue engine still forming.",
    watch:    "ARR developing — product-market signal emerging.",
    healthy:  "ARR building — recurring revenue compounding.",
    strong:   "Strong ARR — revenue engine driving terrain elevation.",
  },
  revenue: {
    critical: "Revenue flow minimal — growth signals needed.",
    watch:    "Revenue building but below scale threshold.",
    healthy:  "Revenue flow sustaining elevation through the corridor.",
    strong:   "Revenue growth is lifting enterprise value trajectory.",
  },
  burn: {
    critical: "Burn rate creating severe terrain pressure.",
    watch:    "Elevated burn generating moderate friction.",
    healthy:  "Burn rate manageable — efficiency gradients smooth.",
    strong:   "Disciplined burn — terrain reflects capital efficiency.",
  },
  churn: {
    critical: "Retention wall collapsed — growth fighting attrition.",
    watch:    "Retention eroding — acquisitions compensating departures.",
    healthy:  "Retention solid — small improvements compound powerfully.",
    strong:   "Excellent retention — durable ARR compounding foundation.",
  },
  grossMargin: {
    critical: "Margins below sustainable threshold — unit economics fragile.",
    watch:    "Margin ridge developing — improvement unlocks scalability.",
    healthy:  "Healthy margins — stable ridge supporting growth.",
    strong:   "Strong margins — wide ridge forms scalable foundation.",
  },
  headcount: {
    critical: "Team too lean — resource constraints limit execution.",
    watch:    "Small team — every hire has outsized velocity impact.",
    healthy:  "Team supports multi-stream execution.",
    strong:   "Deep talent pool — organisational leverage is structural.",
  },
  enterpriseValue: {
    critical: "Value summit still forming — growth and margin are key.",
    watch:    "Enterprise value emerging — multiple expansion ahead.",
    healthy:  "Value summit building — sustain to hold elevation.",
    strong:   "Well-defined peak — maintaining requires all KPI discipline.",
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   Glow shader
   ═══════════════════════════════════════════════════════════════════════ */

const GLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GLOW_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uPulse;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.15, d) * (0.18 + 0.08 * uPulse);
    gl_FragColor = vec4(uColor, alpha);
  }
`

/* ═══════════════════════════════════════════════════════════════════════
   Tooltip styles
   ═══════════════════════════════════════════════════════════════════════ */

const tipStyle = (color: string): React.CSSProperties => ({
  padding: "8px 14px",
  borderRadius: 8,
  background: "rgba(6, 12, 20, 0.92)",
  border: `1px solid ${color}30`,
  boxShadow: `0 0 12px ${color}18, 0 4px 16px rgba(0,0,0,0.5)`,
  backdropFilter: "blur(12px)",
  fontFamily: "'Inter', system-ui, sans-serif",
  pointerEvents: "none" as const,
  userSelect: "none" as const,
  whiteSpace: "nowrap" as const,
  maxWidth: 280,
})

const tipTitle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 3,
  lineHeight: 1.3,
}

const tipBody: React.CSSProperties = {
  fontSize: 10,
  lineHeight: 1.5,
  color: "rgba(148,163,184,0.9)",
  whiteSpace: "normal",
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function findKpiZone(normalizedX: number): KpiKey | null {
  const clamped = Math.max(0, Math.min(1, normalizedX))
  for (const key of KPI_KEYS) {
    const zone = KPI_ZONE_MAP[key]
    if (clamped >= zone.xStart && clamped < zone.xEnd) return key
  }
  if (clamped >= 0.9) return "enterpriseValue"
  return null
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  kpis: PositionKpis | null
}

interface TooltipData {
  kpiKey: KpiKey
  zoneName: string
  intel: string
  color: string
}

const TerrainHoverIntelligence: React.FC<Props> = memo(({ terrainRef, kpis }) => {
  const { raycaster, pointer, camera } = useThree()
  const glowRef = useRef<THREE.Mesh>(null)
  const tooltipGroupRef = useRef<THREE.Group>(null)
  const lastTickRef = useRef(0)
  const lastZoneRef = useRef<KpiKey | null>(null)

  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(0x22d3ee) },
          uPulse: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const glowGeo = useMemo(() => new THREE.CircleGeometry(GLOW_RADIUS, 32), [])

  const clearHover = useCallback(() => {
    if (glowRef.current) glowRef.current.visible = false
    if (tooltipGroupRef.current) tooltipGroupRef.current.visible = false
    if (lastZoneRef.current !== null) {
      lastZoneRef.current = null
      setTooltip(null)
    }
  }, [])

  useFrame(({ clock }) => {
    const now = clock.elapsedTime * 1000
    if (now - lastTickRef.current < THROTTLE_MS) return
    lastTickRef.current = now

    const mesh = terrainRef.current?.solidMesh
    if (!mesh || !kpis) {
      clearHover()
      return
    }

    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObject(mesh)

    if (hits.length === 0) {
      clearHover()
      return
    }

    const hit = hits[0]
    const halfW = (TERRAIN_CONSTANTS.width * 3.0) / 2
    const normalizedX = (hit.point.x + halfW) / (halfW * 2)
    const kpiKey = findKpiZone(normalizedX)

    if (!kpiKey) {
      clearHover()
      return
    }

    // Position glow disc at hit point
    if (glowRef.current) {
      glowRef.current.visible = true
      glowRef.current.position.set(hit.point.x, hit.point.y + GLOW_Y_LIFT, hit.point.z)
    }

    // Pulse animation
    const pulse = Math.sin(clock.elapsedTime * 2.5) * 0.5 + 0.5
    glowMat.uniforms.uPulse.value = pulse

    // Position tooltip
    if (tooltipGroupRef.current) {
      tooltipGroupRef.current.visible = true
      tooltipGroupRef.current.position.set(
        hit.point.x,
        hit.point.y + TOOLTIP_Y_LIFT,
        hit.point.z,
      )
    }

    // Update color + tooltip content when zone changes
    if (kpiKey !== lastZoneRef.current) {
      lastZoneRef.current = kpiKey
      const color = HOVER_COLORS[kpiKey]
      glowMat.uniforms.uColor.value.set(new THREE.Color(color))

      const health = getHealthLevel(kpiKey, kpis)
      setTooltip({
        kpiKey,
        zoneName: KPI_ZONE_MAP[kpiKey].stationName,
        intel: ZONE_INTEL[kpiKey][health],
        color,
      })
    }
  })

  return (
    <>
      {/* Glow disc — horizontal, tracks cursor */}
      <mesh
        ref={glowRef}
        geometry={glowGeo}
        material={glowMat}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        renderOrder={5}
      />

      {/* Tooltip — Html overlay, tracks cursor */}
      <group ref={tooltipGroupRef} visible={false}>
        {tooltip && (
          <Html center style={{ pointerEvents: "none" }}>
            <div style={tipStyle(tooltip.color)}>
              <div style={{ ...tipTitle, color: tooltip.color }}>
                {tooltip.zoneName}
              </div>
              <div style={tipBody}>{tooltip.intel}</div>
            </div>
          </Html>
        )}
      </group>
    </>
  )
})

TerrainHoverIntelligence.displayName = "TerrainHoverIntelligence"
export default TerrainHoverIntelligence
