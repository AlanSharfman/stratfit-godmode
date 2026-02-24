import React from "react"
import styles from "./SimulationBriefPanel.module.css"
import { useSimulationStore } from "@/state/simulationStore"
import { buildDriverAnalysis } from "@/simulation/buildDriverAnalysis"

export default function SimulationBriefPanel() {
  const run = useSimulationStore((s) => s.activeRun)
  const status = useSimulationStore((s) => s.simulationStatus)

  if (!run || status !== "completed") return null

  const { results, horizonMonths, iterations } = run
  const drivers = buildDriverAnalysis(results)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Simulation Brief</div>
        <div className={styles.meta}>
          {iterations.toLocaleString()} paths · {horizonMonths}mo
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Outcome</div>
        <div className={styles.metricRow}>
          <Metric label="Runway P50" value={results?.runway?.p50} />
          <Metric label="Runway P90" value={results?.runway?.p90} />
          <Metric label="Probability ≥ Target" value={results?.probability} suffix="%" />
        </div>
      </div>

      {drivers.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Top Drivers</div>
          {drivers.map((d) => (
            <div key={d.label} className={styles.driver}>
              <span>{d.label}</span>
              <span className={styles.driverImpact}>{d.impact}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Action Insight</div>
        <div className={styles.insight}>
          {results?.suggestion ?? "No recommendation available"}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  suffix = "mo",
}: {
  label: string
  value?: number
  suffix?: string
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>
        {value != null ? `${value} ${suffix}` : "—"}
      </div>
    </div>
  )
}
