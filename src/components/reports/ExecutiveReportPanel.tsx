import { useState, useMemo } from "react";
import { generateExecutiveReport, formatReportAsMarkdown } from "./reportGenerator";
import "./ExecutiveReportPanel.css";

type Props = {
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
  onClose?: () => void;
};

/**
 * ExecutiveReportPanel generates and displays a comprehensive executive report.
 *
 * Features:
 * - Auto-generated executive summary
 * - Risk assessment with scoring
 * - Key findings and recommendations
 * - Export to Markdown
 * - Print-ready formatting
 */
export default function ExecutiveReportPanel({
  scenarioName,
  metrics,
  riskScore,
  kpis,
  onClose,
}: Props) {
  const [activeSection, setActiveSection] = useState<string>("summary");
  const [isExporting, setIsExporting] = useState(false);

  const report = useMemo(() => {
    return generateExecutiveReport({ scenarioName, metrics, riskScore, kpis });
  }, [scenarioName, metrics, riskScore, kpis]);

  const riskLevelColor = useMemo(() => {
    const colors: Record<string, string> = {
      low: "#10B981",
      moderate: "#22D3EE",
      elevated: "#F59E0B",
      high: "#EF4444",
      critical: "#DC2626",
    };
    return colors[report.riskAssessment.level] || "#22D3EE";
  }, [report.riskAssessment.level]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const markdown = formatReportAsMarkdown(report);
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scenarioName.replace(/\s+/g, "-")}-report-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="executive-report-panel">
      {/* Header */}
      <div className="report-header">
        <div className="report-header__left">
          <h2 className="report-title">Executive Report</h2>
          <span className="report-scenario">{scenarioName}</span>
        </div>
        <div className="report-header__right">
          <button
            className="report-btn report-btn--export"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export MD"}
          </button>
          {onClose && (
            <button className="report-btn report-btn--close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Risk Score Banner */}
      <div className="report-risk-banner" style={{ borderColor: riskLevelColor }}>
        <div className="risk-score">
          <span className="risk-score__value" style={{ color: riskLevelColor }}>
            {report.riskAssessment.score}
          </span>
          <span className="risk-score__label">/100</span>
        </div>
        <div className="risk-level">
          <span className="risk-level__badge" style={{ backgroundColor: riskLevelColor }}>
            {report.riskAssessment.level.toUpperCase()}
          </span>
          <span className="risk-level__label">Risk Level</span>
        </div>
        <div className="risk-factors">
          {report.riskAssessment.factors.slice(0, 3).map((f, i) => (
            <span key={i} className="risk-factor">{f}</span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="report-nav">
        {["summary", "findings", "sections", "recommendations"].map((tab) => (
          <button
            key={tab}
            className={`report-nav__tab ${activeSection === tab ? "active" : ""}`}
            onClick={() => setActiveSection(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="report-content">
        {activeSection === "summary" && (
          <div className="report-section">
            <h3>Executive Summary</h3>
            <p className="summary-text">{report.executiveSummary}</p>
            <div className="summary-timestamp">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </div>
          </div>
        )}

        {activeSection === "findings" && (
          <div className="report-section">
            <h3>Key Findings</h3>
            <ul className="findings-list">
              {report.keyFindings.map((finding, i) => (
                <li key={i} className="finding-item">{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {activeSection === "sections" && (
          <div className="report-section">
            {report.sections.map((section) => (
              <div key={section.id} className="section-block">
                <div className="section-header">
                  <h4>{section.title}</h4>
                  <span className={`priority-badge priority-${section.priority}`}>
                    {section.priority}
                  </span>
                </div>
                <p>{section.content}</p>
                {section.metrics && (
                  <div className="metrics-grid">
                    {section.metrics.map((m, i) => (
                      <div key={i} className="metric-card">
                        <span className="metric-label">{m.label}</span>
                        <span className="metric-value">
                          {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                          <span className="metric-unit">{m.unit}</span>
                        </span>
                        <span className={`metric-trend trend-${m.trend}`}>
                          {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}
                          {m.delta !== undefined && ` ${(m.delta * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === "recommendations" && (
          <div className="report-section">
            <h3>Recommendations</h3>
            <div className="recommendations-list">
              {report.recommendations.map((rec, i) => (
                <div key={rec.id} className="recommendation-card">
                  <div className="rec-header">
                    <span className="rec-number">{i + 1}</span>
                    <h4>{rec.title}</h4>
                  </div>
                  <p>{rec.description}</p>
                  <div className="rec-meta">
                    <span className={`rec-impact impact-${rec.impact}`}>
                      Impact: {rec.impact}
                    </span>
                    <span className={`rec-effort effort-${rec.effort}`}>
                      Effort: {rec.effort}
                    </span>
                    <span className="rec-timeframe">{rec.timeframe}</span>
                    <span className="rec-confidence">
                      {(rec.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
