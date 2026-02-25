// src/components/compare/snapshots.ts
// STRATFIT — Snapshot persistence for Compare side-by-side narrative + deltas

export type Snapshot = {
  v: 1
  scenarioId: string // "baseline" or scenario id
  savedAtIso: string
  iterations: number | null
  horizonMonths: number | null
  primary: string[]
  headwinds: string[]
  opportunities: string[]
  summary: string[] // 3 lines
}

export function snapshotKeyForScenario(scenarioId: string) {
  return scenarioId === "baseline"
    ? "sf.snapshot.baseline.v1"
    : `sf.snapshot.scenario.${scenarioId}.v1`
}

export function loadSnapshot(scenarioId: string): Snapshot | null {
  const key = snapshotKeyForScenario(scenarioId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Snapshot
    if (!parsed || parsed.v !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSnapshot(s: Snapshot) {
  const key = snapshotKeyForScenario(s.scenarioId)
  try {
    localStorage.setItem(key, JSON.stringify(s))
  } catch {
    // silent by design (no console spam)
  }
}

export function listDelta(a: string[] | undefined, b: string[] | undefined) {
  const A = new Set((a ?? []).map((x) => String(x)))
  const B = new Set((b ?? []).map((x) => String(x)))
  const added: string[] = []
  const removed: string[] = []
  for (const x of B) if (!A.has(x)) added.push(x)
  for (const x of A) if (!B.has(x)) removed.push(x)
  return { added, removed }
}
