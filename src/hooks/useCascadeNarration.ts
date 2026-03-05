import { useCallback, useRef, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_GRAPH, propagateForce } from "@/engine/kpiDependencyGraph"

export function useCascadeNarration() {
  const [isNarrating, setIsNarrating] = useState(false)
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([])

  const stop = useCallback(() => {
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel()
    }
    utterancesRef.current = []
    setIsNarrating(false)
  }, [])

  const narrate = useCallback((sourceKpi: KpiKey, delta: number) => {
    if (typeof speechSynthesis === "undefined") return
    stop()

    const { affected, hops } = propagateForce(KPI_GRAPH, sourceKpi, delta)
    const hopBuckets = new Map<number, { kpi: KpiKey; delta: number }[]>()
    for (const [kpi, d] of affected) {
      const hop = hops.get(kpi) ?? 0
      if (!hopBuckets.has(hop)) hopBuckets.set(hop, [])
      hopBuckets.get(hop)!.push({ kpi, delta: d })
    }

    const sentences: string[] = []

    const sourceLabel = KPI_ZONE_MAP[sourceKpi].label
    const direction = delta > 0 ? "increases" : "decreases"
    const pctAbs = Math.abs(delta * 100).toFixed(0)
    sentences.push(`${sourceLabel} ${direction} by ${pctAbs} percent.`)

    const sortedHops = Array.from(hopBuckets.entries()).sort(([a], [b]) => a - b)
    for (const [hop, items] of sortedHops) {
      if (hop === 0) continue
      const sorted = items.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)
      const parts = sorted.map((item) => {
        const label = KPI_ZONE_MAP[item.kpi].label
        const dir = item.delta > 0 ? "rises" : "falls"
        return `${label} ${dir}`
      })
      if (hop === 1) {
        sentences.push(`This directly causes: ${parts.join(", ")}.`)
      } else {
        sentences.push(`${hop === 2 ? "Second" : "Third"} order effects: ${parts.join(", ")}.`)
      }
    }

    sentences.push("The terrain has reshaped to reflect this new reality.")

    setIsNarrating(true)
    const utterances: SpeechSynthesisUtterance[] = []

    for (const text of sentences) {
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate = 0.92
      utt.pitch = 0.95
      utt.volume = 0.85
      utterances.push(utt)
    }

    utterances[utterances.length - 1].onend = () => {
      setIsNarrating(false)
    }

    utterancesRef.current = utterances
    for (const utt of utterances) {
      speechSynthesis.speak(utt)
    }
  }, [stop])

  return { narrate, stop, isNarrating }
}
