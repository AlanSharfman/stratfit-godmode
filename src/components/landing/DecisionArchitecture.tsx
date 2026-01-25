// src/components/landing/DecisionArchitecture.tsx
// STRATFIT — Decision Engine Architecture Visualization
// Shows how the AI processes data to deliver verdicts

import React, { useState, useEffect } from 'react';
import './DecisionArchitecture.css';

interface DataFlow {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface EngineLayer {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface OutputCard {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const DATA_INPUTS: DataFlow[] = [
  { id: 'revenue', label: 'Revenue Assumptions', icon: '📈', color: '#10b981' },
  { id: 'costs', label: 'Cost Structure', icon: '💰', color: '#f59e0b' },
  { id: 'runway', label: 'Cash & Runway', icon: '⏳', color: '#22d3ee' },
  { id: 'market', label: 'Market Variables', icon: '🌐', color: '#a855f7' },
  { id: 'risk', label: 'Risk Parameters', icon: '⚠️', color: '#ef4444' },
];

const ENGINE_LAYERS: EngineLayer[] = [
  { id: 'monte-carlo', name: 'Monte Carlo Engine', description: '10,000 simulations', icon: '🎲' },
  { id: 'scenario', name: 'Scenario Analysis', description: '3 futures modeled', icon: '🔀' },
  { id: 'sensitivity', name: 'Sensitivity Matrix', description: 'Variable interactions', icon: '📊' },
  { id: 'ai-verdict', name: 'AI Verdict Engine', description: 'Pattern recognition', icon: '🧠' },
];

const OUTPUTS: OutputCard[] = [
  { id: 'survival', title: 'Survival Probability', icon: '🎯', description: '12-month runway confidence', color: '#22d3ee' },
  { id: 'path', title: 'Recommended Path', icon: '🧭', description: 'Growth / Stability / Survival', color: '#a855f7' },
  { id: 'risks', title: 'Critical Risks', icon: '⚡', description: 'Ranked by impact', color: '#ef4444' },
  { id: 'valuation', title: 'Valuation Range', icon: '💎', description: 'Monte Carlo bounds', color: '#10b981' },
  { id: 'actions', title: 'Action Items', icon: '✅', description: 'Prioritized next steps', color: '#f59e0b' },
];

interface DecisionArchitectureProps {
  animate?: boolean;
}

export default function DecisionArchitecture({ animate = true }: DecisionArchitectureProps) {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [dataFlowing, setDataFlowing] = useState(false);
  
  // Auto-animate data flow
  useEffect(() => {
    if (!animate) return;
    
    const interval = setInterval(() => {
      setDataFlowing(true);
      setTimeout(() => setDataFlowing(false), 2000);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [animate]);
  
  return (
    <section className="decision-architecture-section">
      <div className="architecture-bg">
        <div className="bg-grid" />
        <div className="bg-glow left" />
        <div className="bg-glow right" />
      </div>
      
      <div className="architecture-container">
        {/* Header */}
        <div className="architecture-header">
          <span className="header-badge">
            <span className="badge-icon">🔮</span>
            Under The Hood
          </span>
          <h2 className="header-title">
            The <span>Decision Engine</span>
          </h2>
          <p className="header-subtitle">
            Your inputs flow through our multi-layer analysis system to produce 
            actionable intelligence in seconds, not weeks.
          </p>
        </div>
        
        {/* Architecture Diagram */}
        <div className={`architecture-diagram ${dataFlowing ? 'flowing' : ''}`}>
          
          {/* Input Column */}
          <div className="diagram-column inputs-column">
            <div className="column-label">
              <span className="label-icon">📥</span>
              Your Data
            </div>
            <div className="inputs-list">
              {DATA_INPUTS.map((input, index) => (
                <div 
                  key={input.id}
                  className="input-card"
                  style={{ 
                    '--input-color': input.color,
                    '--input-delay': `${index * 0.1}s`
                  } as React.CSSProperties}
                >
                  <span className="input-icon">{input.icon}</span>
                  <span className="input-label">{input.label}</span>
                  <span className="input-flow-dot" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Flow Arrow */}
          <div className="flow-connector input-flow">
            <div className="connector-line" />
            <div className="connector-particles">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="particle" style={{ '--particle-delay': `${i * 0.2}s` } as React.CSSProperties} />
              ))}
            </div>
            <span className="connector-arrow">→</span>
          </div>
          
          {/* Engine Core */}
          <div className="diagram-column engine-column">
            <div className="column-label">
              <span className="label-icon">⚡</span>
              STRATFIT Engine
            </div>
            <div className="engine-core">
              <div className="core-glow" />
              <div className="core-rings">
                <div className="ring ring-1" />
                <div className="ring ring-2" />
                <div className="ring ring-3" />
              </div>
              <div className="engine-layers">
                {ENGINE_LAYERS.map((layer, index) => (
                  <div 
                    key={layer.id}
                    className={`engine-layer ${activeLayer === layer.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveLayer(layer.id)}
                    onMouseLeave={() => setActiveLayer(null)}
                    style={{ '--layer-index': index } as React.CSSProperties}
                  >
                    <div className="layer-icon">{layer.icon}</div>
                    <div className="layer-info">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-desc">{layer.description}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="core-badge">
                <span className="badge-text">10,000</span>
                <span className="badge-label">Simulations</span>
              </div>
            </div>
          </div>
          
          {/* Flow Arrow */}
          <div className="flow-connector output-flow">
            <span className="connector-arrow">→</span>
            <div className="connector-particles">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="particle" style={{ '--particle-delay': `${i * 0.2}s` } as React.CSSProperties} />
              ))}
            </div>
            <div className="connector-line" />
          </div>
          
          {/* Output Column */}
          <div className="diagram-column outputs-column">
            <div className="column-label">
              <span className="label-icon">📤</span>
              Your Intelligence
            </div>
            <div className="outputs-grid">
              {OUTPUTS.map((output, index) => (
                <div 
                  key={output.id}
                  className="output-card"
                  style={{ 
                    '--output-color': output.color,
                    '--output-delay': `${index * 0.1}s`
                  } as React.CSSProperties}
                >
                  <div className="output-header">
                    <span className="output-icon">{output.icon}</span>
                    <span className="output-title">{output.title}</span>
                  </div>
                  <span className="output-desc">{output.description}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
        
        {/* Bottom Stats */}
        <div className="architecture-stats">
          <div className="stat-item">
            <span className="stat-value">15</span>
            <span className="stat-label">Seconds to verdict</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">10K</span>
            <span className="stat-label">Monte Carlo runs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">3</span>
            <span className="stat-label">Strategic paths</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">∞</span>
            <span className="stat-label">What-if scenarios</span>
          </div>
        </div>
        
        {/* CTA */}
        <div className="architecture-cta">
          <button className="cta-button primary">
            <span>See Your Decision Engine in Action</span>
            <span className="cta-arrow">→</span>
          </button>
        </div>
        
      </div>
    </section>
  );
}

export { DATA_INPUTS, ENGINE_LAYERS, OUTPUTS };
export type { DataFlow, EngineLayer, OutputCard };
