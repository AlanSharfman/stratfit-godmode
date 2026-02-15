import type { ExecutiveReport, ReportSection, Recommendation } from "@/types/simulation";

/**
 * Generate an executive report from scenario data.
 */
export function generateExecutiveReport(inputs: {
  scenarioName: string;
  metrics: {
    revenue: number;
    cost: number;
    runway: number;
    growthRate: number;
    burnRate: number;
    cashBalance: number;
  };
  riskScore: number;
  kpis: Array<{ name: string; value: number; target: number; unit: string }>;
}): ExecutiveReport {
  const { scenarioName, metrics, riskScore, kpis } = inputs;
  const timestamp = new Date().toISOString();

  // Determine risk level
  let riskLevel: ExecutiveReport["riskAssessment"]["level"] = "low";
  if (riskScore >= 80) riskLevel = "critical";
  else if (riskScore >= 60) riskLevel = "high";
  else if (riskScore >= 40) riskLevel = "elevated";
  else if (riskScore >= 20) riskLevel = "moderate";

  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(metrics, riskScore);

  // Generate key findings
  const keyFindings = generateKeyFindings(metrics, kpis);

  // Generate risk factors
  const riskFactors = generateRiskFactors(metrics, riskScore);

  // Generate sections
  const sections = generateReportSections(metrics, kpis);

  // Generate recommendations
  const recommendations = generateRecommendations(metrics, riskScore);

  return {
    id: `report-${Date.now()}`,
    generatedAt: timestamp,
    scenarioName,
    executiveSummary,
    keyFindings,
    riskAssessment: {
      level: riskLevel,
      score: riskScore,
      factors: riskFactors,
    },
    sections,
    recommendations,
    appendix: {
      methodology: "Monte Carlo simulation with 1,000 iterations. Risk scoring based on composite weighted factors.",
      assumptions: [
        "Market conditions remain stable",
        "Current team capacity maintained",
        "No major regulatory changes",
      ],
      dataSourceS: ["Financial projections", "Historical performance", "Market benchmarks"],
    },
  };
}

function generateExecutiveSummary(
  metrics: { revenue: number; cost: number; runway: number; growthRate: number },
  riskScore: number
): string {
  const healthStatus = riskScore < 30 ? "healthy" : riskScore < 60 ? "moderate" : "concerning";
  const runwayStatus = metrics.runway > 12 ? "comfortable" : metrics.runway > 6 ? "adequate" : "limited";

  return `The current scenario shows ${healthStatus} business fundamentals with ${runwayStatus} runway of ${metrics.runway.toFixed(1)} months. Revenue stands at $${(metrics.revenue / 1000).toFixed(0)}K with a ${metrics.growthRate > 0 ? "positive" : "negative"} growth trajectory of ${(metrics.growthRate * 100).toFixed(1)}%. Overall risk assessment: ${riskScore}/100.`;
}

function generateKeyFindings(
  metrics: { revenue: number; cost: number; runway: number; burnRate: number },
  kpis: Array<{ name: string; value: number; target: number }>
): string[] {
  const findings: string[] = [];

  // Runway finding
  if (metrics.runway < 6) {
    findings.push(`⚠️ Critical: Cash runway is below 6 months (${metrics.runway.toFixed(1)} months remaining)`);
  } else if (metrics.runway < 12) {
    findings.push(`Runway is adequate but should be monitored (${metrics.runway.toFixed(1)} months)`);
  } else {
    findings.push(`Strong runway position with ${metrics.runway.toFixed(1)} months of operating capital`);
  }

  // Burn rate finding
  const monthlyBurn = metrics.burnRate;
  findings.push(`Monthly burn rate: $${(monthlyBurn / 1000).toFixed(0)}K`);

  // KPI performance
  const underperforming = kpis.filter((k) => k.value < k.target * 0.9);
  if (underperforming.length > 0) {
    findings.push(`${underperforming.length} KPI(s) underperforming relative to targets`);
  }

  // Efficiency
  const efficiency = metrics.revenue / metrics.cost;
  if (efficiency < 0.8) {
    findings.push("Cost efficiency below benchmark - optimization opportunities exist");
  } else if (efficiency > 1.2) {
    findings.push("Strong operational efficiency with positive unit economics");
  }

  return findings;
}

function generateRiskFactors(
  metrics: { runway: number; burnRate: number; growthRate: number },
  riskScore: number
): string[] {
  const factors: string[] = [];

  if (metrics.runway < 6) {
    factors.push("Limited cash runway");
  }
  if (metrics.burnRate > 150000) {
    factors.push("Elevated burn rate");
  }
  if (metrics.growthRate < 0) {
    factors.push("Negative revenue growth");
  }
  if (riskScore > 50) {
    factors.push("Composite risk score above threshold");
  }

  return factors.length > 0 ? factors : ["No significant risk factors identified"];
}

