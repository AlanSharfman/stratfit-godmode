import type { TrajectoryInsight, TrajectoryVector } from "@/types/trajectory";
import type { RiskZone, WeatherCondition } from "@/state/riskWeatherStore";

/**
 * Executive Scenario Report Types
 */
export type ExecutiveReport = {
  id: string;
  generatedAt: number;
  scenarioName: string;
  version: number;
  
  // Executive Summary
  summary: {
    headline: string;
    verdict: "favorable" | "cautious" | "critical";
    confidenceLevel: number;
    keyMessage: string;
  };
  
  // Strategic Position
  position: {
    currentState: string;
    trajectory: "ascending" | "stable" | "descending";
    timeToTarget: string;
    probabilityOfSuccess: number;
  };
  
  // Key Metrics
  metrics: ReportMetric[];
  
  // Risk Assessment
  riskAssessment: {
    overallCondition: WeatherCondition;
    primaryRisks: string[];
    mitigationOptions: string[];
  };
  
  // Insights & Recommendations
  insights: ReportInsight[];
  
  // Action Items
  actionItems: ActionItem[];
  
  // Appendix Data
  appendix: {
    trajectoryPoints: number;
    simulationRuns?: number;
    dataQuality: "high" | "medium" | "low";
  };
};

export type ReportMetric = {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "healthy" | "warning" | "critical";
  targetValue?: number;
  variance?: number;
};

export type ReportInsight = {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  relatedMetrics: string[];
};

export type ActionItem = {
  priority: 1 | 2 | 3;
  action: string;
  rationale: string;
  expectedOutcome: string;
  owner?: string;
  deadline?: string;
};

/**
 * Generate an executive scenario report from trajectory and risk data
 */
export function generateExecutiveReport(
  scenarioName: string,
  vectors: TrajectoryVector[],
  insights: TrajectoryInsight[],
  riskZones: RiskZone[],
  metrics: Record<string, { value: number; target?: number; unit: string }>
): ExecutiveReport {
  const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Analyze trajectory
  const trajectoryAnalysis = analyzeTrajectory(vectors);
  
  // Compute overall risk
  const overallRisk = computeOverallRisk(riskZones);
  
  // Determine verdict
  const verdict = determineVerdict(trajectoryAnalysis, overallRisk);
  
  // Generate headline
  const headline = generateHeadline(verdict, trajectoryAnalysis);
  
  // Process metrics
  const processedMetrics = processMetrics(metrics);
  
  // Generate insights
  const reportInsights = processInsights(insights);
  
  // Generate action items
  const actionItems = generateActionItems(verdict, riskZones, insights);
  
  return {
    id,
    generatedAt: Date.now(),
    scenarioName,
    version: 1,
    
    summary: {
      headline,
      verdict,
      confidenceLevel: trajectoryAnalysis.confidence,
      keyMessage: generateKeyMessage(verdict, trajectoryAnalysis, overallRisk),
    },
    
    position: {
      currentState: describeCurrentState(trajectoryAnalysis),
      trajectory: trajectoryAnalysis.direction,
      timeToTarget: estimateTimeToTarget(trajectoryAnalysis),
      probabilityOfSuccess: trajectoryAnalysis.successProbability,
    },
    
    metrics: processedMetrics,
    
    riskAssessment: {
      overallCondition: overallRisk.condition,
      primaryRisks: extractPrimaryRisks(riskZones),
      mitigationOptions: generateMitigationOptions(riskZones),
    },
    
    insights: reportInsights,
    actionItems,
    
    appendix: {
      trajectoryPoints: vectors.length,
      dataQuality: vectors.length > 30 ? "high" : vectors.length > 15 ? "medium" : "low",
    },
  };
}

function analyzeTrajectory(vectors: TrajectoryVector[]): {
  direction: "ascending" | "stable" | "descending";
  slope: number;
  confidence: number;
  successProbability: number;
} {
  if (vectors.length < 2) {
    return { direction: "stable", slope: 0, confidence: 0.5, successProbability: 0.5 };
  }
  
  // Calculate average Z movement (representing business progress)
  const firstThird = vectors.slice(0, Math.floor(vectors.length / 3));
  const lastThird = vectors.slice(Math.floor((vectors.length * 2) / 3));
  
  const avgFirst = firstThird.reduce((sum, v) => sum + v.z, 0) / firstThird.length;
  const avgLast = lastThird.reduce((sum, v) => sum + v.z, 0) / lastThird.length;
  
  const slope = (avgLast - avgFirst) / (vectors.length / 3);
  
  let direction: "ascending" | "stable" | "descending" = "stable";
  if (slope > 0.1) direction = "ascending";
  else if (slope < -0.1) direction = "descending";
  
  // Confidence based on consistency
  const zValues = vectors.map((v) => v.z);
  const variance = calculateVariance(zValues);
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance / 5));
  
  // Success probability
  const successProbability = direction === "ascending" 
    ? 0.6 + confidence * 0.3 
    : direction === "stable" 
    ? 0.5 
    : 0.4 - (1 - confidence) * 0.2;
  
  return { direction, slope, confidence, successProbability };
}

