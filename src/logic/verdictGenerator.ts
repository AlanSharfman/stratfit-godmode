// src/logic/verdictGenerator.ts
// STRATFIT — Verdict Generator
// Transforms Monte Carlo results into actionable narrative

import type { MonteCarloResult, SensitivityFactor } from './monteCarloEngine';

export interface Verdict {
  // Overall Assessment
  overallRating: 'CRITICAL' | 'CAUTION' | 'STABLE' | 'STRONG' | 'EXCEPTIONAL';
  overallScore: number; // 0-100
  headline: string;
  summary: string;
  
  // Key Metrics Narrative
  survivalNarrative: string;
  growthNarrative: string;
  runwayNarrative: string;
  
  // Scenario Narratives
  bestCaseNarrative: string;
  worstCaseNarrative: string;
  mostLikelyNarrative: string;
  
  // Risk Assessment
  primaryRisk: string;
  riskMitigation: string;
  
  // Sensitivity Insights
  topDrivers: string[];
  criticalLever: string;
  
  // Actionable Recommendations
  recommendations: Recommendation[];
  
  // Confidence Statement
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceStatement: string;
}

export interface Recommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'GROWTH' | 'EFFICIENCY' | 'RISK' | 'STRATEGY';
  action: string;
  rationale: string;
  impact: string;
}

// ============================================================================
// RATING CALCULATION
// ============================================================================

function calculateOverallScore(result: MonteCarloResult): number {
  // Weighted scoring
  const survivalWeight = 0.35;
  const growthWeight = 0.30;
  const runwayWeight = 0.20;
  const consistencyWeight = 0.15;
  
  // Survival score (0-100)
  const survivalScore = result.survivalRate * 100;
  
  // Growth score (based on median ARR growth)
  const startingARR = 4800000; // Default
  const medianGrowth = ((result.arrPercentiles.p50 - startingARR) / startingARR) * 100;
  const growthScore = Math.min(100, Math.max(0, 50 + medianGrowth * 2));
  
  // Runway score
  const runwayScore = Math.min(100, (result.runwayPercentiles.p50 / 36) * 100);
  
  // Consistency score (inverse of coefficient of variation)
  const cv = result.arrDistribution.stdDev / result.arrDistribution.mean;
  const consistencyScore = Math.max(0, 100 - cv * 100);
  
  return Math.round(
    survivalScore * survivalWeight +
    growthScore * growthWeight +
    runwayScore * runwayWeight +
    consistencyScore * consistencyWeight
  );
}

