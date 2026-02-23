import React, { useMemo } from "react"
import styles from "./PositionNarrative.module.css"

type Props = {
  vm: any | null
}

export default function ExecutiveNarrativeCard({ vm }: Props) {
  const text = useMemo(() => {
    if (!vm) return ""

    const runway = vm.runwayMonths?.toFixed(1)
    const risk = vm.riskIndex?.toFixed(1)

    return `The business currently has approximately ${runway} months of runway with a risk index of ${risk}. ` +
      `Primary pressure is driven by ${vm.primaryDriver ?? "operating dynamics"}, with current trajectory indicating ` +
      `${vm.outlook ?? "stable forward positioning"}.`
  }, [vm])

  if (!vm) return null

  return (
    <div className={styles.narrativeCard}>
      <div className={styles.title}>Executive Summary</div>
      <div className={styles.body}>{text}</div>
    </div>
  )
}
