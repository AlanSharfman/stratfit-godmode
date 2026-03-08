/**
 * STRATFIT — Scenario Audit Log
 *
 * Structured logging for every scenario run. Captures raw prompt,
 * validation outcome, simulation parameters, AI response metadata,
 * and timing. Used for debugging, compliance review, and safety audits.
 */

export interface ScenarioAuditEntry {
  id: string
  timestamp: number
  rawPrompt: string
  validationClass: string
  scenarioType: string
  assumptions: string[]
  kpiDeltas: Record<string, number>
  confidence: { level: string; score: number; reasons: string[] }
  clampWarnings: string[]
  blocked: boolean
  blockReason?: string
  aiCalled?: boolean
  aiResponseValid?: boolean
  aiFallbackUsed?: boolean
  latencyMs: number
}

const MAX_ENTRIES = 100
const _log: ScenarioAuditEntry[] = []
const _listeners: Set<() => void> = new Set()

function notify() { _listeners.forEach((fn) => fn()) }

export function pushAuditEntry(entry: ScenarioAuditEntry): void {
  _log.push(entry)
  if (_log.length > MAX_ENTRIES) _log.shift()

  if (import.meta.env.DEV) {
    console.groupCollapsed(
      `%c[STRATFIT AUDIT] %c${entry.blocked ? "BLOCKED" : "OK"} %c${entry.scenarioType} — "${entry.rawPrompt.slice(0, 60)}"`,
      "color:#7fc8ff;font-weight:bold",
      entry.blocked ? "color:#f87171" : "color:#34d399",
      "color:#94a3b8",
    )
    console.table({
      validation: entry.validationClass,
      confidence: `${entry.confidence.level} (${entry.confidence.score})`,
      deltas: JSON.stringify(entry.kpiDeltas),
      clampWarnings: entry.clampWarnings.length > 0 ? entry.clampWarnings.join("; ") : "none",
      latency: `${entry.latencyMs}ms`,
    })
    if (entry.assumptions.length > 0) {
      console.log("Assumptions:", entry.assumptions)
    }
    console.groupEnd()
  }

  notify()
}

export function getAuditLog(): readonly ScenarioAuditEntry[] {
  return _log
}

export function clearAuditLog(): void {
  _log.length = 0
  notify()
}

export function subscribeAuditLog(fn: () => void): () => void {
  _listeners.add(fn)
  return () => { _listeners.delete(fn) }
}

export function updateAuditEntry(
  id: string,
  patch: Partial<Pick<ScenarioAuditEntry, "aiCalled" | "aiResponseValid" | "aiFallbackUsed">>,
): void {
  const entry = _log.find((e) => e.id === id)
  if (entry) {
    Object.assign(entry, patch)
    notify()
  }
}