function computeOverallRisk(zones: RiskZone[]): { condition: WeatherCondition; score: number } {
  if (zones.length === 0) return { condition: "clear", score: 0 };
  
  const avgScore = zones.reduce((sum, z) => sum + z.riskScore, 0) / zones.length;
  const hasCritical = zones.some((z) => z.condition === "critical");
  
  let condition: WeatherCondition = "clear";
  if (hasCritical || avgScore > 0.75) condition = "critical";
  else if (avgScore > 0.5) condition = "stormy";
  else if (avgScore > 0.25) condition = "cloudy";
  
  return { condition, score: avgScore };
}

function determineVerdict(
  trajectory: ReturnType<typeof analyzeTrajectory>,
  risk: { condition: WeatherCondition; score: number }
): "favorable" | "cautious" | "critical" {
  if (risk.condition === "critical" || trajectory.successProbability < 0.35) {
    return "critical";
  }
  if (risk.condition === "stormy" || trajectory.direction === "descending") {
    return "cautious";
  }
  if (trajectory.direction === "ascending" && risk.score < 0.3) {
    return "favorable";
  }
  return "cautious";
}

function generateHeadline(
  verdict: "favorable" | "cautious" | "critical",
  trajectory: ReturnType<typeof analyzeTrajectory>
): string {
  switch (verdict) {
    case "favorable":
      return trajectory.direction === "ascending"
        ? "Positive momentum with strong execution indicators"
        : "Stable position with favorable conditions ahead";
    case "cautious":
      return trajectory.direction === "descending"
        ? "Trajectory requires intervention to maintain targets"
        : "Mixed signals warrant careful monitoring";
    case "critical":
      return "Critical attention required: risk factors elevated";
  }
}

function generateKeyMessage(
  verdict: "favorable" | "cautious" | "critical",
  trajectory: ReturnType<typeof analyzeTrajectory>,
  risk: { condition: WeatherCondition; score: number }
): string {
  const confidenceStr = trajectory.confidence > 0.7 ? "high" : trajectory.confidence > 0.5 ? "moderate" : "limited";
  const probabilityStr = `${Math.round(trajectory.successProbability * 100)}%`;
  
  switch (verdict) {
    case "favorable":
      return `Based on ${confidenceStr} confidence data, current trajectory suggests a ${probabilityStr} probability of reaching target state. Risk conditions are manageable.`;
    case "cautious":
      return `Analysis indicates ${probabilityStr} success probability with ${confidenceStr} confidence. Some risk factors require monitoring and potential adjustment.`;
    case "critical":
      return `Current conditions show ${probabilityStr} probability of target achievement. Immediate review of key risk factors and corrective action is recommended.`;
  }
}

function describeCurrentState(trajectory: ReturnType<typeof analyzeTrajectory>): string {
  if (trajectory.direction === "ascending") {
    return "Business trajectory is improving with positive momentum across key indicators.";
  }
  if (trajectory.direction === "descending") {
    return "Current trajectory shows declining momentum requiring strategic attention.";
  }
  return "Business trajectory is stable, maintaining current operational levels.";
}

function estimateTimeToTarget(trajectory: ReturnType<typeof analyzeTrajectory>): string {
  if (trajectory.direction === "ascending" && trajectory.slope > 0.2) {
    return "6-9 months at current pace";
  }
  if (trajectory.direction === "ascending") {
    return "9-12 months at current pace";
  }
  if (trajectory.direction === "stable") {
    return "12+ months without acceleration";
  }
  return "Target requires trajectory correction";
}

function processMetrics(
  metrics: Record<string, { value: number; target?: number; unit: string }>
): ReportMetric[] {
  return Object.entries(metrics).map(([name, data]) => {
    const variance = data.target ? (data.value - data.target) / data.target : undefined;
    
    let status: "healthy" | "warning" | "critical" = "healthy";
    let trend: "up" | "down" | "stable" = "stable";
    
    if (variance !== undefined) {
      if (variance < -0.2) status = "critical";
      else if (variance < -0.1) status = "warning";
      
      if (variance > 0.05) trend = "up";
      else if (variance < -0.05) trend = "down";
    }
    
    return {
      name,
      value: data.value,
      unit: data.unit,
      trend,
      status,
      targetValue: data.target,
      variance,
    };
  });
}

function processInsights(insights: TrajectoryInsight[]): ReportInsight[] {
  return insights.map((insight) => ({
    title: insight.title,
    description: insight.message,
    impact: insight.impact,
    confidence: insight.confidence,
    relatedMetrics: [], // Would be enriched with actual metric correlations
  }));
}

function extractPrimaryRisks(zones: RiskZone[]): string[] {
  const risks: string[] = [];
  
  for (const zone of zones) {
    if (zone.riskScore > 0.5) {
      risks.push(`${zone.name}: ${zone.description}`);
    }
    for (const alert of zone.alerts.filter((a) => a.severity === "critical")) {
      risks.push(alert.message);
    }
  }
  
  return risks.slice(0, 5);
}