function generateReportSections(
  metrics: { revenue: number; cost: number; runway: number; growthRate: number; cashBalance: number },
  kpis: Array<{ name: string; value: number; target: number; unit: string }>
): ReportSection[] {
  return [
    {
      id: "financial-overview",
      title: "Financial Overview",
      priority: "critical",
      content: `Current financial position shows revenue of $${(metrics.revenue / 1000).toFixed(0)}K against costs of $${(metrics.cost / 1000).toFixed(0)}K. Cash balance stands at $${(metrics.cashBalance / 1000).toFixed(0)}K with ${metrics.runway.toFixed(1)} months of runway.`,
      metrics: [
        { label: "Revenue", value: metrics.revenue, unit: "$", trend: metrics.growthRate > 0 ? "up" : "down", delta: metrics.growthRate },
        { label: "Costs", value: metrics.cost, unit: "$", trend: "stable" },
        { label: "Runway", value: metrics.runway, unit: "months", trend: metrics.runway > 12 ? "stable" : "down" },
      ],
      chartType: "bar",
    },
    {
      id: "kpi-performance",
      title: "KPI Performance",
      priority: "high",
      content: "Key performance indicators compared against targets.",
      metrics: kpis.map((k) => ({
        label: k.name,
        value: k.value,
        unit: k.unit,
        trend: k.value >= k.target ? "up" : "down",
        delta: (k.value - k.target) / k.target,
      })),
      chartType: "gauge",
    },
    {
      id: "growth-trajectory",
      title: "Growth Trajectory",
      priority: "high",
      content: `Growth rate of ${(metrics.growthRate * 100).toFixed(1)}% ${metrics.growthRate > 0 ? "indicates positive momentum" : "suggests headwinds"}. Projections based on current trajectory.`,
      chartType: "line",
    },
    {
      id: "operational-efficiency",
      title: "Operational Efficiency",
      priority: "medium",
      content: "Analysis of cost structure and operational leverage.",
      metrics: [
        { label: "Cost Efficiency", value: metrics.revenue / metrics.cost, unit: "ratio", trend: "stable" },
      ],
    },
  ];
}

function generateRecommendations(
  metrics: { runway: number; burnRate: number; growthRate: number },
  riskScore: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (metrics.runway < 12) {
    recommendations.push({
      id: "extend-runway",
      title: "Extend Cash Runway",
      description: "Implement measures to extend runway to at least 12 months",
      impact: "high",
      effort: metrics.runway < 6 ? "high" : "medium",
      timeframe: "Immediate",
      confidence: 0.85,
    });
  }

  if (metrics.burnRate > 100000) {
    recommendations.push({
      id: "optimize-burn",
      title: "Optimize Burn Rate",
      description: "Review and reduce non-essential expenditures",
      impact: "high",
      effort: "medium",
      timeframe: "30-60 days",
      confidence: 0.78,
    });
  }

  if (metrics.growthRate < 0.05) {
    recommendations.push({
      id: "accelerate-growth",
      title: "Accelerate Revenue Growth",
      description: "Focus on high-impact growth initiatives",
      impact: "high",
      effort: "high",
      timeframe: "90 days",
      confidence: 0.65,
    });
  }

  if (riskScore > 40) {
    recommendations.push({
      id: "risk-mitigation",
      title: "Risk Mitigation Plan",
      description: "Develop and implement comprehensive risk mitigation strategies",
      impact: "medium",
      effort: "medium",
      timeframe: "60 days",
      confidence: 0.72,
    });
  }

  // Always include strategic review
  recommendations.push({
    id: "strategic-review",
    title: "Quarterly Strategic Review",
    description: "Schedule comprehensive scenario analysis and strategy alignment session",
    impact: "medium",
    effort: "low",
    timeframe: "Quarterly",
    confidence: 0.9,
  });

  return recommendations;
}

/**
 * Format report as markdown for export.
 */
export function formatReportAsMarkdown(report: ExecutiveReport): string {
  let md = `# Executive Scenario Report: ${report.scenarioName}\n\n`;
  md += `*Generated: ${new Date(report.generatedAt).toLocaleString()}*\n\n`;
  md += `---\n\n`;

  md += `## Executive Summary\n\n${report.executiveSummary}\n\n`;

  md += `## Risk Assessment\n\n`;
  md += `**Level:** ${report.riskAssessment.level.toUpperCase()}\n`;
  md += `**Score:** ${report.riskAssessment.score}/100\n\n`;
  md += `### Risk Factors\n`;
  report.riskAssessment.factors.forEach((f) => {
    md += `- ${f}\n`;
  });
  md += `\n`;

  md += `## Key Findings\n\n`;
  report.keyFindings.forEach((f) => {
    md += `- ${f}\n`;
  });
  md += `\n`;

  report.sections.forEach((section) => {
    md += `## ${section.title}\n\n`;
    md += `${section.content}\n\n`;
    if (section.metrics) {
      md += `| Metric | Value | Trend |\n`;
      md += `|--------|-------|-------|\n`;
      section.metrics.forEach((m) => {
        const trendIcon = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
        md += `| ${m.label} | ${m.value.toLocaleString()} ${m.unit} | ${trendIcon} |\n`;
      });
      md += `\n`;
    }
  });

  md += `## Recommendations\n\n`;
  report.recommendations.forEach((r, i) => {
    md += `### ${i + 1}. ${r.title}\n\n`;
    md += `${r.description}\n\n`;
    md += `- **Impact:** ${r.impact}\n`;
    md += `- **Effort:** ${r.effort}\n`;
    md += `- **Timeframe:** ${r.timeframe}\n`;
    md += `- **Confidence:** ${(r.confidence * 100).toFixed(0)}%\n\n`;
  });

  if (report.appendix) {
    md += `---\n\n## Appendix\n\n`;
    md += `**Methodology:** ${report.appendix.methodology}\n\n`;
    md += `**Assumptions:**\n`;
    report.appendix.assumptions.forEach((a) => {
      md += `- ${a}\n`;
    });
  }

  return md;
}
