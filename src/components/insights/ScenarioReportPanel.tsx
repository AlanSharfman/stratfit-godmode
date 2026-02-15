import React, { useState, useMemo } from "react";
import { useTrajectoryStore } from "@/state/trajectoryStore";
import { useRiskWeatherStore } from "@/state/riskWeatherStore";
import {
  generateExecutiveReport,
  formatReportAsMarkdown,
  type ExecutiveReport,
} from "@/engine/reports/scenarioReportGenerator";

/**
 * ScenarioReportPanel provides executive scenario report generation
 * and export functionality.
 */
export default function ScenarioReportPanel() {
  const { scenarioVectors: vectors, insights } = useTrajectoryStore();
  const { zones } = useRiskWeatherStore();
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = vectors.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate async report generation
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const newReport = generateExecutiveReport(
      "Current Scenario",
      vectors,
      insights,
      zones,
      {
        Revenue: { value: 850000, target: 1000000, unit: "USD" },
        Runway: { value: 14, unit: "months" },
        Growth: { value: 0.12, unit: "%" },
        Churn: { value: 0.045, unit: "%" },
      }
    );
    
    setReport(newReport);
    setIsGenerating(false);
  };

  const handleExport = () => {
    if (!report) return;
    
    const markdown = formatReportAsMarkdown(report);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={panelStyle}>
      <Header />

      {!report ? (
        <GeneratePrompt
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />
      ) : (
        <ReportView report={report} onExport={handleExport} onRegenerate={handleGenerate} />
      )}
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", opacity: 0.6 }}>
        EXECUTIVE REPORT
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
        Scenario Analysis
      </div>
    </div>
  );
}

function GeneratePrompt({
  canGenerate,
  isGenerating,
  onGenerate,
}: {
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Generate an executive-level analysis of the current scenario trajectory,
        risk conditions, and recommended actions.
      </div>
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        style={{
          padding: "10px 20px",
          borderRadius: 10,
          border: "1px solid rgba(34, 211, 238, 0.3)",
          background: canGenerate
            ? "linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.05))"
            : "rgba(255,255,255,0.05)",
          color: canGenerate ? "rgba(34, 211, 238, 0.95)" : "rgba(255,255,255,0.4)",
          fontSize: 13,
          fontWeight: 600,
          cursor: canGenerate && !isGenerating ? "pointer" : "default",
          transition: "all 0.2s ease",
        }}
      >
        {isGenerating ? "Generating..." : "Generate Report"}
      </button>
      {!canGenerate && (
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>
          Run a scenario to enable report generation
        </div>
      )}
    </div>
  );
}

function ReportView({
  report,
  onExport,
  onRegenerate,
}: {
  report: ExecutiveReport;
  onExport: () => void;
  onRegenerate: () => void;
}) {
  const verdictConfig = getVerdictConfig(report.summary.verdict);

  return (
    <div>
      {/* Summary Card */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: verdictConfig.bgGradient,
          border: `1px solid ${verdictConfig.borderColor}`,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{verdictConfig.icon}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: verdictConfig.textColor,
            }}
          >
            {report.summary.verdict}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          {report.summary.headline}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>
          {report.summary.keyMessage}
        </div>
      </div>

      {/* Position Summary */}
      <Section title="Strategic Position">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <MetricBox
            label="Trajectory"
            value={report.position.trajectory}
            icon={report.position.trajectory === "ascending" ? "📈" : report.position.trajectory === "descending" ? "📉" : "➡️"}
          />
          <MetricBox
            label="Success Prob."
            value={`${Math.round(report.position.probabilityOfSuccess * 100)}%`}
          />
          <MetricBox
            label="Time to Target"
            value={report.position.timeToTarget}
            span={2}
          />
        </div>
      </Section>

      {/* Action Items */}
      {report.actionItems.length > 0 && (
        <Section title="Priority Actions">
          {report.actionItems.slice(0, 3).map((item, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(255,255,255,0.06)`,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background:
                      item.priority === 1
                        ? "rgba(239, 68, 68, 0.2)"
                        : item.priority === 2
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(148, 163, 184, 0.2)",
                    color:
                      item.priority === 1
                        ? "#ef4444"
                        : item.priority === 2
                        ? "#f59e0b"
                        : "#94a3b8",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  P{item.priority}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{item.action}</span>
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
                {item.rationale}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={onExport} style={buttonStyle}>
          📥 Export
        </button>
        <button onClick={onRegenerate} style={{ ...buttonStyle, opacity: 0.7 }}>
          🔄 Refresh
        </button>
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 10, textAlign: "right" }}>
        Generated {new Date(report.generatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          opacity: 0.6,
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon,
  span = 1,
}: {
  label: string;
  value: string;
  icon?: string;
  span?: number;
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        gridColumn: span > 1 ? `span ${span}` : undefined,
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {value}
      </div>
    </div>
  );
}

function getVerdictConfig(verdict: "favorable" | "cautious" | "critical") {
  switch (verdict) {
    case "favorable":
      return {
        icon: "✅",
        textColor: "#22d3ee",
        borderColor: "rgba(34, 211, 238, 0.25)",
        bgGradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.02))",
      };
    case "cautious":
      return {
        icon: "⚠️",
        textColor: "#f59e0b",
        borderColor: "rgba(245, 158, 11, 0.25)",
        bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))",
      };
    case "critical":
      return {
        icon: "🚨",
        textColor: "#ef4444",
        borderColor: "rgba(239, 68, 68, 0.25)",
        bgGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))",
      };
  }
}

const panelStyle: React.CSSProperties = {
  width: 320,
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

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(235, 248, 255, 0.9)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