function generateMitigationOptions(zones: RiskZone[]): string[] {
  const options: string[] = [];
  
  for (const zone of zones) {
    if (zone.condition === "critical") {
      options.push(`Immediate review of ${zone.name} factors`);
      options.push(`Prepare contingency plan for ${zone.name} deterioration`);
    } else if (zone.condition === "stormy") {
      options.push(`Monitor ${zone.name} indicators closely`);
    }
  }
  
  if (options.length === 0) {
    options.push("Maintain current monitoring cadence");
    options.push("Continue periodic risk assessment");
  }
  
  return options.slice(0, 4);
}

function generateActionItems(
  verdict: "favorable" | "cautious" | "critical",
  zones: RiskZone[],
  insights: TrajectoryInsight[]
): ActionItem[] {
  const items: ActionItem[] = [];
  
  // High-impact insights become P1 actions
  const highImpactInsights = insights.filter((i) => i.impact === "high");
  for (const insight of highImpactInsights.slice(0, 2)) {
    items.push({
      priority: 1,
      action: `Address: ${insight.title}`,
      rationale: insight.message,
      expectedOutcome: "Improved trajectory slope and reduced risk exposure",
    });
  }
  
  // Critical zones become P1 actions
  for (const zone of zones.filter((z) => z.condition === "critical").slice(0, 2)) {
    items.push({
      priority: 1,
      action: `Mitigate ${zone.name} risks`,
      rationale: zone.description,
      expectedOutcome: "Risk condition improvement from critical to stormy",
    });
  }
  
  // Verdict-specific actions
  if (verdict === "critical") {
    items.push({
      priority: 1,
      action: "Convene executive risk review",
      rationale: "Multiple critical factors require coordinated response",
      expectedOutcome: "Aligned action plan with clear ownership",
    });
  } else if (verdict === "cautious") {
    items.push({
      priority: 2,
      action: "Increase monitoring frequency",
      rationale: "Early detection of trend changes enables faster response",
      expectedOutcome: "Better prepared for trajectory shifts",
    });
  }
  
  // Always include a strategic review item
  items.push({
    priority: verdict === "favorable" ? 3 : 2,
    action: "Review scenario assumptions",
    rationale: "Ensure model inputs reflect current market conditions",
    expectedOutcome: "Higher confidence in forward projections",
  });
  
  return items.slice(0, 5);
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Format report as markdown for export
 */
export function formatReportAsMarkdown(report: ExecutiveReport): string {
  const verdictEmoji = report.summary.verdict === "favorable" ? "✅" : report.summary.verdict === "cautious" ? "⚠️" : "🚨";
  
  let md = `# Executive Scenario Report: ${report.scenarioName}\n\n`;
  md += `**Generated:** ${new Date(report.generatedAt).toLocaleString()}\n\n`;
  
  md += `## ${verdictEmoji} Executive Summary\n\n`;
  md += `**${report.summary.headline}**\n\n`;
  md += `${report.summary.keyMessage}\n\n`;
  md += `- **Verdict:** ${report.summary.verdict.toUpperCase()}\n`;
  md += `- **Confidence:** ${Math.round(report.summary.confidenceLevel * 100)}%\n\n`;
  
  md += `## Strategic Position\n\n`;
  md += `${report.position.currentState}\n\n`;
  md += `- **Trajectory:** ${report.position.trajectory}\n`;
  md += `- **Time to Target:** ${report.position.timeToTarget}\n`;
  md += `- **Success Probability:** ${Math.round(report.position.probabilityOfSuccess * 100)}%\n\n`;
  
  if (report.metrics.length > 0) {
    md += `## Key Metrics\n\n`;
    md += `| Metric | Value | Status | Trend |\n`;
    md += `|--------|-------|--------|-------|\n`;
    for (const m of report.metrics) {
      const statusIcon = m.status === "healthy" ? "🟢" : m.status === "warning" ? "🟡" : "🔴";
      const trendIcon = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
      md += `| ${m.name} | ${m.value} ${m.unit} | ${statusIcon} | ${trendIcon} |\n`;
    }
    md += `\n`;
  }
  
  md += `## Risk Assessment\n\n`;
  md += `**Overall Condition:** ${report.riskAssessment.overallCondition.toUpperCase()}\n\n`;
  if (report.riskAssessment.primaryRisks.length > 0) {
    md += `**Primary Risks:**\n`;
    for (const risk of report.riskAssessment.primaryRisks) {
      md += `- ${risk}\n`;
    }
    md += `\n`;
  }
  
  if (report.actionItems.length > 0) {
    md += `## Action Items\n\n`;
    for (const item of report.actionItems) {
      md += `### P${item.priority}: ${item.action}\n`;
      md += `${item.rationale}\n\n`;
      md += `**Expected Outcome:** ${item.expectedOutcome}\n\n`;
    }
  }
  
  md += `---\n*Report ID: ${report.id}*\n`;
  
  return md;
}
