// src/components/Decision/types.ts
// STRATFIT — Decision Intelligence Types

export interface CompanyState {
  runway: number // months
  growthRate: number // % MoM
  churnRate: number // %
  cac: number // $
  ltv: number // $
  nps: number
  burnRate: number // $/month
  cash: number // $
  arr: number // $
  teamSize: number
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth'
}

export interface Threat {
  id: string
  name: string
  category: 'financial' | 'operational' | 'market' | 'competitive'
  severity: 'critical' | 'high' | 'medium' | 'low'
  probability: number
  impact: string
  timeToImpact: string
  trend: 'worsening' | 'stable' | 'improving'
  mitigation: string
  leadIndicator?: string
}

export interface Opportunity {
  id: string
  name: string
  category: 'revenue' | 'efficiency' | 'expansion' | 'strategic'
  potential: number // $
  confidence: number // %
  effort: 'low' | 'medium' | 'high'
  timeWindow: string
  description: string
  reasoning: string
}

export interface Action {
  id: string
  title: string
  description: string
  impact: number // 1-10
  effort: number // 1-10
  urgency: 'now' | 'this-week' | 'this-month' | 'this-quarter'
  category: 'growth' | 'efficiency' | 'risk' | 'strategic'
  dependencies?: string[]
  expectedOutcome: string
}

export interface BlindSpot {
  id: string
  type: 'assumption' | 'bias' | 'gap' | 'dependency'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  question: string
  recommendation: string
}

export interface Decision {
  id: string
  date: string
  title: string
  reasoning: string
  confidenceAtTime: number
  outcome?: 'good' | 'mixed' | 'poor' | 'pending'
  actualResult?: string
  learning?: string
}

export interface BoardQuestion {
  question: string
  suggestedAnswer: string
  supportingData: string[]
  confidence: number
  weakness?: string
}

export type ViewMode = 'command' | 'threats' | 'opportunities' | 'actions' | 'blindspots' | 'decisions' | 'readiness'

export interface SharedProps {
  companyState: CompanyState
  threats: Threat[]
  opportunities: Opportunity[]
  actions: Action[]
  blindSpots: BlindSpot[]
  decisions: Decision[]
  boardQuestions: BoardQuestion[]
  healthScore: number
}

