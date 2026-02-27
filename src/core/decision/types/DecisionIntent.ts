export type DecisionCategory =
  | "hiring"
  | "fundraise"
  | "cost_reduction"
  | "pricing"
  | "expansion"
  | "restructure"
  | "product_change"
  | "other"

export interface DecisionIntent {
  category: DecisionCategory
  description: string

  deltas: Record<string, any>

  timing: {
    startMonth: number
    durationMonths?: number | null
    isOneOff: boolean
  }

  assumptions: string[]
  confidence: number
}
