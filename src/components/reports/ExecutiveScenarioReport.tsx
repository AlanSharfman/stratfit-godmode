import React, { useMemo, useCallback } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import "./ExecutiveScenarioReport.css";

type ReportSection = {
  title: string;
  content: string;
  severity?: "info" | "warning" | "critical";
};

/**
 * ExecutiveScenarioReport generates a structured executive summary
 * of the current scenario state, trajectory insights, and strategic recommendations.
 *
 * Features:
 * - Auto-generated from scenario + trajectory state
 * - Exportable as PDF or clipboard
 * - Institutional styling with clear hierarchy
 */
export default function ExecutiveScenarioReport() {
  const { baseline, savedScenarios, activeScenarioId } = useScenarioStore();
  const { insights, scenarioVectors: vectors } = useTrajectoryStore();

  const activeScenario = useMemo(() => {
    if (activeScenarioId === "base") return null;
    return savedScenarios.find((s) => s.id === activeScenarioId) ?? null;
  }, [savedScenarios, activeScenarioId]);

  // Generate report sections from current state
  const reportSections = useMemo((): ReportSection[] => {
    const sections: ReportSection[] = [];

    // Executive Summary
    sections.push({
      title: "Executive Summary",
      content: generateExecutiveSummary(baseline, activeScenario),
      severity: "info",
    });

    // Current Position
    sections.push({
      title: "Current Position",
      content: generateCurrentPosition(baseline),
    });

    // Trajectory Analysis
    if (vectors.length > 0) {
      sections.push({
        title: "Trajectory Analysis",
        content: generateTrajectoryAnalysis(vectors, insights),
        severity: insights.some((i) => i.impact === "high") ? "warning" : "info",
      });
    }

    // Risk Assessment
    const riskLevel = calculateRiskLevel(baseline, insights);
    sections.push({
      title: "Risk Assessment",
      content: generateRiskAssessment(riskLevel, insights),
      severity: riskLevel > 0.7 ? "critical" : riskLevel > 0.4 ? "warning" : "info",
    });

    // Strategic Recommendations
    sections.push({
      title: "Strategic Recommendations",
      content: generateRecommendations(baseline, insights),
    });

    return sections;
  }, [baseline, activeScenario, vectors, insights]);

  // Copy report to clipboard
  const copyToClipboard = useCallback(() => {
    const text = reportSections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(text).then(() => {
      // Could trigger a toast notification here
      console.log("Report copied to clipboard");
    });
  }, [reportSections]);

  // Generate timestamp
  const timestamp = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="exec-report">
      {/* Header */}
      <div className="exec-report__header">
        <div className="exec-report__title-row">
          <h1 className="exec-report__title">Executive Scenario Report</h1>
          <button className="exec-report__action" onClick={copyToClipboard}>
            <CopyIcon />
            Copy
          </button>
        </div>
        <div className="exec-report__meta">
          <span className="exec-report__timestamp">{timestamp}</span>
          {activeScenario && (
            <span className="exec-report__scenario-tag">
              Scenario: {activeScenario.name}
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="exec-report__content">
        {reportSections.map((section, idx) => (
          <section
            key={idx}
            className={`exec-report__section exec-report__section--${section.severity || "info"}`}
          >
            <h2 className="exec-report__section-title">{section.title}</h2>
            <div className="exec-report__section-body">
              {section.content.split("\n").map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="exec-report__footer">
        <span className="exec-report__disclaimer">
          This report is auto-generated from current scenario state. Verify key
          assumptions before making strategic decisions.
        </span>
      </div>
    </div>
  );
}

// --- Helper Functions ---

function generateExecutiveSummary(
  baseline: any,
  activeScenario: any
): string {
  const scenarioName = activeScenario?.name || "Base Case";
  const revenue = baseline?.revenue || 0;
  const burnRate = baseline?.burnRate || 0;
  const runway = burnRate > 0 ? Math.round((baseline?.cashBalance || 0) / burnRate) : 0;

  return `This report summarizes the ${scenarioName} scenario for strategic review.

Current monthly revenue stands at $${formatNumber(revenue)} with a burn rate of $${formatNumber(burnRate)}, providing approximately ${runway} months of runway.

The trajectory analysis indicates ${activeScenario ? "scenario-specific adjustments have been applied" : "baseline operating parameters are in effect"}.`;
}

function generateCurrentPosition(baseline: any): string {
  const metrics = [
    `Revenue: $${formatNumber(baseline?.revenue || 0)}/mo`,
    `Burn Rate: $${formatNumber(baseline?.burnRate || 0)}/mo`,
    `Cash Balance: $${formatNumber(baseline?.cashBalance || 0)}`,
    `Growth Rate: ${((baseline?.growthRate || 0) * 100).toFixed(1)}%`,
  ];

  return metrics.join("\n");
}

function generateTrajectoryAnalysis(
  vectors: any[],
  insights: any[]
): string {
  const pathLength = vectors.length;
  const highImpactCount = insights.filter((i) => i.impact === "high").length;
  const avgConfidence =
    insights.length > 0
      ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
      : 0;

  let analysis = `The business trajectory spans ${pathLength} projection points with ${insights.length} identified inflection points.`;

  if (highImpactCount > 0) {
    analysis += `\n\n${highImpactCount} high-impact insight${highImpactCount > 1 ? "s" : ""} require${highImpactCount === 1 ? "s" : ""} immediate attention.`;
  }

  if (avgConfidence > 0) {
    analysis += `\n\nAverage insight confidence: ${(avgConfidence * 100).toFixed(0)}%`;
  }

  return analysis;
}

function calculateRiskLevel(baseline: any, insights: any[]): number {
  let risk = 0.3; // Base risk

  // High burn rate increases risk
  const burnRatio = (baseline?.burnRate || 0) / Math.max(baseline?.revenue || 1, 1);
  if (burnRatio > 1.5) risk += 0.3;
  else if (burnRatio > 1.0) risk += 0.15;

  // High-impact insights increase risk
  const highImpactCount = insights.filter((i) => i.impact === "high").length;
  risk += highImpactCount * 0.1;

  // Low runway increases risk
  const runway =
    (baseline?.burnRate || 0) > 0
      ? (baseline?.cashBalance || 0) / (baseline?.burnRate || 1)
      : 12;
  if (runway < 6) risk += 0.25;
  else if (runway < 9) risk += 0.1;

  return Math.min(risk, 1.0);
}

function generateRiskAssessment(riskLevel: number, insights: any[]): string {
  const riskPercent = (riskLevel * 100).toFixed(0);
  let assessment = `Overall risk score: ${riskPercent}%\n\n`;

  if (riskLevel > 0.7) {
    assessment += "Risk level is ELEVATED. Immediate strategic review recommended.";
  } else if (riskLevel > 0.4) {
    assessment += "Risk level is MODERATE. Monitor key indicators closely.";
  } else {
    assessment += "Risk level is within acceptable parameters.";
  }

  // Add specific risk factors from insights
  const highRisks = insights.filter((i) => i.impact === "high");
  if (highRisks.length > 0) {
    assessment += "\n\nKey risk factors:";
    highRisks.forEach((r) => {
      assessment += `\n• ${r.title}`;
    });
  }

  return assessment;
}

function generateRecommendations(baseline: any, insights: any[]): string {
  const recommendations: string[] = [];

  // Runway-based recommendations
  const runway =
    (baseline?.burnRate || 0) > 0
      ? (baseline?.cashBalance || 0) / (baseline?.burnRate || 1)
      : 12;

  if (runway < 6) {
    recommendations.push(
      "Extend runway: Prioritize cost reduction or accelerate fundraising timeline"
    );
  }

  // Burn ratio recommendations
  const burnRatio = (baseline?.burnRate || 0) / Math.max(baseline?.revenue || 1, 1);
  if (burnRatio > 1.2) {
    recommendations.push(
      "Optimize burn efficiency: Target path to sustainable unit economics"
    );
  }

  // Insight-driven recommendations
  const highImpactInsights = insights.filter((i) => i.impact === "high");
  if (highImpactInsights.length > 0) {
    recommendations.push(
      "Address high-impact inflection points identified in trajectory analysis"
    );
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push(
      "Continue monitoring key metrics and trajectory alignment"
    );
  }

  return recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toFixed(0);
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
