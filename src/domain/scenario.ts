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

  // Forecast data contract — populated after simulation
  forecast?: ForecastModel
}

/** Time-series forecast output from simulation engine */
export type ForecastModel = {
  horizonMonths: number
  revenueSeries: number[]
  cashSeries: number[]
  burnSeries: number[]
}