function getOverallRating(score: number): Verdict['overallRating'] {
  if (score >= 85) return 'EXCEPTIONAL';
  if (score >= 70) return 'STRONG';
  if (score >= 55) return 'STABLE';
  if (score >= 40) return 'CAUTION';
  return 'CRITICAL';
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function generateHeadline(result: MonteCarloResult, rating: Verdict['overallRating']): string {
  const survivalPct = Math.round(result.survivalRate * 100);
  
  switch (rating) {
    case 'EXCEPTIONAL':
      return `${survivalPct}% survival rate with strong upside potential`;
    case 'STRONG':
      return `Solid trajectory with ${survivalPct}% survival probability`;
    case 'STABLE':
      return `Moderate risk profile — ${survivalPct}% scenarios survive`;
    case 'CAUTION':
      return `Elevated risk detected — only ${survivalPct}% survival rate`;
    case 'CRITICAL':
      return `Critical: ${survivalPct}% survival rate requires immediate action`;
  }
}

function generateSummary(result: MonteCarloResult, rating: Verdict['overallRating']): string {
  const iterations = result.iterations.toLocaleString();
  const survivalPct = Math.round(result.survivalRate * 100);
  const medianARR = formatCurrency(result.arrPercentiles.p50);
  const horizon = result.timeHorizonMonths;
  
  return `Analysis of ${iterations} simulated scenarios over ${horizon} months indicates a ${survivalPct}% probability of survival with median ARR reaching ${medianARR}. ${getRatingSuffix(rating)}`;
}

function getRatingSuffix(rating: Verdict['overallRating']): string {
  switch (rating) {
    case 'EXCEPTIONAL':
      return 'Current strategy configuration demonstrates exceptional resilience and growth potential.';
    case 'STRONG':
      return 'The current trajectory supports continued execution with standard monitoring.';
    case 'STABLE':
      return 'Consider optimizing key levers to improve outcome distribution.';
    case 'CAUTION':
      return 'Strategic adjustments recommended to improve survival probability.';
    case 'CRITICAL':
      return 'Immediate intervention required to avoid probable failure scenarios.';
  }
}

function generateSurvivalNarrative(result: MonteCarloResult): string {
  const survivalPct = Math.round(result.survivalRate * 100);
  const medianMonths = Math.round(result.medianSurvivalMonths);
  const horizon = result.timeHorizonMonths;
  
  if (survivalPct >= 90) {
    return `Exceptional survivability. ${survivalPct}% of scenarios maintain positive cash position through the ${horizon}-month horizon. Median runway extends well beyond planning period.`;
  }
  if (survivalPct >= 70) {
    return `Strong survival profile. ${survivalPct}% probability of maintaining operations through ${horizon} months. Median survival of ${medianMonths} months provides adequate buffer.`;
  }
  if (survivalPct >= 50) {
    return `Moderate survival risk. ${survivalPct}% of scenarios survive the full horizon. Median survival at ${medianMonths} months suggests runway optimization needed.`;
  }
  return `Critical survival risk. Only ${survivalPct}% of scenarios survive to ${horizon} months. Median survival of ${medianMonths} months indicates urgent need for capital efficiency or funding.`;
}

function generateGrowthNarrative(result: MonteCarloResult): string {
  const p10 = formatCurrency(result.arrPercentiles.p10);
  const p50 = formatCurrency(result.arrPercentiles.p50);
  const p90 = formatCurrency(result.arrPercentiles.p90);
  const stdDev = result.arrDistribution.stdDev / result.arrDistribution.mean;
  
  const volatilityLevel = stdDev > 0.5 ? 'high' : stdDev > 0.3 ? 'moderate' : 'low';
  
  return `ARR outcomes range from ${p10} (pessimistic) to ${p90} (optimistic) with ${p50} as the most likely outcome. Distribution shows ${volatilityLevel} volatility, indicating ${volatilityLevel === 'high' ? 'significant uncertainty in growth trajectory' : volatilityLevel === 'moderate' ? 'manageable variance in expected outcomes' : 'predictable growth pattern'}.`;
}

function generateRunwayNarrative(result: MonteCarloResult): string {
  const p25 = Math.round(result.runwayPercentiles.p25);
  const p50 = Math.round(result.runwayPercentiles.p50);
  const p75 = Math.round(result.runwayPercentiles.p75);
  
  if (p50 >= 24) {
    return `Runway position is strong. Median runway of ${p50} months with 75th percentile at ${p75} months provides substantial strategic flexibility.`;
  }
  if (p50 >= 12) {
    return `Runway is adequate but warrants attention. Median of ${p50} months (${p25}-${p75} interquartile range) suggests planning for funding within 12 months.`;
  }
  return `Runway is critically short. Median of ${p50} months with 25th percentile at only ${p25} months. Immediate action required to extend runway or secure funding.`;
}

function generateScenarioNarrative(
  scenario: 'best' | 'worst' | 'likely',
  result: MonteCarloResult
): string {
  const data = scenario === 'best' 
    ? result.bestCase 
    : scenario === 'worst' 
      ? result.worstCase 
      : result.medianCase;
  
  const arr = formatCurrency(data.finalARR);
  const cash = formatCurrency(data.finalCash);
  const runway = Math.round(data.finalRunway);
  
  switch (scenario) {
    case 'best':
      return `In the optimistic scenario (P95), ARR reaches ${arr} with ${cash} cash remaining and ${runway}+ months runway. This outcome requires favorable market conditions and strong execution.`;
    case 'worst':
      return `The pessimistic scenario (P5) shows ARR at ${arr} with ${cash} cash position. ${data.didSurvive ? `Business survives but with only ${runway} months runway.` : `Cash depletion occurs at month ${data.survivalMonths}.`}`;
    case 'likely':
      return `The most probable outcome (P50) projects ${arr} ARR with ${cash} cash and ${runway} months runway. This represents the central tendency of all simulated paths.`;
  }
}

function identifyPrimaryRisk(result: MonteCarloResult): string {
  const survivalRate = result.survivalRate;
  const cv = result.arrDistribution.stdDev / result.arrDistribution.mean;
  const runwayP25 = result.runwayPercentiles.p25;
  
  if (survivalRate < 0.5) {
    return 'Primary risk: Cash depletion. More than half of simulated scenarios result in business failure due to insufficient runway.';
  }
  if (runwayP25 < 6) {
    return 'Primary risk: Runway compression. A significant portion of scenarios show dangerously short runway, limiting strategic options.';
  }
  if (cv > 0.5) {
    return 'Primary risk: Outcome volatility. High variance in projected outcomes creates planning uncertainty and potential downside exposure.';
  }
  return 'Primary risk: Market dependency. Outcomes are sensitive to external market conditions and growth assumptions.';
}

function generateRiskMitigation(result: MonteCarloResult, factors: SensitivityFactor[]): string {
  const topFactor = factors[0];
  
  if (!topFactor) {
    return 'Focus on balanced execution across all levers to maintain stability.';
  }
  
  if (topFactor.direction === 'positive') {
    return `Prioritize ${topFactor.label.toLowerCase()} optimization. Simulations show this lever has the highest impact on positive outcomes. A 20% improvement correlates with ${Math.round(Math.abs(topFactor.impact) * 100)}% better results.`;
  }
  return `Address ${topFactor.label.toLowerCase()} as the critical risk factor. Reducing exposure here has the highest correlation with improved survival rates.`;
}

function generateTopDrivers(factors: SensitivityFactor[]): string[] {
  return factors.slice(0, 3).map((f, i) => {
    const direction = f.direction === 'positive' ? 'improves' : 'reduces';
    const impact = Math.round(Math.abs(f.impact) * 100);
    return `${i + 1}. ${f.label}: ${impact}% correlation — increasing this ${direction} outcomes`;
  });
}

function generateRecommendations(
  result: MonteCarloResult,
  factors: SensitivityFactor[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Survival-based recommendations
  if (result.survivalRate < 0.7) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'EFFICIENCY',
      action: 'Reduce monthly burn rate by 20-30%',
      rationale: `Current burn creates ${Math.round((1 - result.survivalRate) * 100)}% failure probability`,
      impact: 'Could improve survival rate by 15-25 percentage points',
    });
  }
  
  // Growth-based recommendations
  const growthRate = (result.arrPercentiles.p50 - 4800000) / 4800000;
  if (growthRate < 0.3) {
    recommendations.push({
      priority: 'HIGH',
      category: 'GROWTH',
      action: 'Accelerate demand generation initiatives',
      rationale: 'Median growth trajectory underperforms target',
      impact: 'Each 10% growth improvement adds significant enterprise value',
    });
  }
  
  // Sensitivity-based recommendations
  const topPositive = factors.find(f => f.direction === 'positive');
  if (topPositive) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'STRATEGY',
      action: `Double down on ${topPositive.label.toLowerCase()}`,
      rationale: `Highest positive correlation (${Math.round(topPositive.impact * 100)}%) with successful outcomes`,
      impact: 'Optimizing this lever provides best ROI on effort',
    });
  }
  
  const topNegative = factors.find(f => f.direction === 'negative');
  if (topNegative) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'RISK',
      action: `Mitigate ${topNegative.label.toLowerCase()} exposure`,
      rationale: `Negative correlation (${Math.round(Math.abs(topNegative.impact) * 100)}%) with outcomes`,
      impact: 'Reducing this risk factor improves downside protection',
    });
  }
  
  // Runway-based recommendations
  if (result.runwayPercentiles.p25 < 12) {
    recommendations.push({
      priority: 'HIGH',
      category: 'STRATEGY',
      action: 'Initiate funding discussions within 3 months',
      rationale: '25th percentile runway is under 12 months',
      impact: 'Secures optionality and prevents forced decisions',
    });
  }
  
  return recommendations.slice(0, 4); // Top 4 recommendations
}

