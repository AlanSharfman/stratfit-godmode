import React, { useMemo } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, HEALTH_ELEVATION, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpis: PositionKpis
  highlightKpi?: KpiKey
  afterKpis?: PositionKpis
  width?: number
  height?: number
}

function getElevation(kpi: KpiKey, kpis: PositionKpis): number {
  const health = getHealthLevel(kpi, kpis)
  return HEALTH_ELEVATION[health]
}

function buildPath(heights: number[], w: number, h: number, padY: number): string {
  const n = heights.length
  const step = w / (n - 1)
  const maxH = 14
  const points = heights.map((elev, i) => {
    const x = i * step
    const y = h - padY - (elev / maxH) * (h - padY * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M0,${h} L${points.join(" L")} L${w},${h} Z`
}

export default function MiniTerrainSilhouette({
  kpis,
  highlightKpi,
  afterKpis,
  width = 160,
  height = 48,
}: Props) {
  const beforeHeights = useMemo(
    () => KPI_KEYS.map((k) => getElevation(k, kpis)),
    [kpis],
  )

  const afterHeights = useMemo(
    () => afterKpis ? KPI_KEYS.map((k) => getElevation(k, afterKpis)) : null,
    [afterKpis],
  )

  const padY = 4

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", borderRadius: 4 }}
    >
      <defs>
        <linearGradient id="before-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,220,240,0.15)" />
          <stop offset="100%" stopColor="rgba(200,220,240,0.03)" />
        </linearGradient>
        <linearGradient id="after-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0.04)" />
        </linearGradient>
      </defs>

      <path
        d={buildPath(beforeHeights, width, height, padY)}
        fill="url(#before-grad)"
        stroke="rgba(200,220,240,0.2)"
        strokeWidth={1}
      />

      {afterHeights && (
        <path
          d={buildPath(afterHeights, width, height, padY)}
          fill="url(#after-grad)"
          stroke="rgba(34,211,238,0.5)"
          strokeWidth={1}
        />
      )}

      {highlightKpi && (
        (() => {
          const idx = KPI_KEYS.indexOf(highlightKpi)
          if (idx < 0) return null
          const step = width / (KPI_KEYS.length - 1)
          const x = idx * step
          return (
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="rgba(34,211,238,0.4)"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )
        })()
      )}
    </svg>
  )
}
