// src/system/SystemBaselineProvider.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — SystemBaselineProvider
// Canonical single-source provider for the BaselineV1 truth layer.
// Wraps the entire application. All modules read/write baseline through this.
// Baseline is ALWAYS editable — there is no lock state.
// ═══════════════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import {
  loadBaseline,
  saveBaseline,
  BASELINE_STORAGE_KEY,
} from "@/onboard/baseline"
import type { BaselineV1 } from "@/onboard/baseline"

// ── Public contract ─────────────────────────────────────────────────────

export interface SystemBaselineContextValue {
  /** Current baseline — null if never initialised. */
  baseline: BaselineV1 | null

  /**
   * Replace the full baseline. Persists to localStorage and
   * updates every consumer synchronously within this tab.
   */
  setBaseline: (b: BaselineV1) => void

  /** Re-read baseline from localStorage (cross-tab sync, manual refresh). */
  refreshBaseline: () => void

  /** Remove baseline entirely (dev-only escape hatch). */
  clearBaseline: () => void
}

// ── Context (never exported — only the hook is public) ──────────────────

const SystemBaselineContext =
  createContext<SystemBaselineContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────────

export function SystemBaselineProvider({
  children,
}: {
  children: ReactNode
}) {
  const [baseline, setBaselineState] = useState<BaselineV1 | null>(
    () => loadBaseline()
  )

  const setBaseline = useCallback((b: BaselineV1) => {
    saveBaseline(b)
    setBaselineState(b)
  }, [])

  const refreshBaseline = useCallback(() => {
    setBaselineState(loadBaseline())
  }, [])

  const clearBaseline = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(BASELINE_STORAGE_KEY)
    }
    setBaselineState(null)
  }, [])

  // Cross-tab sync: if another tab writes baseline, pick it up.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === BASELINE_STORAGE_KEY) {
        setBaselineState(loadBaseline())
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  return (
    <SystemBaselineContext.Provider
      value={{ baseline, setBaseline, refreshBaseline, clearBaseline }}
    >
      {children}
    </SystemBaselineContext.Provider>
  )
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useSystemBaseline(): SystemBaselineContextValue {
  const ctx = useContext(SystemBaselineContext)
  if (!ctx) {
    throw new Error(
      "useSystemBaseline must be used within <SystemBaselineProvider>"
    )
  }
  return ctx
}