function determineConfidence(result: MonteCarloResult): { level: Verdict['confidenceLevel']; statement: string } {
  const cv = result.arrDistribution.stdDev / result.arrDistribution.mean;
  const iterations = result.iterations;
  
  if (iterations >= 10000 && cv < 0.3) {
    return {
      level: 'HIGH',
      statement: `High confidence. Analysis based on ${iterations.toLocaleString()} simulations with low outcome variance (CV: ${(cv * 100).toFixed(0)}%).`,
    };
  }
  if (iterations >= 5000 && cv < 0.5) {
    return {
      level: 'MEDIUM',
      statement: `Moderate confidence. ${iterations.toLocaleString()} simulations with acceptable variance. Results directionally reliable.`,
    };
  }
  return {
    level: 'LOW',
    statement: `Lower confidence due to high outcome variance (CV: ${(cv * 100).toFixed(0)}%). Recommend scenario planning for multiple outcomes.`,
  };
}

// ============================================================================
// MAIN VERDICT FUNCTION
// ============================================================================

export function generateVerdict(result: MonteCarloResult): Verdict {
  const overallScore = calculateOverallScore(result);
  const overallRating = getOverallRating(overallScore);
  const confidence = determineConfidence(result);
  
  return {
    overallRating,
    overallScore,
    headline: generateHeadline(result, overallRating),
    summary: generateSummary(result, overallRating),
    
    survivalNarrative: generateSurvivalNarrative(result),
    growthNarrative: generateGrowthNarrative(result),
    runwayNarrative: generateRunwayNarrative(result),
    
    bestCaseNarrative: generateScenarioNarrative('best', result),
    worstCaseNarrative: generateScenarioNarrative('worst', result),
    mostLikelyNarrative: generateScenarioNarrative('likely', result),
    
    primaryRisk: identifyPrimaryRisk(result),
    riskMitigation: generateRiskMitigation(result, result.sensitivityFactors),
    
    topDrivers: generateTopDrivers(result.sensitivityFactors),
    criticalLever: result.sensitivityFactors[0]?.label ?? 'Balanced execution',
    
    recommendations: generateRecommendations(result, result.sensitivityFactors),
    
    confidenceLevel: confidence.level,
    confidenceStatement: confidence.statement,
  };
}

export default generateVerdict;

