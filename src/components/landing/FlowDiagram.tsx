// src/components/landing/FlowDiagram.tsx
// STRATFIT — Flow Diagram Component
// 7-screen user journey: TERRAIN → SIMULATE → COMPARE → RISK → VALUATION → DECISION → EXPORT
// Inspired by Gemini flow diagram style

import React, { useState } from 'react';
import './FlowDiagram.css';

// ═══════════════════════════════════════════════════════════════════════════
// FLOW STEPS DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface FlowStep {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

export const FLOW_STEPS: FlowStep[] = [
  {
    id: 'terrain',
    number: 1,
    title: 'TERRAIN',
    subtitle: 'Primary Workspace',
    description: 'Enter your business assumptions. Adjust 12 strategic levers.',
    icon: '🏔️',
    color: '#22d3ee',
    features: ['Revenue inputs', 'Cost structure', 'Growth assumptions', 'Risk parameters'],
  },
  {
    id: 'simulate',
    number: 2,
    title: 'SIMULATE',
    subtitle: 'God Mode Activated',
    description: 'Run 10,000 Monte Carlo simulations. See the full probability distribution.',
    icon: '⚡',
    color: '#a855f7',
    features: ['10,000 scenarios', 'Survival probability', 'Confidence intervals', 'Kill-switch detection'],
  },
  {
    id: 'compare',
    number: 3,
    title: 'COMPARE',
    subtitle: 'Divine Comparison',
    description: 'Compare scenarios side-by-side. See what changes when you adjust strategy.',
    icon: '📊',
    color: '#fbbf24',
    features: ['Scenario overlay', 'Delta analysis', 'Timeline comparison', 'Heatmap view'],
  },
  {
    id: 'risk',
    number: 4,
    title: 'RISK',
    subtitle: 'Threat Intelligence',
    description: 'DEFCON-style risk assessment across 6 critical dimensions.',
    icon: '🛡️',
    color: '#ef4444',
    features: ['Radar chart', 'Risk timeline', 'Threat ranking', 'Mitigation actions'],
  },
  {
    id: 'valuation',
    number: 5,
    title: 'VALUATION',
    subtitle: 'Value Estimation',
    description: 'Probability-weighted valuation range. See best, expected, and worst cases.',
    icon: '💎',
    color: '#10b981',
    features: ['Multiple methods', 'Dilution calculator', 'Market comparables', 'Exit scenarios'],
  },
  {
    id: 'decision',
    number: 6,
    title: 'DECISION',
    subtitle: 'AI-Powered Verdict',
    description: 'Get your strategic path: Growth, Stability, or Survival. With action items.',
    icon: '🎯',
    color: '#06b6d4',
    features: ['Path recommendation', 'Confidence score', 'Top 3 actions', 'Why not other paths'],
  },
  {
    id: 'export',
    number: 7,
    title: 'EXPORT',
    subtitle: 'Share & Document',
    description: 'Generate PDF reports. Share scenarios with stakeholders.',
    icon: '📤',
    color: '#8b5cf6',
    features: ['PDF generation', 'Link sharing', 'Board-ready reports', 'Scenario snapshots'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function FlowDiagram() {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  return (
    <div className="flow-diagram">
      {/* Main Flow Row */}
      <div className="flow-row main-row">
        {FLOW_STEPS.slice(0, 4).map((step, index) => (
          <React.Fragment key={step.id}>
            <FlowStepCard
              step={step}
              isActive={activeStep === step.id}
              isHovered={hoveredStep === step.id}
              onHover={() => setHoveredStep(step.id)}
              onLeave={() => setHoveredStep(null)}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            />
            {index < 3 && (
              <div className="flow-connector horizontal">
                <div className="connector-line" />
                <div className="connector-arrow">→</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Vertical Connector */}
      <div className="flow-row vertical-connector">
        <div className="connector-bend right">
          <div className="bend-line horizontal" />
          <div className="bend-line vertical" />
        </div>
      </div>

      {/* Secondary Flow Row (reversed) */}
      <div className="flow-row secondary-row">
        {FLOW_STEPS.slice(4).reverse().map((step, index, arr) => (
          <React.Fragment key={step.id}>
            <FlowStepCard
              step={step}
              isActive={activeStep === step.id}
              isHovered={hoveredStep === step.id}
              onHover={() => setHoveredStep(step.id)}
              onLeave={() => setHoveredStep(null)}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            />
            {index < arr.length - 1 && (
              <div className="flow-connector horizontal reverse">
                <div className="connector-arrow">←</div>
                <div className="connector-line" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Detail Tooltip */}
      {hoveredStep && (
        <StepTooltip step={FLOW_STEPS.find(s => s.id === hoveredStep)!} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOW STEP CARD
// ═══════════════════════════════════════════════════════════════════════════

interface FlowStepCardProps {
  step: FlowStep;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function FlowStepCard({ step, isActive, isHovered, onHover, onLeave, onClick }: FlowStepCardProps) {
  return (
    <div
      className={`flow-step-card ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{ '--step-color': step.color } as React.CSSProperties}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Background */}
      <div className="step-bg">
        <div className="bg-gradient" />
      </div>

      {/* Content */}
      <div className="step-content">
        {/* Step Number */}
        <div className="step-number">{step.number}</div>

        {/* Icon */}
        <div className="step-icon">{step.icon}</div>

        {/* Title */}
        <div className="step-title">{step.title}</div>

        {/* Subtitle */}
        <div className="step-subtitle">{step.subtitle}</div>

        {/* Mini Preview */}
        <div className="step-preview">
          <div className="preview-mountain">
            <svg viewBox="0 0 80 40" className="mini-mountain">
              <path
                d="M0,40 L15,25 L25,30 L40,10 L55,20 L65,15 L80,40 Z"
                fill={`${step.color}30`}
                stroke={step.color}
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Border Effect */}
      <div className="step-border" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════

interface StepTooltipProps {
  step: FlowStep;
}

function StepTooltip({ step }: StepTooltipProps) {
  return (
    <div
      className="step-tooltip"
      style={{ '--step-color': step.color } as React.CSSProperties}
    >
      <div className="tooltip-header">
        <span className="tooltip-icon">{step.icon}</span>
        <span className="tooltip-title">{step.title}</span>
      </div>
      <p className="tooltip-description">{step.description}</p>
      <ul className="tooltip-features">
        {step.features.map((feature, index) => (
          <li key={index}>
            <span className="feature-dot">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { FlowStepCard };
