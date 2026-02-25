// src/components/compare/useCompareScenarioOverride.ts
// STRATFIT — Step 25: Compare-local scenario override
// Captures prior global activeScenarioId, applies Compare selection on mount,
// restores prior global selection on unmount. No new stores.

import { useEffect, useRef } from "react"
import { useScenarioStore, type ScenarioId } from "@/state/scenarioStore"
import { loadCompareScenarioId } from "./compareScenarioPersistence"

export function useCompareScenarioOverride() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)
  const savedScenarios = useScenarioStore((s) => s.savedScenarios ?? [])
  const setScenario = useScenarioStore((s) => s.setScenario)

  const priorRef = useRef<string | null>(null)
  const didMountRef = useRef(false)

  useEffect(() => {
    if (didMountRef.current) return
    didMountRef.current = true

    // Capture prior global selection
    priorRef.current = activeScenarioId ?? null

    // Apply persisted compare selection if valid
    const saved = loadCompareScenarioId()
    if (!saved) return

    const validIds = new Set<string>(["base", "upside", "downside", "stress"])
    const existsInSaved = savedScenarios.some((x) => String(x.id) === String(saved))
    if (!validIds.has(saved) && !existsInSaved) return

    // Only set if different, avoids redundant renders
    if (String(activeScenarioId) !== String(saved)) {
      setScenario(saved)
    }
  }, [activeScenarioId, savedScenarios, setScenario])

  useEffect(() => {
    return () => {
      // Restore prior selection when leaving Compare
      if (priorRef.current) {
        setScenario(priorRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setScenario])
}
