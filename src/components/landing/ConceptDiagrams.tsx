// src/components/landing/ConceptDiagrams.tsx
// STRATFIT — Concept Diagrams Section
// Before/After Workflow, Probability Cone, Sensitivity Matrix, Living Model Architecture

import React from 'react';
import './ConceptDiagrams.css';

export default function ConceptDiagrams() {
  return (
    <section className="concept-diagrams-section">
      <div className="concepts-content">
        {/* Header */}
        <div className="concepts-header">
          <h2 className="concepts-title">
            <span className="title-icon">🔬</span>
            The Intelligence Behind STRATFIT
          </h2>
          <p className="concepts-subtitle">
            From manual modeling to automated intelligence. Here's how it works.
          </p>
        </div>

        {/* Diagrams Grid */}
        <div className="concepts-grid">
          {/* 1. Before & After Workflow */}
          <BeforeAfterWorkflow />

          {/* 2. Probability Cone */}
          <ProbabilityCone />

          {/* 3. Sensitivity Matrix */}
          <SensitivityMatrix />

          {/* 4. Living Model Architecture */}
          <LivingModelArchitecture />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEFORE & AFTER WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

function BeforeAfterWorkflow() {
  return (
    <div className="concept-card before-after">
      <h3 className="card-title">Before & After Workflow</h3>
      
      <div className="workflow-comparison">
        {/* Before - 2 Week Cycle */}
        <div className="workflow-side before">
          <div className="workflow-header">
            <span className="workflow-label">The 2-Week Cycle</span>
          </div>
          <div className="workflow-content">
            <div className="excel-stack">
              <div className="excel-icon">📊</div>
              <div className="excel-icon offset">📊</div>
              <div className="excel-icon offset-2">📊</div>
            </div>
            <div className="workflow-arrows">
              <span className="red-x">✗</span>
              <span className="red-x">✗</span>
            </div>
            <div className="clock-icon">⏱️</div>
          </div>
          <div className="workflow-footer">
            <span className="footer-text">Manual Modeling, Endless Revisions</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="comparison-arrow">
          <span>→</span>
        </div>

        {/* After - 15 Minute Cycle */}
        <div className="workflow-side after">
          <div className="workflow-header">
            <span className="workflow-label cyan">The 15-Minute Cycle</span>
          </div>
          <div className="workflow-content">
            <div className="workflow-steps">
              <div className="step-bubble">Run Test</div>
              <span className="step-arrow">→</span>
              <div className="mountain-mini">🏔️</div>
              <span className="step-arrow">→</span>
              <div className="check-circle">✓</div>
            </div>
          </div>
          <div className="workflow-footer">
            <span className="footer-text cyan">Automated, Visual, Instant Clarity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROBABILITY CONE
// ═══════════════════════════════════════════════════════════════════════════

function ProbabilityCone() {
  return (
    <div className="concept-card probability-cone">
      <h3 className="card-title">Probability Cone</h3>
      
      <div className="cone-visualization">
        <svg viewBox="0 0 300 150" className="cone-svg">
          {/* Cone of Uncertainty */}
          <defs>
            <linearGradient id="coneGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Cone shape */}
          <path
            d="M20,75 Q150,20 280,10 Q150,40 280,140 Q150,130 20,75"
            fill="url(#coneGradient)"
            className="cone-shape"
          />
          
          {/* Optimized path line */}
          <path
            d="M20,75 C100,65 200,55 280,40"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="optimal-path"
          />
          
          {/* Labels */}
          <text x="10" y="78" className="cone-label">Today</text>
          <text x="240" y="25" className="cone-label highlight">The Optimized Path</text>
          <text x="240" y="130" className="cone-label muted">Cone of Uncertainty</text>
          <text x="130" y="15" className="cone-label small">10,000 simulations</text>
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SENSITIVITY MATRIX (Kill Zone)
// ═══════════════════════════════════════════════════════════════════════════

function SensitivityMatrix() {
  const matrix = [
    ['danger', 'danger', 'warning', 'safe', 'safe'],
    ['danger', 'warning', 'warning', 'safe', 'safe'],
    ['danger', 'warning', 'current', 'safe', 'safe'],
    ['danger', 'danger', 'warning', 'warning', 'safe'],
    ['danger', 'danger', 'danger', 'warning', 'warning'],
  ];

  return (
    <div className="concept-card sensitivity-matrix">
      <h3 className="card-title">Sensitivity Matrix Close-Up</h3>
      
      <div className="matrix-visualization">
        {/* Y-axis label */}
        <div className="axis-label y-axis">
          <span>Burn Rate</span>
          <span className="axis-arrow">↑</span>
        </div>
        
        {/* Matrix Grid */}
        <div className="matrix-grid">
          {matrix.map((row, rowIndex) => (
            <div key={rowIndex} className="matrix-row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className={`matrix-cell ${cell}`}
                >
                  {cell === 'current' && <div className="current-dot" />}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* X-axis label */}
        <div className="axis-label x-axis">
          <span className="axis-arrow">→</span>
          <span>Market Growth</span>
        </div>
        
        {/* Legend */}
        <div className="matrix-legend">
          <div className="legend-item">
            <div className="legend-color danger" />
            <span>Danger</span>
          </div>
          <div className="legend-item">
            <div className="legend-color warning" />
            <span>Warning</span>
          </div>
          <div className="legend-item">
            <div className="legend-color safe" />
            <span>Safe</span>
          </div>
          <div className="legend-item">
            <div className="legend-color current" />
            <span>Current Position</span>
          </div>
        </div>
        
        {/* Breaking Point Annotation */}
        <div className="breaking-point-annotation">
          <span className="annotation-line" />
          <span className="annotation-text">
            Breaking Point:<br />
            Cash &lt; 0 in Month 9
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVING MODEL ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════

function LivingModelArchitecture() {
  const integrations = [
    { icon: '💳', name: 'Xero', position: 'top-left' },
    { icon: '💰', name: 'Stripe', position: 'left' },
    { icon: '📊', name: 'QuickBooks', position: 'bottom-left' },
  ];

  const outputs = [
    { icon: '💬', name: 'Slack', position: 'top-right' },
    { icon: '🔔', name: 'Alerts', position: 'right' },
    { icon: '✉️', name: 'Email', position: 'bottom-right' },
  ];

  return (
    <div className="concept-card living-model">
      <h3 className="card-title">Living Model Architecture</h3>
      
      <div className="architecture-visualization">
        {/* Input Side */}
        <div className="arch-side inputs">
          {integrations.map((int, index) => (
            <div key={index} className={`integration-node ${int.position}`}>
              <span className="node-icon">{int.icon}</span>
              <span className="node-name">{int.name}</span>
            </div>
          ))}
        </div>

        {/* Center Core */}
        <div className="arch-center">
          <div className="input-arrows">
            <span className="arrow">→</span>
            <span className="arrow">→</span>
            <span className="arrow">→</span>
          </div>
          
          <div className="core-box">
            <div className="core-logo">🏔️</div>
            <span className="core-name">STRATFIT Core</span>
          </div>
          
          <div className="output-arrows">
            <span className="arrow">→</span>
            <span className="arrow">→</span>
            <span className="arrow">→</span>
          </div>
        </div>

        {/* Output Side */}
        <div className="arch-side outputs">
          {outputs.map((out, index) => (
            <div key={index} className={`integration-node ${out.position}`}>
              <span className="node-icon">{out.icon}</span>
              <span className="node-name">{out.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="living-model-footer">
        <span className="footer-badge">Continuous Monitoring</span>
        <span className="footer-text">Real-time data feeds, instant deviation alerts.</span>
      </div>
    </div>
  );
}

export { BeforeAfterWorkflow, ProbabilityCone, SensitivityMatrix, LivingModelArchitecture };
