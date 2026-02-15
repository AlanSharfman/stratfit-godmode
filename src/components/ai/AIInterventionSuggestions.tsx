import React, { useMemo, useState, useCallback } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import "./AIInterventionSuggestions.css";

type InterventionSuggestion = {
  id: string;
  title: string;
  category: "revenue" | "cost" | "growth" | "risk" | "strategic";
  priority: "high" | "medium" | "low";
  description: string;
  expectedImpact: string;
  timeframe: string;
  confidence: number;
  levers?: string[];
};

/**
 * AIInterventionSuggestions generates intelligent recommendations
 * based on current scenario state, trajectory insights, and risk factors.
 *
 * This is a deterministic rule-based system (not LLM-dependent)
 * that provides actionable suggestions for strategic interventions.
 */
export default function AIInterventionSuggestions() {
  const { baseline } = useScenarioStore();
  const { insights } = useTrajectoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate interventions based on current state
  const suggestions = useMemo((): InterventionSuggestion[] => {
    const interventions: InterventionSuggestion[] = [];

    // Extract metrics from simulation snapshot (if available)
    const simulation = baseline?.simulation;
    const revenue = simulation?.medianARR || 0;
    const cash = simulation?.medianCash || 0;
    const runway = simulation?.medianRunway || 24;
    const survivalRate = simulation?.survivalRate || 1;
    
    // Estimate burn rate from cash and runway
    const burnRate = runway > 0 ? cash / runway : 0;
    const burnRatio = revenue > 0 ? burnRate / revenue : 0;
    
    // Use survival rate as a proxy for growth health
    const growthHealthy = survivalRate > 0.7;

    // High-impact insights from trajectory
    const highImpactInsights = insights.filter((i) => i.impact === "high");

    // Generate interventions based on analysis

    // 1. Runway interventions
    if (runway < 6) {
      interventions.push({
        id: "runway-critical",
        title: "Extend Runway Immediately",
        category: "risk",
        priority: "high",
        description:
          "Current runway is below 6 months. This requires immediate action to either reduce burn rate or secure additional funding.",
        expectedImpact: "Extend runway by 3-6 months",
        timeframe: "Immediate (0-30 days)",
        confidence: 0.92,
        levers: ["Reduce non-essential expenses", "Accelerate fundraising", "Renegotiate vendor contracts"],
      });
    } else if (runway < 12) {
      interventions.push({
        id: "runway-warning",
        title: "Plan Runway Extension",
        category: "strategic",
        priority: "medium",
        description:
          "Runway is under 12 months. Begin planning for capital efficiency improvements or next funding round.",
        expectedImpact: "Secure additional 6-12 month buffer",
        timeframe: "Near-term (30-90 days)",
        confidence: 0.85,
        levers: ["Revenue acceleration", "Cost optimization", "Bridge financing"],
      });
    }

    // 2. Burn efficiency interventions
    if (burnRatio > 1.5) {
      interventions.push({
        id: "burn-critical",
        title: "Reduce Burn Rate",
        category: "cost",
        priority: "high",
        description:
          "Burn rate significantly exceeds revenue. Focus on achieving sustainable unit economics.",
        expectedImpact: "Reduce burn ratio to <1.2x revenue",
        timeframe: "Short-term (30-60 days)",
        confidence: 0.88,
        levers: ["Headcount optimization", "Infrastructure efficiency", "Marketing ROI analysis"],
      });
    } else if (burnRatio > 1.0) {
      interventions.push({
        id: "burn-moderate",
        title: "Optimize Operational Efficiency",
        category: "cost",
        priority: "medium",
        description:
          "Burn rate exceeds revenue. Identify opportunities to improve operational leverage.",
        expectedImpact: "Achieve burn/revenue parity within 2Q",
        timeframe: "Medium-term (60-120 days)",
        confidence: 0.82,
        levers: ["Process automation", "Vendor consolidation", "Team productivity"],
      });
    }

    // 3. Growth interventions (based on survival rate as a proxy for growth health)
    if (!growthHealthy && survivalRate < 0.5) {
      interventions.push({
        id: "growth-stagnant",
        title: "Accelerate Growth Engine",
        category: "growth",
        priority: "high",
        description:
          "Survival rate indicates growth challenges. Identify and activate growth levers.",
        expectedImpact: "Improve survival probability to 70%+",
        timeframe: "Near-term (30-90 days)",
        confidence: 0.75,
        levers: ["Channel expansion", "Product-led growth", "Sales velocity optimization"],
      });
    } else if (survivalRate > 0.85) {
      interventions.push({
        id: "growth-sustain",
        title: "Sustain Growth Momentum",
        category: "growth",
        priority: "medium",
        description:
          "Strong survival trajectory. Focus on maintaining momentum while building infrastructure.",
        expectedImpact: "Maintain strong survival with operational stability",
        timeframe: "Ongoing",
        confidence: 0.8,
        levers: ["Team scaling", "Infrastructure investment", "Customer success"],
      });
    }

    // 4. Revenue interventions
    if (revenue > 0 && survivalRate < 0.7) {
      interventions.push({
        id: "revenue-optimize",
        title: "Revenue Optimization",
        category: "revenue",
        priority: "medium",
        description:
          "Identify opportunities to increase revenue per customer and expand market reach.",
        expectedImpact: "20-30% revenue uplift potential",
        timeframe: "Medium-term (60-120 days)",
        confidence: 0.78,
        levers: ["Pricing optimization", "Upsell/cross-sell", "Market expansion"],
      });
    }

    // 5. Insight-driven interventions
    highImpactInsights.forEach((insight, idx) => {
      interventions.push({
        id: `insight-${idx}`,
        title: `Address: ${insight.title}`,
        category: "strategic",
        priority: "high",
        description: insight.message,
        expectedImpact: "Mitigate trajectory risk",
        timeframe: "Immediate attention required",
        confidence: insight.confidence,
        levers: ["Strategic review", "Scenario analysis", "Action planning"],
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return interventions.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }, [baseline, insights]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const categoryIcons: Record<string, string> = {
    revenue: "💰",
    cost: "📉",
    growth: "📈",
    risk: "⚠️",
    strategic: "🎯",
  };

  if (suggestions.length === 0) {
    return (
      <div className="ai-interventions ai-interventions--empty">
        <div className="ai-interventions__empty-state">
          <span className="ai-interventions__empty-icon">✓</span>
          <p>No immediate interventions required</p>
          <span className="ai-interventions__empty-hint">
            Current metrics are within acceptable parameters
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-interventions">
      <div className="ai-interventions__header">
        <h3 className="ai-interventions__title">
          <span className="ai-interventions__title-icon">💡</span>
          AI Intervention Suggestions
        </h3>
        <span className="ai-interventions__count">
          {suggestions.length} recommendation{suggestions.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="ai-interventions__list">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`ai-intervention ai-intervention--${suggestion.priority}`}
          >
            <button
              className="ai-intervention__header"
              onClick={() => toggleExpand(suggestion.id)}
            >
              <div className="ai-intervention__header-left">
                <span className="ai-intervention__icon">
                  {categoryIcons[suggestion.category]}
                </span>
                <div className="ai-intervention__header-text">
                  <span className="ai-intervention__title">{suggestion.title}</span>
                  <span className="ai-intervention__meta">
                    <span className={`ai-intervention__priority ai-intervention__priority--${suggestion.priority}`}>
                      {suggestion.priority}
                    </span>
                    <span className="ai-intervention__timeframe">
                      {suggestion.timeframe}
                    </span>
                  </span>
                </div>
              </div>
              <span className={`ai-intervention__chevron ${expandedId === suggestion.id ? "expanded" : ""}`}>
                ▼
              </span>
            </button>

            {expandedId === suggestion.id && (
              <div className="ai-intervention__body">
                <p className="ai-intervention__description">{suggestion.description}</p>

                <div className="ai-intervention__details">
                  <div className="ai-intervention__detail">
                    <span className="ai-intervention__detail-label">Expected Impact</span>
                    <span className="ai-intervention__detail-value">
                      {suggestion.expectedImpact}
                    </span>
                  </div>
                  <div className="ai-intervention__detail">
                    <span className="ai-intervention__detail-label">Confidence</span>
                    <span className="ai-intervention__detail-value">
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {suggestion.levers && suggestion.levers.length > 0 && (
                  <div className="ai-intervention__levers">
                    <span className="ai-intervention__levers-label">Suggested Levers</span>
                    <ul className="ai-intervention__levers-list">
                      {suggestion.levers.map((lever, idx) => (
                        <li key={idx}>{lever}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
