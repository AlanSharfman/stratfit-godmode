import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface RiskCascadeVizProps {
  kpis: PositionKpis
}

const NODE_COLORS = {
  strong: "#34d399",
  healthy: "#34d399",
  watch: "#fbbf24",
  critical: "#f87171",
}

const POSITIONS: Record<KpiKey, { x: number; y: number }> = {
  cash: { x: 80, y: 40 },
  runway: { x: 200, y: 40 },
  growth: { x: 350, y: 40 },
  arr: { x: 80, y: 130 },
  revenue: { x: 200, y: 130 },
  burn: { x: 350, y: 130 },
  churn: { x: 80, y: 220 },
  grossMargin: { x: 200, y: 220 },
  efficiency: { x: 350, y: 220 },
  enterpriseValue: { x: 200, y: 310 },
}

export default function RiskCascadeViz({ kpis }: RiskCascadeVizProps) {
  const [hoveredKpi, setHoveredKpi] = useState<KpiKey | null>(null)

  const edges = useMemo(() => {
    const result: { from: KpiKey; to: KpiKey; weight: number }[] = []
    for (const [from, targets] of Object.entries(KPI_GRAPH)) {
      for (const { target, weight } of targets) {
        result.push({ from: from as KpiKey, to: target, weight })
      }
    }
    return result
  }, [])

  const propagation = useMemo(() => {
    if (!hoveredKpi) return null
    return propagateForce(KPI_GRAPH, hoveredKpi, -1)
  }, [hoveredKpi])

  const downstreamSet = useMemo(() => {
    if (!propagation) return new Set<KpiKey>()
    return new Set(propagation.affected.keys())
  }, [propagation])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)", marginBottom: 10 }}>
        Risk Cascade Network
      </div>

      <svg width="430" height="350" viewBox="0 0 430 350" style={{ display: "block" }}>
        {/* Edges */}
        {edges.map(({ from, to, weight }, i) => {
          const f = POSITIONS[from]
          const t = POSITIONS[to]
          const isActive = hoveredKpi === from || downstreamSet.has(to)
          return (
            <motion.line
              key={i}
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={isActive ? "rgba(34,211,238,0.4)" : "rgba(200,220,240,0.06)"}
              strokeWidth={isActive ? Math.max(1, weight * 3) : 0.5}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
            />
          )
        })}

        {/* Nodes */}
        {KPI_KEYS.map((kpi) => {
          const pos = POSITIONS[kpi]
          const health = getHealthLevel(kpi, kpis)
          const color = NODE_COLORS[health]
          const isHovered = kpi === hoveredKpi
          const isAffected = downstreamSet.has(kpi)
          const impact = propagation?.get(kpi)

          return (
            <g
              key={kpi}
              onMouseEnter={() => setHoveredKpi(kpi)}
              onMouseLeave={() => setHoveredKpi(null)}
              style={{ cursor: "pointer" }}
            >
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={isHovered ? 22 : isAffected ? 20 : 16}
                fill={isHovered || isAffected ? color : `${color}33`}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1}
                initial={false}
                animate={{ r: isHovered ? 22 : isAffected ? 20 : 16 }}
                transition={{ duration: 0.2 }}
                opacity={isHovered || isAffected || !hoveredKpi ? 1 : 0.3}
              />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle" dominantBaseline="central"
                fill={isHovered || isAffected ? "#fff" : "rgba(200,220,240,0.6)"}
                fontSize={8} fontWeight={600} fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {kpi.slice(0, 5).toUpperCase()}
              </text>
              {/* Impact label */}
              {isAffected && impact != null && (
                <text
                  x={pos.x} y={pos.y + 28}
                  textAnchor="middle"
                  fill={impact < 0 ? "#f87171" : "#34d399"}
                  fontSize={9} fontWeight={700} fontFamily="monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {impact > 0 ? "+" : ""}{(impact * 100).toFixed(0)}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div style={{ fontSize: 9, color: "rgba(200,220,240,0.15)", marginTop: 6, textAlign: "center" }}>
        Hover a node to see cascade propagation
      </div>
    </div>
  )
}
