import { describe, it, expect } from "vitest"
import {
  KPI_GRAPH,
  propagateForce,
  computeSensitivity,
  getDownstream,
  getUpstream,
} from "@/engine/kpiDependencyGraph"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

describe("KPI_GRAPH structure", () => {
  it("has 12 nodes matching KPI_KEYS", () => {
    expect(KPI_GRAPH.nodes).toHaveLength(12)
    expect(KPI_GRAPH.nodes).toContain("cash")
    expect(KPI_GRAPH.nodes).toContain("enterpriseValue")
  })

  it("has edges with valid from/to references", () => {
    for (const edge of KPI_GRAPH.edges) {
      expect(KPI_GRAPH.nodes).toContain(edge.from)
      expect(KPI_GRAPH.nodes).toContain(edge.to)
    }
  })

  it("has weights between -1 and 1", () => {
    for (const edge of KPI_GRAPH.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(-1)
      expect(edge.weight).toBeLessThanOrEqual(1)
    }
  })

  it("adjacency map contains all nodes", () => {
    for (const node of KPI_GRAPH.nodes) {
      expect(KPI_GRAPH.adjacency.has(node)).toBe(true)
    }
  })
})

describe("propagateForce", () => {
  it("includes the source in the affected map", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", 10)
    expect(result.affected.has("revenue")).toBe(true)
    expect(result.affected.get("revenue")).toBe(10)
  })

  it("source is at hop 0", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", 10)
    expect(result.hops.get("revenue")).toBe(0)
  })

  it("propagates to direct downstream KPIs", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", 10)
    expect(result.affected.has("arr")).toBe(true)
    expect(result.affected.has("burn")).toBe(true)
    expect(result.affected.has("enterpriseValue")).toBe(true)
  })

  it("attenuates delta through edge weight and decay", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", 10)
    const arrDelta = result.affected.get("arr")!
    // revenue -> arr: weight 0.8, decay 0.6 => 10 * 0.8 * 0.6 = 4.8
    expect(arrDelta).toBeCloseTo(4.8, 1)
  })

  it("respects maxHops limit", () => {
    const shallow = propagateForce(KPI_GRAPH, "churn", 10, 1, 0.6)
    const deep = propagateForce(KPI_GRAPH, "churn", 10, 4, 0.6)
    expect(deep.affected.size).toBeGreaterThanOrEqual(shallow.affected.size)
  })

  it("returns empty downstream for leaf KPIs", () => {
    // enterpriseValue has no outgoing edges
    const result = propagateForce(KPI_GRAPH, "enterpriseValue", 10)
    expect(result.affected.size).toBe(1) // only itself
  })

  it("handles zero delta without crashing", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", 0)
    expect(result.affected.get("revenue")).toBe(0)
  })

  it("handles negative delta (force reversal)", () => {
    const result = propagateForce(KPI_GRAPH, "revenue", -10)
    expect(result.affected.get("revenue")).toBe(-10)
    const arrDelta = result.affected.get("arr")!
    expect(arrDelta).toBeLessThan(0)
  })

  it("churn → revenue → arr forms a multi-hop cascade", () => {
    const result = propagateForce(KPI_GRAPH, "churn", 5, 4, 0.6)
    // churn -> revenue (weight -0.2), then revenue -> arr (weight 0.8)
    expect(result.affected.has("revenue")).toBe(true)
    expect(result.hops.get("revenue")).toBe(1)
    if (result.affected.has("arr")) {
      expect(result.hops.get("arr")!).toBeGreaterThanOrEqual(1)
    }
  })
})

describe("computeSensitivity", () => {
  it("returns an entry for every node", () => {
    const results = computeSensitivity(KPI_GRAPH)
    expect(results).toHaveLength(KPI_GRAPH.nodes.length)
  })

  it("is sorted by total impact descending", () => {
    const results = computeSensitivity(KPI_GRAPH)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalImpact).toBeGreaterThanOrEqual(results[i].totalImpact)
    }
  })

  it("leaf KPIs have zero impact", () => {
    const results = computeSensitivity(KPI_GRAPH)
    const evEntry = results.find((e) => e.kpi === "enterpriseValue")!
    expect(evEntry.totalImpact).toBe(0)
    expect(evEntry.affectedCount).toBe(0)
  })

  it("high-connectivity KPIs rank higher", () => {
    const results = computeSensitivity(KPI_GRAPH)
    const revenueRank = results.findIndex((e) => e.kpi === "revenue")
    const evRank = results.findIndex((e) => e.kpi === "enterpriseValue")
    expect(revenueRank).toBeLessThan(evRank)
  })
})

describe("getDownstream / getUpstream", () => {
  it("getDownstream returns outgoing edges", () => {
    const edges = getDownstream(KPI_GRAPH, "revenue")
    expect(edges.length).toBeGreaterThan(0)
    for (const e of edges) {
      expect(e.from).toBe("revenue")
    }
  })

  it("getUpstream returns incoming edges", () => {
    const edges = getUpstream(KPI_GRAPH, "arr")
    expect(edges.length).toBeGreaterThan(0)
    for (const e of edges) {
      expect(e.to).toBe("arr")
    }
  })

  it("getDownstream of leaf returns empty", () => {
    const edges = getDownstream(KPI_GRAPH, "enterpriseValue")
    expect(edges).toHaveLength(0)
  })
})
