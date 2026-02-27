// src/components/Decision/mockData.ts
// STRATFIT — Decision Intelligence Mock Data Generators

import type { CompanyState, Threat, Opportunity, Action, BlindSpot, Decision, BoardQuestion } from './types'

export function generateCompanyState(): CompanyState {
  return {
    runway: 91,
    growthRate: 8,
    churnRate: 6.2,
    cac: 185,
    ltv: 2400,
    nps: 62,
    burnRate: 180000,
    cash: 16400000,
    arr: 4300000,
    teamSize: 28,
    stage: 'seed',
  }
}

export function generateThreats(state: CompanyState): Threat[] {
  const threats: Threat[] = []
  
  if (state.churnRate > 5) {
    threats.push({
      id: 'churn-trend',
      name: 'Churn Trending Upward',
      category: 'operational',
      severity: state.churnRate > 7 ? 'critical' : 'high',
      probability: 85,
      impact: `Losing $${Math.round(state.arr * state.churnRate / 100 / 1000)}K ARR annually`,
      timeToImpact: '6 weeks to breach critical threshold',
      trend: 'worsening',
      mitigation: 'Implement customer success intervention program',
      leadIndicator: '+0.3% per week trend',
    })
  }
  
  if (state.ltv / state.cac < 3) {
    threats.push({
      id: 'unit-economics',
      name: 'Unit Economics Weakening',
      category: 'financial',
      severity: state.ltv / state.cac < 2 ? 'critical' : 'medium',
      probability: 70,
      impact: 'CAC payback extending, cash efficiency declining',
      timeToImpact: '3 months to investor concern',
      trend: 'worsening',
      mitigation: 'Optimize channel mix, focus on high-LTV segments',
    })
  }
  
  threats.push({
    id: 'market-risk',
    name: 'Market Volatility Elevated',
    category: 'market',
    severity: 'medium',
    probability: 35,
    impact: 'Funding environment may tighten',
    timeToImpact: '6-12 months',
    trend: 'stable',
    mitigation: 'Maintain 18-month runway buffer',
  })
  
  threats.push({
    id: 'competitive-entry',
    name: 'Well-Funded Competitor Activity',
    category: 'competitive',
    severity: 'medium',
    probability: 40,
    impact: 'Market share pressure, potential price war',
    timeToImpact: '3-6 months',
    trend: 'worsening',
    mitigation: 'Accelerate differentiation, lock in key accounts',
    leadIndicator: 'Competitor X raised $50M last month',
  })
  
  return threats
}

export function generateOpportunities(state: CompanyState): Opportunity[] {
  const opportunities: Opportunity[] = []
  
  if (state.nps > 50) {
    opportunities.push({
      id: 'pricing-power',
      name: 'Pricing Power Underutilized',
      category: 'revenue',
      potential: Math.round(state.arr * 0.15),
      confidence: 78,
      effort: 'medium',
      timeWindow: 'Best before Q3 (seasonal patterns)',
      description: 'Your NPS supports a 15-20% price increase',
      reasoning: 'NPS of 62 indicates strong willingness to pay. Competitors priced 23% higher for similar value.',
    })
  }
  
  opportunities.push({
    id: 'expansion-segment',
    name: 'Mid-Market Expansion Segment',
    category: 'expansion',
    potential: 720000,
    confidence: 65,
    effort: 'high',
    timeWindow: '6-9 months to build momentum',
    description: 'Mid-market accounts showing 3x higher engagement',
    reasoning: 'Currently only 12% of customer base but 34% of expansion revenue.',
  })
  
  opportunities.push({
    id: 'partnership-channel',
    name: 'Partnership Channel Untapped',
    category: 'strategic',
    potential: 450000,
    confidence: 55,
    effort: 'medium',
    timeWindow: '4-6 months to first revenue',
    description: 'Integration partners could drive qualified leads',
    reasoning: 'Similar companies see 20-30% of revenue from partnerships at your stage.',
  })
  
  opportunities.push({
    id: 'automation-efficiency',
    name: 'Operations Automation',
    category: 'efficiency',
    potential: 180000,
    confidence: 82,
    effort: 'low',
    timeWindow: 'Implement within 30 days',
    description: 'Manual processes consuming 15% of ops time',
    reasoning: 'Quick wins in reporting, onboarding, and support ticket routing.',
  })
  
  return opportunities
}

