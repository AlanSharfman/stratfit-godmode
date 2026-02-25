// src/components/compare/CompareScenarioStrip.tsx
// STRATFIT — Step 24: Compare-local scenario selection UI + persistence
// No routing/nav changes. No new stores.

import React, { useEffect, useMemo, useRef } from "react"
import { useScenarioStore, type ScenarioId } from "@/state/scenarioStore"
import { loadCompareScenarioId, saveCompareScenarioId } from "./compareScenarioPersistence"

export default function CompareScenarioStrip() {
  const savedScenarios = useScenarioStore((s) => s.savedScenarios ?? [])
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)
  const setScenario = useScenarioStore((s) => s.setScenario)

  // Apply persisted choice ONCE when Compare mounts.
  const didHydrateRef = useRef(false)

  useEffect(() => {
    if (didHydrateRef.current) return
    didHydrateRef.current = true

    const saved = loadCompareScenarioId()
    if (!saved) return

    // Only apply if it's a valid ScenarioId or exists in saved scenarios
    const validIds = new Set<string>(["base", "upside", "downside", "stress"])
    const existsInSaved = savedScenarios.some((x) => String(x.id) === String(saved))
    if (!validIds.has(saved) && !existsInSaved) return

    setScenario(saved)
  }, [savedScenarios, setScenario])

  // Persist selection on changes (after hydrate)
  useEffect(() => {
    if (!didHydrateRef.current) return
    saveCompareScenarioId(activeScenarioId)
  }, [activeScenarioId])

  // Built-in scenario IDs + saved scenarios
  const items = useMemo(() => {
    const builtIn: Array<{ id: string; label: string }> = [
      { id: "base", label: "Base" },
      { id: "upside", label: "Upside" },
      { id: "downside", label: "Downside" },
      { id: "stress", label: "Stress" },
    ]

    const saved = savedScenarios.map((s) => ({
      id: String(s.id),
      label: (s.name && String(s.name).trim()) || `Scenario ${String(s.id).slice(0, 6)}`,
    }))

    return [...builtIn, ...saved]
  }, [savedScenarios])

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 16,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
          overflowX: "auto",
          maxWidth: "min(980px, 100%)",
        }}
      >
        {items.map((it) => {
          const active = String(activeScenarioId) === it.id
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setScenario(it.id)}
              style={chipStyle(active)}
              title={it.label}
            >
              {it.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.14)",
    background: active ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.15)",
    color: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    letterSpacing: 0.2,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }
}
