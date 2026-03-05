import React, { useMemo, useState, useEffect, useRef } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"

interface Props {
  sourceKpi: KpiKey
  delta: number
  width?: number
  height?: number
  animate?: boolean
}

interface ChainNode {
  kpi: KpiKey
  label: string
  x: number
  y: number
  hop: number
  delta: number
}

interface ChainLink {
  from: ChainNode
  to: ChainNode
  weight: number
}

const NODE_RADIUS = 22
const HOP_X_SPACING = 160
const HOP_Y_SPACING = 60

export default function ImpactChain({ sourceKpi, delta, width = 600, height = 340, animate = true }: Props) {
  const [revealedHop, setRevealedHop] = useState(animate ? -1 : 99)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { nodes, links, maxHop } = useMemo(() => {
    const { affected, hops } = propagateForce(KPI_GRAPH, sourceKpi, delta)

    const hopBuckets = new Map<number, { kpi: KpiKey; delta: number }[]>()
    for (const [kpi, d] of affected) {
      const hop = hops.get(kpi) ?? 0
      if (!hopBuckets.has(hop)) hopBuckets.set(hop, [])
      hopBuckets.get(hop)!.push({ kpi, delta: d })
    }

    let mh = 0
    const nodeMap = new Map<KpiKey, ChainNode>()
    for (const [hop, items] of hopBuckets) {
      mh = Math.max(mh, hop)
      items.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      const yStart = (height - items.length * HOP_Y_SPACING) / 2 + HOP_Y_SPACING / 2
      items.forEach((item, i) => {
        nodeMap.set(item.kpi, {
          kpi: item.kpi,
          label: KPI_ZONE_MAP[item.kpi].label,
          x: 40 + hop * HOP_X_SPACING,
          y: yStart + i * HOP_Y_SPACING,
          hop,
          delta: item.delta,
        })
      })
    }

    const chainLinks: ChainLink[] = []
    for (const edge of KPI_GRAPH.edges) {
      const fromNode = nodeMap.get(edge.from)
      const toNode = nodeMap.get(edge.to)
      if (fromNode && toNode && fromNode.hop < toNode.hop) {
        chainLinks.push({ from: fromNode, to: toNode, weight: edge.weight })
      }
    }

    return { nodes: Array.from(nodeMap.values()), links: chainLinks, maxHop: mh }
  }, [sourceKpi, delta, height])

  useEffect(() => {
    if (!animate) { setRevealedHop(99); return }
    setRevealedHop(-1)
    let hop = -1
    function step() {
      hop++
      setRevealedHop(hop)
      if (hop <= maxHop) {
        timerRef.current = setTimeout(step, 600)
      }
    }
    timerRef.current = setTimeout(step, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [sourceKpi, delta, maxHop, animate])

  const viewW = Math.max(width, 40 + (maxHop + 1) * HOP_X_SPACING)

  return (
    <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
      <svg width={viewW} height={height} viewBox={`0 0 ${viewW} ${height}`}>
        <defs>
          <filter id="ic-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="ic-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="rgba(34,211,238,0.5)" />
          </marker>
        </defs>

        {links.map((link, i) => {
          const visible = link.from.hop <= revealedHop && link.to.hop <= revealedHop
          return (
            <line
              key={i}
              x1={link.from.x + NODE_RADIUS}
              y1={link.from.y}
              x2={link.to.x - NODE_RADIUS}
              y2={link.to.y}
              stroke={link.weight > 0 ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"}
              strokeWidth={Math.max(1, Math.abs(link.weight) * 3)}
              markerEnd="url(#ic-arrow)"
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity 0.5s ease" }}
            />
          )
        })}

        {nodes.map((node) => {
          const visible = node.hop <= revealedHop
          const isSource = node.hop === 0
          const color = node.delta > 0 ? "#34d399" : node.delta < 0 ? "#f87171" : "#22d3ee"
          return (
            <g
              key={node.kpi}
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity 0.5s ease, transform 0.4s ease" }}
              transform={`translate(${node.x},${node.y})`}
            >
              <circle
                r={NODE_RADIUS}
                fill={isSource ? "rgba(34,211,238,0.12)" : "rgba(15,25,45,0.7)"}
                stroke={color}
                strokeWidth={isSource ? 2 : 1}
                filter={isSource ? "url(#ic-glow)" : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fontWeight={700}
                letterSpacing="0.04em"
                fill="rgba(200,220,240,0.85)"
                style={{ textTransform: "uppercase" }}
              >
                {node.label.length > 10 ? node.label.slice(0, 9) + "…" : node.label}
              </text>
              <text
                y={NODE_RADIUS + 14}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill={color}
              >
                {node.delta > 0 ? "+" : ""}{(node.delta * 100).toFixed(1)}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
