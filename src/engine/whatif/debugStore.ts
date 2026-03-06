// src/engine/whatif/debugStore.ts
// STRATFIT — What-If Debug Log (in-memory ring buffer for last 20 calls)

import type { WhatIfAnswer } from "./types"

export interface WhatIfLogEntry {
  id: string
  timestamp: number
  promptVersion: string
  model: string
  question: string
  systemPrompt: string
  userMessage: string
  rawResponse: string | null
  parsedAnswer: WhatIfAnswer | null
  parseSuccess: boolean
  parseErrors: string[]
  tokenUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null
  latencyMs: number
  retryCount: number
  error: string | null
}

const MAX_ENTRIES = 20
const _log: WhatIfLogEntry[] = []
const _listeners: Set<() => void> = new Set()

function notify() { _listeners.forEach(fn => fn()) }

export function pushWhatIfLog(entry: WhatIfLogEntry): void {
  _log.push(entry)
  if (_log.length > MAX_ENTRIES) _log.shift()
  notify()
}

export function getWhatIfLog(): readonly WhatIfLogEntry[] {
  return _log
}

export function clearWhatIfLog(): void {
  _log.length = 0
  notify()
}

export function subscribeWhatIfLog(fn: () => void): () => void {
  _listeners.add(fn)
  return () => { _listeners.delete(fn) }
}

let _idCounter = 0
export function nextLogId(): string {
  return `wif-${Date.now()}-${++_idCounter}`
}
