import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, getHealthLevel, getHealthColor, type HealthColor } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce, type KpiEdge } from "@/engine/kpiDependencyGraph"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface ImpactChainVizProps {
  sourceKpi: KpiKey
  delta: number
  kpis: PositionKpis
  onClose?: () => void
}

interface ChainNode {
  kpi: KpiKey
  label: string
  delta: number
  hop: number
  health: string
  color: string
}

function colorToCss(c: HealthColor): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`
}

function fmtDelta(v: number): string {
  const sign = v >= 0 ? "+" : ""
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${sign}${(v / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${sign}${(v / 1e3).toFixed(0)}K`
  if (abs < 1) return `${sign}${(v * 100).toFixed(1)}%`
  return `${sign}${v.toFixed(1)}`
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const HOP_COLORS = [
  "rgba(34,211,238,0.9)",
  "rgba(168,85,247,0.8)",
  "rgba(251,191,36,0.8)",
  "rgba(248,113,113,0.7)",
  "rgba(200,220,240,0.4)",
]

export default React.memo(function ImpactChainViz({ sourceKpi, delta, kpis, onClose }: ImpactChainVizProps) {
  const [expandedHop, setExpandedHop] = useState<number | null>(null)

  const chain = useMemo(() => {
    const { affected, hops } = propagateForce(KPI_GRAPH, sourceKpi, delta, 4, 0.6)
    const nodes: ChainNode[] = []

    for (const [kpi, d] of affected) {
      const hop = hops.get(kpi) ?? 0
      const health = getHealthLevel(kpi, kpis)
      const color = colorToCss(getHealthColor(health))
      nodes.push({ kpi, label: KPI_ZONE_MAP[kpi].label, delta: d, hop, health, color })
    }

    nodes.sort((a, b) => a.hop - b.hop || Math.abs(b.delta) - Math.abs(a.delta))
    return nodes
  }, [sourceKpi, delta, kpis])

  const hopGroups = useMemo(() => {
    const groups = new Map<number, ChainNode[]>()
    for (const n of chain) {
      const list = groups.get(n.hop) ?? []
      list.push(n)
      groups.set(n.hop, list)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b)
  }, [chain])

  const edges = useMemo(() => {
    const result: { from: KpiKey; to: KpiKey; weight: number; fromHop: number }[] = []
    const chainKpis = new Set(chain.map(n => n.kpi))
    const hopMap = new Map(chain.map(n => [n.kpi, n.hop]))

    for (const edge of KPI_GRAPH.edges) {
      if (chainKpis.has(edge.from) && chainKpis.has(edge.to)) {
        const fromHop = hopMap.get(edge.from) ?? 0
        const toHop = hopMap.get(edge.to) ?? 0
        if (toHop > fromHop) {
          result.push({ ...edge, fromHop })
        }
      }
    }
    return result
  }, [chain])

  const hopLabels = ["SOURCE", "1st ORDER", "2nd ORDER", "3rd ORDER", "4th ORDER"]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: "linear-gradient(145deg, rgba(10,18,32,0.98), rgba(12,20,34,0.99))",
        border: "1px solid rgba(34,211,238,0.12)",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 12px 48px rgba(0,0,0,0.6), 0 0 32px rgba(34,211,238,0.04)",
        fontFamily: "'Inter', system-ui, sans-serif",
        width: "100%", maxWidth: 680,
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 18px",
        borderBottom: "1px solid rgba(34,211,238,0.06)",
        background: "rgba(34,211,238,0.02)",
      }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(34,211,238,0.5)", textTransform: "uppercase" }}>
            Impact Chain
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(200,220,240,0.85)", marginTop: 2 }}>
            {KPI_ZONE_MAP[sourceKpi].label} → {chain.length - 1} affected zone{chain.length - 1 !== 1 ? "s" : ""}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "rgba(200,220,240,0.05)", border: "1px solid rgba(200,220,240,0.08)",
            borderRadius: 4, padding: "4px 10px", color: "rgba(200,220,240,0.4)",
            fontSize: 10, cursor: "pointer",
          }}>
            ✕
          </button>
        )}
      </div>

      {/* Chain */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence>
          {hopGroups.map(([hop, nodes], groupIdx) => (
            <motion.div
              key={hop}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: groupIdx * 0.12, duration: 0.4, ease: EASE }}
            >
              {/* Hop label */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: HOP_COLORS[Math.min(hop, HOP_COLORS.length - 1)],
                  boxShadow: `0 0 6px ${HOP_COLORS[Math.min(hop, HOP_COLORS.length - 1)]}`,
                }} />
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
                  color: HOP_COLORS[Math.min(hop, HOP_COLORS.length - 1)],
                  textTransform: "uppercase",
                }}>
                  {hopLabels[Math.min(hop, hopLabels.length - 1)]}
                </span>
                {hop > 0 && (
                  <div style={{
                    flex: 1, height: 1,
                    background: `linear-gradient(90deg, ${HOP_COLORS[Math.min(hop, HOP_COLORS.length - 1)]}, transparent)`,
                  }} />
                )}
              </div>

              {/* Nodes */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 14 }}>
                {nodes.map((node, nIdx) => (
                  <motion.div
                    key={node.kpi}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: groupIdx * 0.12 + nIdx * 0.05, duration: 0.3 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 12px",
                      background: hop === 0
                        ? "rgba(34,211,238,0.08)"
                        : "rgba(200,220,240,0.02)",
                      border: `1px solid ${hop === 0 ? "rgba(34,211,238,0.2)" : "rgba(200,220,240,0.06)"}`,
                      borderRadius: 6,
                      cursor: "default",
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: node.color,
                      boxShadow: `0 0 4px ${node.color}`,
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(200,220,240,0.75)" }}>
                        {node.label}
                      </div>
                      <div style={{
                        fontSize: 9, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                        color: node.delta > 0 ? "#34d399" : node.delta < 0 ? "#f87171" : "rgba(200,220,240,0.3)",
                      }}>
                        {fmtDelta(node.delta)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 7, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: node.color, opacity: 0.7,
                    }}>
                      {node.health}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Arrow connector between hops */}
              {groupIdx < hopGroups.length - 1 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  paddingLeft: 16, marginTop: 4, marginBottom: 2,
                }}>
                  <svg width="12" height="16" viewBox="0 0 12 16">
                    <path d="M6 0 L6 12 L2 8 M6 12 L10 8" stroke={HOP_COLORS[Math.min(hop + 1, HOP_COLORS.length - 1)]} strokeWidth="1.5" fill="none" opacity="0.5" />
                  </svg>
                  <span style={{
                    fontSize: 8, color: "rgba(200,220,240,0.2)", fontStyle: "italic",
                  }}>
                    propagates to
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div style={{
        padding: "10px 18px 14px",
        borderTop: "1px solid rgba(34,211,238,0.04)",
        fontSize: 10, color: "rgba(200,220,240,0.35)",
        lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 600, color: "rgba(34,211,238,0.5)" }}>
          {chain.length - 1} zones
        </span>{" "}
        affected through {hopGroups.length - 1} cascade hop{hopGroups.length - 1 !== 1 ? "s" : ""}. Force decays 60% per hop.
      </div>
    </motion.div>
  )
})
