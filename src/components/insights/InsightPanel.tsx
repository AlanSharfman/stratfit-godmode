import { useTrajectoryStore } from "@/state/trajectoryStore";
import type { TrajectoryInsight } from "@/types/trajectory";
import "./InsightPanel.css";

/**
 * InsightPanel displays detailed insight information in a fixed right-side panel.
 *
 * Features:
 * - Pinned right-side overlay panel
 * - Structured content: Title, What it means, Why it matters, Suggested action
 * - Confidence and Impact indicators
 * - Institutional styling: dark glass, cyan edge glow, subtle blur
 */
export default function InsightPanel() {
  const { selectedInsightId, insights, setSelectedInsightId } =
    useTrajectoryStore();

  // Find the selected insight
  const selectedInsight: TrajectoryInsight | undefined = insights.find(
    (i) => i.id === selectedInsightId
  );

  if (!selectedInsight) return null;

  const confidencePercent = Math.round(selectedInsight.confidence * 100);

  // Impact color mapping
  const impactColors: Record<string, string> = {
    high: "#22D3EE",
    medium: "#38BDF8",
    low: "#67E8F9",
  };
  const impactColor = impactColors[selectedInsight.impact] || "#22D3EE";

  return (
    <div className="insight-panel">
      {/* Close button */}
      <button
        className="insight-panel__close"
        onClick={() => setSelectedInsightId(null)}
        aria-label="Close panel"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Header */}
      <div className="insight-panel__header">
        <span
          className="insight-panel__impact-badge"
          style={{ backgroundColor: `${impactColor}20`, color: impactColor }}
        >
          {selectedInsight.impact} impact
        </span>
        <h2 className="insight-panel__title">{selectedInsight.title}</h2>
      </div>

      {/* Main content sections */}
      <div className="insight-panel__content">
        {/* What it means */}
        <section className="insight-panel__section">
          <h3 className="insight-panel__section-title">What it means</h3>
          <p className="insight-panel__section-text">{selectedInsight.message}</p>
        </section>

        {/* Why it matters */}
        <section className="insight-panel__section">
          <h3 className="insight-panel__section-title">Why it matters</h3>
          <p className="insight-panel__section-text">
            This insight has a <strong>{selectedInsight.impact}</strong> impact
            on your business trajectory. Understanding this signal helps you
            anticipate market dynamics and adjust strategy accordingly.
          </p>
        </section>

        {/* Suggested action */}
        <section className="insight-panel__section">
          <h3 className="insight-panel__section-title">Suggested action</h3>
          <p className="insight-panel__section-text">
            Review this insight in context of your current strategy. Consider
            how it aligns with your growth objectives and risk tolerance.
          </p>
        </section>
      </div>

      {/* Footer metrics */}
      <div className="insight-panel__footer">
        <div className="insight-panel__metric">
          <span className="insight-panel__metric-label">Confidence</span>
          <div className="insight-panel__confidence-bar">
            <div
              className="insight-panel__confidence-fill"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="insight-panel__metric-value">{confidencePercent}%</span>
        </div>

        <div className="insight-panel__metric">
          <span className="insight-panel__metric-label">Position</span>
          <span className="insight-panel__metric-value">
            {Math.round(selectedInsight.t * 100)}% along path
          </span>
        </div>
      </div>
    </div>
  );
}
