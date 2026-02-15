import { useMemo } from "react";
import { useInterventionStore } from "@/state/interventionStore";
import type { InterventionSuggestion, InterventionCategory } from "@/types/simulation";
import "./AIInterventionPanel.css";

type Props = {
  onClose?: () => void;
};

const CATEGORY_CONFIG: Record<InterventionCategory, { label: string; icon: string; color: string }> = {
  cost: { label: "Cost", icon: "💰", color: "#EF4444" },
  revenue: { label: "Revenue", icon: "📈", color: "#10B981" },
  product: { label: "Product", icon: "🛠️", color: "#8B5CF6" },
  team: { label: "Team", icon: "👥", color: "#3B82F6" },
  strategy: { label: "Strategy", icon: "🎯", color: "#F59E0B" },
  operations: { label: "Operations", icon: "⚙️", color: "#6366F1" },
};

/**
 * AIInterventionPanel displays AI-generated strategic intervention suggestions.
 * 
 * Features:
 * - Real-time suggestion generation status
 * - Category filtering
 * - Priority & Impact sorting
 * - Actionable intervention cards
 * - Accept/dismiss workflow
 */
export default function AIInterventionPanel({ onClose }: Props) {
  const {
    suggestions,
    isGenerating,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    dismissSuggestion,
    applySuggestion,
  } = useInterventionStore();

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];

    // Category filter
    if (filters.category) {
      result = result.filter((s) => s.category === filters.category);
    }

    // Impact filter
    if (filters.minImpact) {
      result = result.filter((s) => {
        const impactOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return impactOrder[s.impact] >= impactOrder[filters.minImpact!];
      });
    }

    // Dismissed filter
    if (!filters.showDismissed) {
      result = result.filter((s) => s.status !== "dismissed");
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "confidence") {
        return b.confidence - a.confidence;
      }
      if (sortBy === "impact") {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return order[b.impact] - order[a.impact];
      }
      // Default: by urgency (priority)
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return result;
  }, [suggestions, filters, sortBy]);

  return (
    <div className="ai-intervention-panel">
      {/* Header */}
      <div className="intervention-header">
        <div className="intervention-header__left">
          <div className="ai-badge">
            <span className="ai-pulse" />
            AI
          </div>
          <h2>Strategic Interventions</h2>
        </div>
        <div className="intervention-header__right">
          {isGenerating && (
            <span className="generating-label">
              <span className="generating-spinner" />
              Analyzing...
            </span>
          )}
          {onClose && (
            <button className="intervention-close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="intervention-filters">
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: (e.target.value as InterventionCategory) || undefined,
              })
            }
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.icon} {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Min Impact</label>
          <select
            value={filters.minImpact || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                minImpact: (e.target.value as typeof filters.minImpact) || undefined,
              })
            }
          >
            <option value="">Any</option>
            <option value="medium">Medium+</option>
            <option value="high">High+</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="priority">Priority</option>
            <option value="confidence">Confidence</option>
            <option value="impact">Impact</option>
          </select>
        </div>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.showDismissed || false}
            onChange={(e) => setFilters({ ...filters, showDismissed: e.target.checked })}
          />
          Show Dismissed
        </label>
      </div>

      {/* Suggestion Count */}
      <div className="suggestion-count">
        {filteredSuggestions.length} intervention{filteredSuggestions.length !== 1 ? "s" : ""}{" "}
        {filteredSuggestions.length !== suggestions.length && `(of ${suggestions.length})`}
      </div>

      {/* Suggestions List */}
      <div className="suggestions-list">
        {filteredSuggestions.length === 0 ? (
          <div className="empty-state">
            {isGenerating ? (
              <>
                <span className="generating-spinner large" />
                <p>AI is analyzing your scenario...</p>
              </>
            ) : (
              <>
                <span className="empty-icon">🎯</span>
                <p>No interventions match your filters</p>
              </>
            )}
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <InterventionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={() => applySuggestion(suggestion.id)}
              onDismiss={() => dismissSuggestion(suggestion.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           INTERVENTION CARD                                */
/* -------------------------------------------------------------------------- */

type CardProps = {
  suggestion: InterventionSuggestion;
  onApply: () => void;
  onDismiss: () => void;
};

function InterventionCard({ suggestion, onApply, onDismiss }: CardProps) {
  const categoryConfig = CATEGORY_CONFIG[suggestion.category];
  const isDismissed = suggestion.status === "dismissed";
  const isApplied = suggestion.status === "applied";

  return (
    <div className={`intervention-card ${isDismissed ? "dismissed" : ""} ${isApplied ? "applied" : ""}`}>
      {/* Priority Indicator */}
      <div className={`priority-indicator priority-${suggestion.priority}`} />

      {/* Header */}
      <div className="card-header">
        <span
          className="category-badge"
          style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
        >
          {categoryConfig.icon} {categoryConfig.label}
        </span>
        <span className="confidence-badge">{(suggestion.confidence * 100).toFixed(0)}% conf</span>
      </div>

      {/* Title */}
      <h3 className="card-title">{suggestion.title}</h3>

      {/* Description */}
      <p className="card-description">{suggestion.description}</p>

      {/* Rationale */}
      <div className="card-rationale">
        <span className="rationale-label">Rationale</span>
        <p>{suggestion.rationale}</p>
      </div>

      {/* Metrics */}
      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">Impact</span>
          <span className={`metric-value impact-${suggestion.impact}`}>{suggestion.impact}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Effort</span>
          <span className={`metric-value effort-${suggestion.effort}`}>{suggestion.effort}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Timeframe</span>
          <span className="metric-value">{suggestion.timeframe}</span>
        </div>
      </div>

      {/* Expected Outcomes */}
      {suggestion.expectedOutcomes && suggestion.expectedOutcomes.length > 0 && (
        <div className="card-outcomes">
          <span className="outcomes-label">Expected Outcomes</span>
          <ul>
            {suggestion.expectedOutcomes.map((outcome, i) => (
              <li key={i}>{outcome}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!isApplied && !isDismissed && (
        <div className="card-actions">
          <button className="action-btn action-apply" onClick={onApply}>
            Apply Intervention
          </button>
          <button className="action-btn action-dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      )}

      {/* Status badges */}
      {isApplied && <div className="status-applied">✓ Applied</div>}
      {isDismissed && <div className="status-dismissed">Dismissed</div>}
    </div>
  );
}