export function generateActions(): Action[] {
  return [
    {
      id: 'fix-churn',
      title: 'Reduce churn from 6.2% to <5%',
      description: 'Implement proactive customer success program with health scoring',
      impact: 9,
      effort: 6,
      urgency: 'now',
      category: 'risk',
      expectedOutcome: '+$340K retained ARR annually',
    },
    {
      id: 'optimize-cac',
      title: 'Cut CAC by 15% via channel optimization',
      description: 'Shift spend from underperforming paid channels to organic/referral',
      impact: 7,
      effort: 4,
      urgency: 'this-week',
      category: 'efficiency',
      expectedOutcome: '+$180K margin improvement',
    },
    {
      id: 'hire-engineer',
      title: 'Hire senior infrastructure engineer',
      description: 'Technical debt slowing feature velocity by 40%',
      impact: 8,
      effort: 7,
      urgency: 'this-month',
      category: 'strategic',
      dependencies: ['Define role spec', 'Budget approval'],
      expectedOutcome: 'Unblock product roadmap Q2',
    },
    {
      id: 'price-increase',
      title: 'Implement 15% price increase for new customers',
      description: 'NPS and competitive analysis support pricing power',
      impact: 8,
      effort: 5,
      urgency: 'this-quarter',
      category: 'growth',
      dependencies: ['fix-churn', 'hire-engineer'],
      expectedOutcome: '+$480K ARR on new business',
    },
    {
      id: 'automate-ops',
      title: 'Automate manual reporting workflows',
      description: 'Quick win to free up ops capacity',
      impact: 4,
      effort: 2,
      urgency: 'this-week',
      category: 'efficiency',
      expectedOutcome: '15% ops time recovered',
    },
    {
      id: 'competitor-analysis',
      title: 'Update competitive positioning',
      description: 'Competitor X raised $50M - need response strategy',
      impact: 6,
      effort: 3,
      urgency: 'this-month',
      category: 'strategic',
      expectedOutcome: 'Clear differentiation narrative',
    },
  ]
}

export function generateBlindSpots(): BlindSpot[] {
  return [
    {
      id: 'optimism-bias',
      type: 'bias',
      title: 'Optimism Bias Detected',
      description: 'Your growth assumptions (45% YoY) are in the top 15% of companies at your stage. Historical median is 28%.',
      severity: 'high',
      question: 'What specific evidence supports outperformance vs. median?',
      recommendation: 'Stress test with 25% growth scenario',
    },
    {
      id: 'competitor-gap',
      type: 'gap',
      title: 'Competitive Intelligence Stale',
      description: "You haven't updated competitor analysis in 4 months. Company X raised $50M and is hiring aggressively.",
      severity: 'high',
      question: 'How does this change your positioning and timeline?',
      recommendation: 'Schedule competitive review session',
    },
    {
      id: 'concentration-risk',
      type: 'dependency',
      title: 'Customer Concentration Risk',
      description: '73% of revenue comes from one segment. If that segment contracts, your plan breaks.',
      severity: 'medium',
      question: "What's your diversification strategy?",
      recommendation: 'Model segment-specific scenarios',
    },
    {
      id: 'hiring-assumption',
      type: 'assumption',
      title: 'Hiring Plan Aggressive',
      description: 'Plan assumes 8 key hires in 6 months. Average time-to-hire at your stage is 3 months per role.',
      severity: 'medium',
      question: 'What if hiring takes 50% longer?',
      recommendation: 'Build parallel sourcing channels',
    },
  ]
}

