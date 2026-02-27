export type ScenarioId = string

// Minimal canonical contract used across the app.
// Anything simulation/studio-specific belongs in store-extended types.
export type Scenario = {
  id: ScenarioId
  name: string
  description?: string

  // Canonical timestamps are numbers (ms since epoch)
  createdAt: number
  updatedAt?: number
}
