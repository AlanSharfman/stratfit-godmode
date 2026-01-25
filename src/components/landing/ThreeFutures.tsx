// src/components/landing/ThreeFutures.tsx
// STRATFIT — "Your 3 Possible Futures" Section
// The core strategic framework: Growth, Stability, Survival

import React, { useState } from 'react';
import './ThreeFutures.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Future {
  id: 'growth' | 'stability' | 'survival';
  icon: string;
  title: string;
  tagline: string;
  description: string;
  characteristics: string[];
  risk: 'High' | 'Medium' | 'Lower';
  reward: 'High' | 'Moderate' | 'Lower';
  color: string;
  gradient: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUTURES DATA
// ═══════════════════════════════════════════════════════════════════════════

export const FUTURES: Future[] = [
  {
    id: 'growth',
    icon: '🚀',
    title: 'GROWTH',
    tagline: 'Burn fast. Win big.',
    description: 'Aggressive expansion to capture market share before competitors. Accept higher burn in exchange for velocity.',
    characteristics: [
      'Aggressive hiring to build team capacity',
      'High marketing spend to capture market',
      'Prioritize growth over profitability',
      'Raise while strong to fuel expansion',
    ],
    risk: 'High',
    reward: 'High',
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)',
  },
  {
    id: 'stability',
    icon: '⚖️',
    title: 'STABILITY',
    tagline: 'Balanced growth. Controlled risk.',
    description: 'Sustainable expansion with disciplined spending. Build runway while maintaining growth momentum.',
    characteristics: [
      'Selective hiring for critical roles only',
      'Measured marketing with clear ROI',
      'Balance growth with unit economics',
      'Extend runway before big bets',
    ],
    risk: 'Medium',
    reward: 'Moderate',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  },
  {
    id: 'survival',
    icon: '🛡️',
    title: 'SURVIVAL',
    tagline: 'Preserve runway. Live to fight.',
    description: 'Conservative mode to extend runway and reach profitability. Cut costs, focus on core, survive the storm.',
    characteristics: [
      'Pause non-essential hiring',
      'Cut costs 20-30%',
      'Focus on path to profitability',
      'Explore bridge financing options',
    ],
    risk: 'Lower',
    reward: 'Lower',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ThreeFutures() {
  const [expandedFuture, setExpandedFuture] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedFuture(expandedFuture === id ? null : id);
  };

  return (
    <section className="three-futures-section">
      {/* Background */}
      <div className="futures-bg">
        <div className="bg-gradient" />
        <div className="bg-lines" />
      </div>

      {/* Content */}
      <div className="futures-content">
        {/* Header */}
        <div className="futures-header">
          <div className="header-badge">
            <span className="badge-icon">🔮</span>
            <span className="badge-text">STRATEGIC FRAMEWORK</span>
          </div>
          <h2 className="futures-title">Your 3 Possible Futures</h2>
          <p className="futures-subtitle">
            Every business faces the same fundamental choice. 
            STRATFIT shows you which path YOUR numbers support.
          </p>
        </div>

        {/* Futures Grid */}
        <div className="futures-grid">
          {FUTURES.map((future) => (
            <FutureCard
              key={future.id}
              future={future}
              isExpanded={expandedFuture === future.id}
              onToggle={() => toggleExpand(future.id)}
            />
          ))}
        </div>

        {/* Footer Message */}
        <div className="futures-footer">
          <p className="footer-question">Which path is right for you?</p>
          <p className="footer-answer">
            Enter your numbers. Run the simulation. <span className="highlight">Get your answer.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FUTURE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FutureCardProps {
  future: Future;
  isExpanded: boolean;
  onToggle: () => void;
}

function FutureCard({ future, isExpanded, onToggle }: FutureCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return '#ef4444';
      case 'Medium': return '#fbbf24';
      case 'Lower': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div
      className={`future-card ${isExpanded ? 'expanded' : ''}`}
      style={{
        '--future-color': future.color,
        '--future-gradient': future.gradient,
      } as React.CSSProperties}
    >
      {/* Card Background */}
      <div className="card-bg">
        <div className="bg-glow" />
        <div className="bg-pattern" />
      </div>

      {/* Card Content */}
      <div className="card-main" onClick={onToggle}>
        {/* Icon */}
        <div className="card-icon">
          <span className="icon-emoji">{future.icon}</span>
          <div className="icon-ring" />
        </div>

        {/* Title & Tagline */}
        <h3 className="card-title">{future.title}</h3>
        <p className="card-tagline">{future.tagline}</p>

        {/* Risk/Reward Badges */}
        <div className="risk-reward-badges">
          <div className="badge risk-badge" style={{ '--badge-color': getRiskColor(future.risk) } as React.CSSProperties}>
            <span className="badge-label">RISK</span>
            <span className="badge-value">{future.risk}</span>
          </div>
          <div className="badge reward-badge" style={{ '--badge-color': getRiskColor(future.reward) } as React.CSSProperties}>
            <span className="badge-label">REWARD</span>
            <span className="badge-value">{future.reward}</span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="expand-indicator">
          <span className="expand-text">{isExpanded ? 'Less' : 'More'}</span>
          <span className={`expand-arrow ${isExpanded ? 'up' : 'down'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      <div className={`card-details ${isExpanded ? 'visible' : ''}`}>
        <p className="details-description">{future.description}</p>
        
        <div className="details-characteristics">
          <h4 className="characteristics-title">Key Characteristics:</h4>
          <ul className="characteristics-list">
            {future.characteristics.map((char, index) => (
              <li key={index} className="characteristic-item">
                <span className="char-bullet">→</span>
                <span className="char-text">{char}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Border */}
      <div className="card-border" />
    </div>
  );
}

export { FutureCard };
