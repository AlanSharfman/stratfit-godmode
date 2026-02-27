import type { Baseline } from "./baseline"

export type ScenarioType = "hire" | "pricing" | "cost" | "funding" | "other"

export type Scenario = {
  id: string
  title: string
  type: ScenarioType
  createdAt: number
  baselineSnapshot: Baseline
}

export const SCENARIO_STORAGE_KEY = "stratfit:scenarios:v1"
