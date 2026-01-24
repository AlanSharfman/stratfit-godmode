// src/components/simulate/SimulateNarrative.tsx
// STRATFIT — Simulation Narrative & Recommendations

import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight, Lightbulb, Target } from 'lucide-react';
import type { Verdict, Recommendation } from '@/logic/verdictGenerator';

interface SimulateNarrativeProps {
  verdict: Verdict;
}

export default function SimulateNarrative({ verdict }: SimulateNarrativeProps) {
  const getPriorityIcon = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertTriangle size={14} />;
      case 'HIGH':
        return <Target size={14} />;
      default:
        return <Lightbulb size={14} />;
    }
  };

  return (
    <div className="simulate-narrative">
      {/* Primary Risk */}
      <div className="narrative-section risk-section">
        <h4 className="narrative-title">
          <AlertTriangle size={16} />
          PRIMARY RISK
        </h4>
        <p className="narrative-text">{verdict.primaryRisk}</p>
      </div>

      {/* Mitigation */}
      <div className="narrative-section mitigation-section">
        <h4 className="narrative-title">
          <CheckCircle size={16} />
          RECOMMENDED MITIGATION
        </h4>
        <p className="narrative-text">{verdict.riskMitigation}</p>
      </div>

      {/* Top Drivers */}
      <div className="narrative-section drivers-section">
        <h4 className="narrative-title">
          <Target size={16} />
          KEY OUTCOME DRIVERS
        </h4>
        <ul className="drivers-list">
          {verdict.topDrivers.map((driver, i) => (
            <li key={i} className="driver-item">
              <ArrowRight size={12} />
              <span>{driver}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="narrative-section recommendations-section">
        <h4 className="narrative-title">
          <Lightbulb size={16} />
          ACTION ITEMS
        </h4>
        <div className="recommendations-list">
          {verdict.recommendations.map((rec, i) => (
            <div 
              key={i} 
              className={`recommendation-card ${rec.priority.toLowerCase()}`}
            >
              <div className="rec-header">
                <span className="rec-priority">
                  {getPriorityIcon(rec.priority)}
                  {rec.priority}
                </span>
                <span className="rec-category">{rec.category}</span>
              </div>
              <p className="rec-action">{rec.action}</p>
              <p className="rec-rationale">{rec.rationale}</p>
              <p className="rec-impact">
                <strong>Impact:</strong> {rec.impact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Lever */}
      <div className="narrative-section critical-section">
        <div className="critical-lever">
          <span className="critical-label">CRITICAL LEVER</span>
          <span className="critical-value">{verdict.criticalLever}</span>
        </div>
      </div>
    </div>
  );
}

