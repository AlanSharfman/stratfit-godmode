import type { SimulationRun } from "@/state/simulationStore"

export interface DriverRow {
  label: string
  impact: string
}

/**
 * Derives top-3 driver rows from a SimulationRun.
 * Returns [] if the run has no driver data (canonical engine does not yet
 * emit drivers — this is safe to render as an empty list).
 */
export function buildDriverAnalysis(results: SimulationRun["results"]): DriverRow[] {
  if (!results?.drivers?.length) return []

  return results.drivers
    .slice(0, 3)
    .map((d) => ({
      label: d.name,
      impact: `${Math.round(d.impact * 100)}%`,
    }))
}
