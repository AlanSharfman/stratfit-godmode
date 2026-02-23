import React, { useMemo } from "react"
import type { PositionViewModel } from "../overlays/positionState"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: PositionViewModel | null
}

export default function ExecutiveNarrativeCard({ vm }: Props) {
  const text = useMemo(() => {
    if (!vm) return ""
    const { kpis, state, bullets } = vm
    const runway = Number.isFinite(kpis.runwayMonths) && kpis.runwayMonths < 999
      ? `${kpis.runwayMonths.toFixed(1)} months`
      : "an extended horizon"
    const risk = kpis.riskIndex.toFixed(1)
    const lead = `The business is in a ${state} position with ${runway} of runway and a risk index of ${risk}.`
    return [lead, ...bullets].join(" ")
  }, [vm])

  if (!vm) return null

  return (
    <div className={styles.narrativeCard}>
      <div className={styles.title}>Executive Summary</div>
      <div className={styles.body}>{text}</div>
    </div>
  )
}