export function generateDecisions(): Decision[] {
  return [
    {
      id: 'dec-1',
      date: '2025-01-15',
      title: 'Increased marketing spend by 40%',
      reasoning: 'Market window closing, need to capture share before competitor launches',
      confidenceAtTime: 75,
      outcome: 'mixed',
      actualResult: 'Growth +8%, but CAC increased 23%',
      learning: 'Pace spend increases with efficiency gains',
    },
    {
      id: 'dec-2',
      date: '2024-12-03',
      title: 'Delayed Series A by 6 months',
      reasoning: 'Metrics not strong enough, better to wait',
      confidenceAtTime: 60,
      outcome: 'good',
      actualResult: 'Raised at 30% higher valuation with better terms',
      learning: 'Trust the process when metrics are weak',
    },
    {
      id: 'dec-3',
      date: '2024-11-18',
      title: 'Hired VP Sales from enterprise background',
      reasoning: 'Needed enterprise motion for larger deals',
      confidenceAtTime: 70,
      outcome: 'poor',
      actualResult: 'Culture mismatch, departed after 4 months',
      learning: 'Stage fit matters more than pedigree',
    },
    {
      id: 'dec-4',
      date: '2025-01-28',
      title: 'Considering aggressive expansion into EU',
      reasoning: 'Strong inbound demand from EU prospects',
      confidenceAtTime: 65,
      outcome: 'pending',
    },
  ]
}

export function generateBoardQuestions(): BoardQuestion[] {
  return [
    {
      question: 'Why is churn trending up?',
      suggestedAnswer: "We identified the root cause: onboarding friction in enterprise segment. We've deployed fixes and expect results in 4-6 weeks. Early cohorts show 15% better retention.",
      supportingData: ['Cohort analysis', 'Fix timeline', 'Early results'],
      confidence: 72,
      weakness: 'Timeline is aggressive',
    },
    {
      question: 'Are we on track for Series A?',
      suggestedAnswer: "We're 85% confident in hitting metrics. Key risk is churn. If we fix that, we're solidly in the zone. Worst case, we push 1 quarter.",
      supportingData: ['Metric tracker', 'Comparable deals', 'Timeline scenarios'],
      confidence: 81,
      weakness: 'Churn dependency',
    },
    {
      question: "How do you respond to Competitor X's funding?",
      suggestedAnswer: "We've analyzed their likely playbook. Our differentiation is clear: [X]. We're accelerating [Y] to extend our lead in the segments that matter.",
      supportingData: ['Competitive analysis', 'Win/loss data', 'Differentiation matrix'],
      confidence: 65,
      weakness: 'Analysis is 4 months stale',
    },
    {
      question: 'Why should we believe the growth projections?',
      suggestedAnswer: 'Our projections are built on [X] leading indicators that have been 85% accurate historically. We also stress-tested with conservative scenarios.',
      supportingData: ['Leading indicator model', 'Historical accuracy', 'Stress test results'],
      confidence: 70,
      weakness: 'Limited historical data',
    },
  ]
}

export function calculateHealthScore(state: CompanyState, threats: Threat[]): number {
  let score = 100
  
  // Deduct for threats
  threats.forEach(t => {
    if (t.severity === 'critical') score -= 15
    else if (t.severity === 'high') score -= 10
    else if (t.severity === 'medium') score -= 5
  })
  
  // Add for runway
  if (state.runway > 24) score += 10
  else if (state.runway < 12) score -= 10
  
  // Growth health
  if (state.growthRate > 10) score += 5
  else if (state.growthRate < 5) score -= 10
  
  // Unit economics
  const ltvCac = state.ltv / state.cac
  if (ltvCac > 4) score += 5
  else if (ltvCac < 3) score -= 10
  
  return Math.max(0, Math.min(100, score))
}

