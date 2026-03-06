// src/state/decisionTypes.ts
// STRATFIT — Decision Intelligence Types

export type DecisionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DecisionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
export type DecisionCategory = 'growth' | 'cost' | 'product' | 'team' | 'funding' | 'market';
export type ImpactType = 'survival' | 'growth' | 'efficiency' | 'risk';

export interface Decision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  priority: DecisionPriority;
  status: DecisionStatus;
  
  // Impact metrics
  impact: {
    type: ImpactType;
    magnitude: number; // 0-100
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  };
  
  // Dependencies and trade-offs
  dependencies: string[];
  tradeoffs: string[];
  
  // Recommendations
  recommendation: 'DO_NOW' | 'PLAN' | 'MONITOR' | 'AVOID';
  confidence: number; // 0-100
  
  // Tracking
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  
  // Source
  source: 'AI' | 'USER' | 'SYSTEM';
  createdAt: string;
  updatedAt: string;
}

export interface DecisionSnapshot {
  decisions: Decision[];
  summary: {
    totalDecisions: number;
    criticalCount: number;
    pendingCount: number;
    completedCount: number;
    topPriority: Decision | null;
  };
  insights: {
    survivalActions: number;
    growthActions: number;
    efficiencyActions: number;
    riskActions: number;
  };
  generatedAt: Date;
}
