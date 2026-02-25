// src/components/compare/compareScenarioPersistence.ts
// STRATFIT — Compare-local scenario selection persistence

const KEY = "sf.compare.activeScenarioId.v1"

export function loadCompareScenarioId(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = String(raw).trim()
    if (!v || v === "baseline" || v === "null") return null
    return v
  } catch {
    return null
  }
}

export function saveCompareScenarioId(id: string | null) {
  try {
    if (!id) {
      localStorage.removeItem(KEY)
      return
    }
    localStorage.setItem(KEY, String(id))
  } catch {
    // silent by design (no console spam)
  }
}
