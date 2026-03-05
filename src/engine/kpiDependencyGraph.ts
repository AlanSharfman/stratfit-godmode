import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"

export interface KpiEdge {
  from: KpiKey
  to: KpiKey
  weight: number
}

export interface KpiGraph {
  nodes: readonly KpiKey[]
  edges: KpiEdge[]
  adjacency: Map<KpiKey, KpiEdge[]>
}

const EDGES: KpiEdge[] = [
  { from: "revenue",     to: "arr",             weight:  0.8 },
  { from: "revenue",     to: "burn",            weight: -0.6 },
  { from: "revenue",     to: "enterpriseValue", weight:  0.4 },
  { from: "churn",       to: "growth",          weight: -0.5 },
  { from: "churn",       to: "arr",             weight: -0.3 },
  { from: "churn",       to: "revenue",         weight: -0.2 },
  { from: "burn",        to: "runway",          weight: -0.7 },
  { from: "burn",        to: "cash",            weight: -0.3 },
  { from: "grossMargin", to: "efficiency",      weight:  0.4 },
  { from: "grossMargin", to: "enterpriseValue", weight:  0.3 },
  { from: "growth",      to: "arr",             weight:  0.6 },
  { from: "growth",      to: "enterpriseValue", weight:  0.5 },
  { from: "cash",        to: "runway",          weight:  0.9 },
  { from: "efficiency",  to: "enterpriseValue", weight:  0.3 },
]

function buildAdjacency(edges: KpiEdge[]): Map<KpiKey, KpiEdge[]> {
  const adj = new Map<KpiKey, KpiEdge[]>()
  for (const key of KPI_KEYS) adj.set(key, [])
  for (const edge of edges) {
    adj.get(edge.from)!.push(edge)
  }
  return adj
}

export const KPI_GRAPH: KpiGraph = {
  nodes: KPI_KEYS,
  edges: EDGES,
  adjacency: buildAdjacency(EDGES),
}

export interface PropagationResult {
  affected: Map<KpiKey, number>
  hops: Map<KpiKey, number>
}

/**
 * BFS force propagation through the dependency graph.
 * Returns a map of all affected KPIs with their attenuated deltas and hop distances.
 */
export function propagateForce(
  graph: KpiGraph,
  source: KpiKey,
  delta: number,
  maxHops = 4,
  decayPerHop = 0.6,
): PropagationResult {
  const affected = new Map<KpiKey, number>()
  const hops = new Map<KpiKey, number>()
  affected.set(source, delta)
  hops.set(source, 0)

  interface QueueItem { kpi: KpiKey; currentDelta: number; hop: number }
  const queue: QueueItem[] = [{ kpi: source, currentDelta: delta, hop: 0 }]

  while (queue.length > 0) {
    const { kpi, currentDelta, hop } = queue.shift()!
    if (hop >= maxHops) continue

    const outEdges = graph.adjacency.get(kpi) ?? []
    for (const edge of outEdges) {
      const propagatedDelta = currentDelta * edge.weight * decayPerHop
      if (Math.abs(propagatedDelta) < 0.001) continue

      const existing = affected.get(edge.to) ?? 0
      affected.set(edge.to, existing + propagatedDelta)

      const existingHop = hops.get(edge.to)
      const nextHop = hop + 1
      if (existingHop === undefined || nextHop < existingHop) {
        hops.set(edge.to, nextHop)
        queue.push({ kpi: edge.to, currentDelta: propagatedDelta, hop: nextHop })
      }
    }
  }

  return { affected, hops }
}

export interface SensitivityEntry {
  kpi: KpiKey
  totalImpact: number
  affectedCount: number
}

/**
 * For each KPI, compute the total terrain impact of a 10% improvement.
 * Returns a ranked list sorted by highest impact first.
 */
export function computeSensitivity(graph: KpiGraph): SensitivityEntry[] {
  const results: SensitivityEntry[] = []

  for (const kpi of graph.nodes) {
    const { affected } = propagateForce(graph, kpi, 0.10)
    let totalImpact = 0
    let affectedCount = 0
    for (const [key, delta] of affected) {
      if (key === kpi) continue
      totalImpact += Math.abs(delta)
      affectedCount++
    }
    results.push({ kpi, totalImpact, affectedCount })
  }

  results.sort((a, b) => b.totalImpact - a.totalImpact)
  return results
}

/**
 * Get direct downstream dependencies of a KPI.
 */
export function getDownstream(graph: KpiGraph, kpi: KpiKey): KpiEdge[] {
  return graph.adjacency.get(kpi) ?? []
}

/**
 * Get direct upstream dependencies of a KPI.
 */
export function getUpstream(graph: KpiGraph, kpi: KpiKey): KpiEdge[] {
  return graph.edges.filter((e) => e.to === kpi)
}
