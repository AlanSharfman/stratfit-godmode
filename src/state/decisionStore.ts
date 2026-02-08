// src/state/decisionStore.ts
// STRATFIT — Decision Intelligence Store
// Manages strategic decisions, recommendations, and action tracking

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitCompute } from '@/engine/computeTelemetry';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  growth: 'Growth',
  cost: 'Cost Management',
  product: 'Product',
  team: 'Team & Hiring',
  funding: 'Funding',
  market: 'Market Strategy',
};

const PRIORITY_WEIGHTS: Record<DecisionPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Map risk categories to decision categories
const RISK_TO_DECISION_CATEGORY: Record<string, DecisionCategory> = {
  runway: 'cost',
  market: 'market',
  execution: 'team',
  competition: 'market',
  funding: 'funding',
  churn: 'growth',
};

// Generate unique ID
const generateId = () => `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// STORE
// ============================================================================

interface DecisionState {
  // Decisions
  decisions: Decision[];
  snapshot: DecisionSnapshot | null;
  
  // View state
  viewMode: 'matrix' | 'timeline' | 'list';
  filterCategory: DecisionCategory | 'all';
  filterStatus: DecisionStatus | 'all';
  selectedDecisionId: string | null;
  
  // Actions
  generateDecisions: (
    levers: Record<string, number>,
    simulation: {
      survivalRate: number;
      medianRunway: number;
      medianARR: number;
      overallScore: number;
      overallRating: string;
    } | null,
    risks?: {
      topThreats: { category: string; score: number; label: string }[];
    }
  ) => DecisionSnapshot;
  
  addDecision: (decision: Omit<Decision, 'id' | 'createdAt' | 'updatedAt'>) => Decision;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  deleteDecision: (id: string) => void;
  
  setDecisionStatus: (id: string, status: DecisionStatus) => void;
  completeDecision: (id: string, notes?: string) => void;
  
  setViewMode: (mode: 'matrix' | 'timeline' | 'list') => void;
  setFilterCategory: (category: DecisionCategory | 'all') => void;
  setFilterStatus: (status: DecisionStatus | 'all') => void;
  setSelectedDecision: (id: string | null) => void;
  
  // Getters
  getDecisionsByPriority: () => Decision[];
  getDecisionsByCategory: (category: DecisionCategory) => Decision[];
  getPendingDecisions: () => Decision[];
}

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set, get) => ({
      decisions: [],
      snapshot: null,
      viewMode: 'matrix',
      filterCategory: 'all',
      filterStatus: 'all',
      selectedDecisionId: null,
      
      generateDecisions: (levers, simulation, risks) => {
        const _t0 = performance.now();
        emitCompute("decision_synthesis", "initialize");

        const decisions: Decision[] = [];
        const now = new Date().toISOString();
        
        // Default simulation values
        const survivalRate = simulation?.survivalRate ?? 0.5;
        const medianRunway = simulation?.medianRunway ?? 18;
        const medianARR = simulation?.medianARR ?? 1000000;
        const overallScore = simulation?.overallScore ?? 50;
        
        // ================================================================
        // SURVIVAL DECISIONS (Critical if runway < 12 months)
        // ================================================================
        
        if (medianRunway < 12) {
          decisions.push({
            id: generateId(),
            title: 'Extend Runway Immediately',
            description: `Current runway of ${medianRunway} months puts company survival at risk. Implement emergency cost reduction or secure bridge funding.`,
            category: 'cost',
            priority: 'CRITICAL',
            status: 'PENDING',
            impact: {
              type: 'survival',
              magnitude: 95,
              timeframe: 'immediate',
            },
            dependencies: [],
            tradeoffs: ['May slow growth temporarily', 'Potential team morale impact'],
            recommendation: 'DO_NOW',
            confidence: 95,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        if (survivalRate < 0.5) {
          decisions.push({
            id: generateId(),
            title: 'Improve Survival Probability',
            description: `Survival rate of ${Math.round(survivalRate * 100)}% indicates high failure risk. Focus on fundamentals: reduce burn, accelerate revenue, or secure funding.`,
            category: 'funding',
            priority: 'CRITICAL',
            status: 'PENDING',
            impact: {
              type: 'survival',
              magnitude: 90,
              timeframe: 'short-term',
            },
            dependencies: [],
            tradeoffs: ['May require difficult trade-offs', 'Could impact growth trajectory'],
            recommendation: 'DO_NOW',
            confidence: 90,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // ================================================================
        // GROWTH DECISIONS
        // ================================================================
        
        const demandStrength = levers.demandStrength ?? 50;
        const pricingPower = levers.pricingPower ?? 50;
        const expansionVelocity = levers.expansionVelocity ?? 50;
        
        if (demandStrength < 40) {
          decisions.push({
            id: generateId(),
            title: 'Increase Demand Generation',
            description: 'Low demand strength is limiting growth. Invest in marketing, sales enablement, or product-led growth initiatives.',
            category: 'growth',
            priority: demandStrength < 30 ? 'HIGH' : 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'growth',
              magnitude: 70,
              timeframe: 'medium-term',
            },
            dependencies: ['Budget allocation', 'Team capacity'],
            tradeoffs: ['Increased burn rate', 'Longer payback period'],
            recommendation: 'PLAN',
            confidence: 80,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        if (pricingPower < 40) {
          decisions.push({
            id: generateId(),
            title: 'Strengthen Pricing Position',
            description: 'Weak pricing power suggests commoditization risk. Differentiate product, add premium features, or target higher-value segments.',
            category: 'product',
            priority: 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'growth',
              magnitude: 60,
              timeframe: 'medium-term',
            },
            dependencies: ['Product development', 'Market research'],
            tradeoffs: ['May lose price-sensitive customers', 'Requires product investment'],
            recommendation: 'PLAN',
            confidence: 75,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        if (expansionVelocity > 70) {
          decisions.push({
            id: generateId(),
            title: 'Capitalize on Expansion Momentum',
            description: 'High expansion velocity indicates strong product-market fit. Consider accelerating with additional investment.',
            category: 'growth',
            priority: 'HIGH',
            status: 'PENDING',
            impact: {
              type: 'growth',
              magnitude: 75,
              timeframe: 'short-term',
            },
            dependencies: ['Funding available', 'Operational capacity'],
            tradeoffs: ['Increased burn', 'Execution risk'],
            recommendation: 'PLAN',
            confidence: 85,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // ================================================================
        // EFFICIENCY DECISIONS
        // ================================================================
        
        const costDiscipline = levers.costDiscipline ?? 50;
        const operatingDrag = levers.operatingDrag ?? 50;
        
        if (costDiscipline < 40 && medianRunway < 24) {
          decisions.push({
            id: generateId(),
            title: 'Implement Cost Controls',
            description: 'Low cost discipline combined with limited runway creates risk. Review all expenses and implement spending controls.',
            category: 'cost',
            priority: 'HIGH',
            status: 'PENDING',
            impact: {
              type: 'efficiency',
              magnitude: 65,
              timeframe: 'immediate',
            },
            dependencies: [],
            tradeoffs: ['May slow initiatives', 'Team morale impact'],
            recommendation: 'DO_NOW',
            confidence: 85,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        if (operatingDrag > 60) {
          decisions.push({
            id: generateId(),
            title: 'Reduce Operational Overhead',
            description: 'High operating drag is consuming resources. Streamline processes, automate where possible, and eliminate inefficiencies.',
            category: 'cost',
            priority: 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'efficiency',
              magnitude: 55,
              timeframe: 'short-term',
            },
            dependencies: ['Process review', 'Tool investment'],
            tradeoffs: ['Short-term disruption', 'Change management required'],
            recommendation: 'PLAN',
            confidence: 70,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // ================================================================
        // TEAM DECISIONS
        // ================================================================
        
        const hiringIntensity = levers.hiringIntensity ?? 50;
        const executionRisk = levers.executionRisk ?? 50;
        
        if (executionRisk > 60) {
          decisions.push({
            id: generateId(),
            title: 'Address Execution Gaps',
            description: 'High execution risk suggests team or process issues. Identify bottlenecks, strengthen key roles, or improve coordination.',
            category: 'team',
            priority: executionRisk > 75 ? 'HIGH' : 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'risk',
              magnitude: 70,
              timeframe: 'short-term',
            },
            dependencies: ['Root cause analysis', 'Leadership alignment'],
            tradeoffs: ['May require difficult conversations', 'Could need restructuring'],
            recommendation: executionRisk > 75 ? 'DO_NOW' : 'PLAN',
            confidence: 75,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        if (hiringIntensity > 70 && medianRunway < 18) {
          decisions.push({
            id: generateId(),
            title: 'Review Hiring Pace',
            description: 'Aggressive hiring with limited runway may not be sustainable. Consider slowing hiring or ensuring clear ROI on new hires.',
            category: 'team',
            priority: 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'efficiency',
              magnitude: 50,
              timeframe: 'short-term',
            },
            dependencies: ['Headcount plan review', 'Revenue forecast'],
            tradeoffs: ['May slow growth', 'Could impact roadmap'],
            recommendation: 'MONITOR',
            confidence: 70,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // ================================================================
        // FUNDING DECISIONS
        // ================================================================
        
        const fundingPressure = levers.fundingPressure ?? 50;
        
        if (fundingPressure > 60 && medianRunway < 18) {
          decisions.push({
            id: generateId(),
            title: 'Start Fundraising Process',
            description: 'High funding pressure with limited runway indicates you should begin fundraising soon. Allow 6+ months for the process.',
            category: 'funding',
            priority: fundingPressure > 75 ? 'CRITICAL' : 'HIGH',
            status: 'PENDING',
            impact: {
              type: 'survival',
              magnitude: 85,
              timeframe: 'medium-term',
            },
            dependencies: ['Investor materials', 'Metrics package', 'Target list'],
            tradeoffs: ['Founder time diverted', 'Potential dilution'],
            recommendation: 'DO_NOW',
            confidence: 85,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // ================================================================
        // MARKET DECISIONS
        // ================================================================
        
        const marketVolatility = levers.marketVolatility ?? 50;
        
        if (marketVolatility > 70) {
          decisions.push({
            id: generateId(),
            title: 'Build Market Resilience',
            description: 'High market volatility increases uncertainty. Diversify revenue streams, build cash reserves, or reduce market-dependent initiatives.',
            category: 'market',
            priority: 'MEDIUM',
            status: 'PENDING',
            impact: {
              type: 'risk',
              magnitude: 60,
              timeframe: 'medium-term',
            },
            dependencies: ['Market analysis', 'Strategic planning'],
            tradeoffs: ['May reduce focus', 'Could slow core growth'],
            recommendation: 'MONITOR',
            confidence: 65,
            source: 'AI',
            createdAt: now,
            updatedAt: now,
          });
        }
        
        // Add risk-based decisions if provided
        if (risks?.topThreats) {
          risks.topThreats.forEach(threat => {
            if (threat.score > 60) {
              const mappedCategory = RISK_TO_DECISION_CATEGORY[threat.category] || 'market';
              decisions.push({
                id: generateId(),
                title: `Mitigate ${threat.label}`,
                description: `${threat.label} score of ${threat.score} requires attention. Develop specific mitigation plan.`,
                category: mappedCategory,
                priority: threat.score > 80 ? 'HIGH' : 'MEDIUM',
                status: 'PENDING',
                impact: {
                  type: 'risk',
                  magnitude: threat.score,
                  timeframe: 'short-term',
                },
                dependencies: [],
                tradeoffs: ['Resource allocation required'],
                recommendation: threat.score > 80 ? 'DO_NOW' : 'PLAN',
                confidence: 70,
                source: 'AI',
                createdAt: now,
                updatedAt: now,
              });
            }
          });
        }
        
        emitCompute("decision_synthesis", "derive_metrics");

        // Sort by priority
        decisions.sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]);
        
        // Build summary
        const summary = {
          totalDecisions: decisions.length,
          criticalCount: decisions.filter(d => d.priority === 'CRITICAL').length,
          pendingCount: decisions.filter(d => d.status === 'PENDING').length,
          completedCount: decisions.filter(d => d.status === 'COMPLETED').length,
          topPriority: decisions[0] || null,
        };
        
        // Build insights
        const insights = {
          survivalActions: decisions.filter(d => d.impact.type === 'survival').length,
          growthActions: decisions.filter(d => d.impact.type === 'growth').length,
          efficiencyActions: decisions.filter(d => d.impact.type === 'efficiency').length,
          riskActions: decisions.filter(d => d.impact.type === 'risk').length,
        };
        
        const snapshot: DecisionSnapshot = {
          decisions,
          summary,
          insights,
          generatedAt: new Date(),
        };
        
        emitCompute("decision_synthesis", "complete", {
          durationMs: performance.now() - _t0,
        });

        set({ decisions, snapshot });
        return snapshot;
      },
      
      addDecision: (decision) => {
        const now = new Date().toISOString();
        const newDecision: Decision = {
          ...decision,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          decisions: [newDecision, ...state.decisions],
        }));
        
        return newDecision;
      },
      
      updateDecision: (id, updates) => {
        set((state) => ({
          decisions: state.decisions.map(d =>
            d.id === id
              ? { ...d, ...updates, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },
      
      deleteDecision: (id) => {
        set((state) => ({
          decisions: state.decisions.filter(d => d.id !== id),
          selectedDecisionId: state.selectedDecisionId === id ? null : state.selectedDecisionId,
        }));
      },
      
      setDecisionStatus: (id, status) => {
        set((state) => ({
          decisions: state.decisions.map(d =>
            d.id === id
              ? { ...d, status, updatedAt: new Date().toISOString() }
              : d
          ),
        }));
      },
      
      completeDecision: (id, notes) => {
        set((state) => ({
          decisions: state.decisions.map(d =>
            d.id === id
              ? {
                  ...d,
                  status: 'COMPLETED' as DecisionStatus,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  notes: notes || d.notes,
                }
              : d
          ),
        }));
      },
      
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSelectedDecision: (id) => set({ selectedDecisionId: id }),
      
      getDecisionsByPriority: () => {
        return [...get().decisions].sort(
          (a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
        );
      },
      
      getDecisionsByCategory: (category) => {
        return get().decisions.filter(d => d.category === category);
      },
      
      getPendingDecisions: () => {
        return get().decisions.filter(d => d.status === 'PENDING');
      },
    }),
    {
      name: 'stratfit-decisions',
      version: 1,
      partialize: (state) => ({
        decisions: state.decisions,
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useDecisions = () => useDecisionStore((s) => s.decisions);
export const useDecisionSnapshot = () => useDecisionStore((s) => s.snapshot);
export const useDecisionViewMode = () => useDecisionStore((s) => s.viewMode);
export const useSelectedDecision = () => {
  const selectedId = useDecisionStore((s) => s.selectedDecisionId);
  const decisions = useDecisionStore((s) => s.decisions);
  return decisions.find(d => d.id === selectedId) || null;
};

export default useDecisionStore;

