import React, { useMemo, useState } from "react";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import { useRiskWeatherStore } from "@/state/riskWeatherStore";
import type { TrajectoryInsight } from "@/types/trajectory";
import type { RiskZone } from "@/state/riskWeatherStore";

/**
 * Intervention type definitions
 */
type InterventionCategory = "operational" | "strategic" | "financial" | "defensive";
type InterventionUrgency = "immediate" | "short-term" | "medium-term";

interface AIIntervention {
  id: string;
  category: InterventionCategory;
  urgency: InterventionUrgency;
  title: string;
  description: string;
  impact: {
    metric: string;
    delta: number;
    unit: string;
  };
  confidence: number;
  riskReduction: number;
  trigger: string;
  steps: string[];
}

/**
 * Generate AI-powered interventions from trajectory and risk data
 */
function generateInterventions(
  insights: TrajectoryInsight[],
  zones: RiskZone[]
): AIIntervention[] {
  const interventions: AIIntervention[] = [];
  let idCounter = 1;

  // Analyze risk zones for intervention opportunities
  zones.forEach((zone) => {
    if (zone.condition === "critical") {
      interventions.push({
        id: `int-${idCounter++}`,
        category: "defensive",
        urgency: "immediate",
        title: `Mitigate ${zone.name} Risk`,
        description: `Critical risk detected in ${zone.name.toLowerCase()}. Immediate defensive action recommended to prevent scenario degradation.`,
        impact: { metric: "Risk Score", delta: -25, unit: "pts" },
        confidence: 0.88,
        riskReduction: 0.35,
        trigger: `${zone.name} at critical condition (${(zone.riskScore * 100).toFixed(0)}% risk)`,
        steps: [
          "Identify root cause of critical escalation",
          "Activate contingency protocols",
          "Monitor for stabilization signals",
        ],
      });
    } else if (zone.condition === "stormy") {
      interventions.push({
        id: `int-${idCounter++}`,
        category: "strategic",
        urgency: "short-term",
        title: `Address ${zone.name} Exposure`,
        description: `Elevated risk in ${zone.name.toLowerCase()} requires strategic attention within the next planning cycle.`,
        impact: { metric: "Risk Score", delta: -15, unit: "pts" },
        confidence: 0.78,
        riskReduction: 0.22,
        trigger: `${zone.name} at stormy condition`,
        steps: [
          "Review current resource allocation",
          "Develop targeted mitigation plan",
          "Schedule checkpoint review",
        ],
      });
    }
  });

  // Analyze insights for intervention opportunities
  insights.forEach((insight) => {
    // Generate interventions based on the insight's impact level
    // High impact insights get immediate attention, lower impact gets strategic review
    if (insight.impact === "high") {
      interventions.push({
        id: `int-${idCounter++}`,
        category: "operational",
        urgency: "immediate",
        title: "Address Critical Insight",
        description: `${insight.title}: ${insight.message}. High-impact factor requiring immediate attention.`,
        impact: { metric: "Risk Mitigation", delta: -25, unit: "%" },
        confidence: insight.confidence,
        riskReduction: 0.25,
        trigger: insight.title,
        steps: [
          "Review insight context and implications",
          "Identify root cause factors",
          "Implement corrective measures",
          "Monitor for resolution",
        ],
      });
    } else if (insight.impact === "medium") {
      interventions.push({
        id: `int-${idCounter++}`,
        category: "strategic",
        urgency: "short-term",
        title: "Strategic Review Required",
        description: `${insight.title}: ${insight.message}. Requires strategic attention.`,
        impact: { metric: "Trajectory Alignment", delta: 12, unit: "%" },
        confidence: insight.confidence,
        riskReduction: 0.15,
        trigger: insight.title,
        steps: [
          "Analyze impact on trajectory",
          "Develop mitigation strategy",
          "Schedule checkpoint review",
        ],
      });
    } else {
      // Low impact - opportunity for optimization
      interventions.push({
        id: `int-${idCounter++}`,
        category: "strategic",
        urgency: "medium-term",
        title: "Optimization Opportunity",
        description: `${insight.title}: ${insight.message}. Consider for optimization.`,
        impact: { metric: "Efficiency", delta: 8, unit: "%" },
        confidence: insight.confidence,
        riskReduction: 0.05,
        trigger: insight.title,
        steps: [
          "Evaluate opportunity cost",
          "Schedule for review cycle",
          "Implement if resources allow",
        ],
      });
    }
  });

  // Add default strategic interventions if none generated
  if (interventions.length === 0) {
    interventions.push({
      id: `int-${idCounter++}`,
      category: "strategic",
      urgency: "medium-term",
      title: "Scenario Optimization Sweep",
      description: "Conduct comprehensive review to identify efficiency improvements and strategic enhancements.",
      impact: { metric: "Overall Performance", delta: 8, unit: "%" },
      confidence: 0.72,
      riskReduction: 0.1,
      trigger: "Routine optimization cycle",
      steps: [
        "Review key performance indicators",
        "Identify improvement opportunities",
        "Prioritize high-impact changes",
        "Schedule implementation",
      ],
    });
  }

  // Sort by urgency and confidence
  const urgencyOrder: Record<InterventionUrgency, number> = {
    immediate: 0,
    "short-term": 1,
    "medium-term": 2,
  };

  return interventions.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * AIInterventionSuggestions component
 * Displays AI-powered intervention recommendations based on trajectory analysis
 */
export default function AIInterventionSuggestions() {
  const { insights } = useTrajectoryStore();
  const { zones } = useRiskWeatherStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InterventionCategory | "all">("all");

  const interventions = useMemo(
    () => generateInterventions(insights, zones),
    [insights, zones]
  );

  const filteredInterventions =
    filter === "all"
      ? interventions
      : interventions.filter((int) => int.category === filter);

  return (
    <div style={panelStyle}>
      <Header />
      <FilterBar filter={filter} onFilterChange={setFilter} />
      <InterventionList
        interventions={filteredInterventions}
        expandedId={expandedId}
        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
      />
      {interventions.length > 0 && <AISummary interventions={interventions} />}
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🧠</span>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.15em",
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            AI Guidance
          </div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            Intervention Suggestions
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: InterventionCategory | "all";
  onFilterChange: (f: InterventionCategory | "all") => void;
}) {
  const categories: Array<{ key: InterventionCategory | "all"; label: string; icon: string }> = [
    { key: "all", label: "All", icon: "📋" },
    { key: "operational", label: "Ops", icon: "⚙️" },
    { key: "strategic", label: "Strategy", icon: "🎯" },
    { key: "financial", label: "Finance", icon: "💰" },
    { key: "defensive", label: "Defense", icon: "🛡️" },
  ];

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      {categories.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "5px 10px",
            borderRadius: 8,
            border:
              filter === key
                ? "1px solid rgba(34, 211, 238, 0.4)"
                : "1px solid rgba(255,255,255,0.1)",
            background:
              filter === key
                ? "rgba(34, 211, 238, 0.12)"
                : "rgba(255,255,255,0.03)",
            color:
              filter === key
                ? "rgba(34, 211, 238, 0.95)"
                : "rgba(255,255,255,0.7)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

function InterventionList({
  interventions,
  expandedId,
  onToggle,
}: {
  interventions: AIIntervention[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (interventions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0", opacity: 0.6 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 12 }}>No interventions needed for this category</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {interventions.map((intervention) => (
        <InterventionCard
          key={intervention.id}
          intervention={intervention}
          isExpanded={expandedId === intervention.id}
          onToggle={() => onToggle(intervention.id)}
        />
      ))}
    </div>
  );
}

function InterventionCard({
  intervention,
  isExpanded,
  onToggle,
}: {
  intervention: AIIntervention;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const categoryConfig = getCategoryConfig(intervention.category);
  const urgencyConfig = getUrgencyConfig(intervention.urgency);

  return (
    <div
      style={{
        borderRadius: 12,
        background: isExpanded
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${
          isExpanded ? "rgba(34, 211, 238, 0.25)" : "rgba(255,255,255,0.08)"
        }`,
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>{categoryConfig.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 4,
                background: urgencyConfig.bg,
                color: urgencyConfig.color,
              }}
            >
              {intervention.urgency}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                opacity: 0.6,
                textTransform: "uppercase",
              }}
            >
              {intervention.category}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {intervention.title}
          </div>
          <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.4 }}>
            {intervention.description}
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            opacity: 0.5,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          style={{
            padding: "0 12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Metrics */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <MetricPill
              label="Impact"
              value={`${intervention.impact.delta > 0 ? "+" : ""}${intervention.impact.delta}${intervention.impact.unit}`}
              color={intervention.impact.delta > 0 ? "#22d3ee" : "#ef4444"}
            />
            <MetricPill
              label="Confidence"
              value={`${Math.round(intervention.confidence * 100)}%`}
              color="#a78bfa"
            />
            {intervention.riskReduction > 0 && (
              <MetricPill
                label="Risk ↓"
                value={`${Math.round(intervention.riskReduction * 100)}%`}
                color="#4ade80"
              />
            )}
          </div>

          {/* Trigger */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                opacity: 0.5,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Trigger Condition
            </div>
            <div
              style={{
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {intervention.trigger}
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                opacity: 0.5,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Recommended Steps
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {intervention.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(34, 211, 238, 0.1)",
                      color: "rgba(34, 211, 238, 0.8)",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ opacity: 0.85 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ fontSize: 8, opacity: 0.6, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function AISummary({ interventions }: { interventions: AIIntervention[] }) {
  const summary = useMemo(() => {
    const immediateCount = interventions.filter((i) => i.urgency === "immediate").length;
    const avgConfidence =
      interventions.reduce((sum, i) => sum + i.confidence, 0) / interventions.length;
    const totalRiskReduction =
      interventions.reduce((sum, i) => sum + i.riskReduction, 0);

    return {
      total: interventions.length,
      immediate: immediateCount,
      avgConfidence,
      totalRiskReduction,
    };
  }, [interventions]);

  return (
    <div
      style={{
        marginTop: 14,
        padding: 10,
        borderRadius: 10,
        background: "linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(168, 85, 247, 0.05))",
        border: "1px solid rgba(34, 211, 238, 0.15)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          opacity: 0.6,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        AI Summary
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.6, opacity: 0.9 }}>
        {summary.total} intervention{summary.total !== 1 ? "s" : ""} identified
        {summary.immediate > 0 && (
          <span style={{ color: "#ef4444" }}>
            {" "}
            ({summary.immediate} requiring immediate attention)
          </span>
        )}
        . Implementing all recommendations could reduce risk exposure by up to{" "}
        <span style={{ color: "#4ade80", fontWeight: 600 }}>
          {Math.round(summary.totalRiskReduction * 100)}%
        </span>
        {" "}with{" "}
        <span style={{ color: "#a78bfa", fontWeight: 600 }}>
          {Math.round(summary.avgConfidence * 100)}%
        </span>{" "}
        average confidence.
      </div>
    </div>
  );
}

function getCategoryConfig(category: InterventionCategory) {
  const configs: Record<InterventionCategory, { icon: string; color: string }> = {
    operational: { icon: "⚙️", color: "#60a5fa" },
    strategic: { icon: "🎯", color: "#a78bfa" },
    financial: { icon: "💰", color: "#4ade80" },
    defensive: { icon: "🛡️", color: "#f59e0b" },
  };
  return configs[category];
}

function getUrgencyConfig(urgency: InterventionUrgency) {
  const configs: Record<InterventionUrgency, { bg: string; color: string }> = {
    immediate: { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" },
    "short-term": { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" },
    "medium-term": { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8" },
  };
  return configs[urgency];
}

const panelStyle: React.CSSProperties = {
  width: 340,
  maxHeight: "calc(100vh - 140px)",
  overflow: "auto",
  borderRadius: 16,
  background: "rgba(6, 10, 14, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  backdropFilter: "blur(14px)",
  padding: 14,
  color: "rgba(235, 248, 255, 0.92)",
};
