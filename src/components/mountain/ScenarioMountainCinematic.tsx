// src/components/mountain/ScenarioMountainCinematic.tsx
// STRATFIT — Cinematic Scenario Mountain Visualization
// FIXED VERSION - SVG mountain that actually renders!

import React, { useMemo, useState } from 'react';
import { useSimulationStore } from '@/state/simulationStore';
import { useSavedSimulationsStore } from '@/state/savedSimulationsStore';
import './ScenarioMountainCinematic.css';

interface ScenarioMountainCinematicProps {
  showRiskPanel?: boolean;
  showVariancePanel?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

export default function ScenarioMountainCinematic({
  showRiskPanel = true,
  showVariancePanel = true,
  onSave,
  onShare,
}: ScenarioMountainCinematicProps) {
  const [activeMode, setActiveMode] = useState<'scenario' | 'compare' | 'risk'>('scenario');
  const [riskPanelOpen, setRiskPanelOpen] = useState(false);
  const [variancePanelOpen, setVariancePanelOpen] = useState(false);
  
  // Get simulation data
  const summary = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  
  // Get baseline for comparison
  const savedBaseline = useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
  
  // Calculate path positions based on metrics
  const currentPathData = useMemo(() => {
    if (!summary) {
      return { score: 65, survival: 0.85, arr: 2500000, runway: 18 };
    }
    return {
      score: summary.overallScore,
      survival: summary.survivalRate,
      arr: summary.arrMedian,
      runway: summary.runwayMedian,
    };
  }, [summary]);
  
  const baselinePathData = useMemo(() => {
    if (!savedBaseline) {
      return null;
    }
    return {
      score: savedBaseline.summary.overallScore,
      survival: savedBaseline.summary.survivalRate,
      arr: savedBaseline.summary.arrMedian,
      runway: savedBaseline.summary.runwayMedian,
    };
  }, [savedBaseline]);
  
  // Generate flowing path based on score
  const generateFlowingPath = (score: number, side: 'left' | 'right' | 'center') => {
    const normalizedScore = score / 100;
    
    // Peak position
    const peakX = 500;
    const peakY = 120;
    
    // Path flows from peak down the mountain
    let path = '';
    
    if (side === 'left') {
      const endX = 80 + (1 - normalizedScore) * 60;
      const endY = 480;
      path = `M ${peakX} ${peakY + 20} 
              C ${peakX - 80} ${peakY + 100}, 
                ${peakX - 180} ${peakY + 200}, 
                ${peakX - 250} ${300}
              S ${endX + 100} ${400}, 
                ${endX} ${endY}`;
    } else if (side === 'right') {
      const endX = 920 - (1 - normalizedScore) * 60;
      const endY = 480;
      path = `M ${peakX} ${peakY + 20} 
              C ${peakX + 80} ${peakY + 100}, 
                ${peakX + 180} ${peakY + 200}, 
                ${peakX + 250} ${300}
              S ${endX - 100} ${400}, 
                ${endX} ${endY}`;
    } else {
      const endX = 500 + (normalizedScore - 0.5) * 100;
      const endY = 480;
      path = `M ${peakX} ${peakY + 20} 
              C ${peakX + 20} ${peakY + 150}, 
                ${peakX - 20} ${300}, 
                ${endX} ${endY}`;
    }
    
    return path;
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };
  
  // Risk score color and label
  const getRiskColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };
  
  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Med';
    if (score >= 40) return 'High';
    return 'Critical';
  };

  const currentScore = summary?.overallScore || 68;
  const baselineScore = savedBaseline?.summary.overallScore || null;

  return (
    <div className="cinematic-container">
      {/* INNER HEADER */}
      <div className="cinematic-inner-header">
        <div className="inner-brand">
          <span className="brand-bolt">⚡</span>
          <span className="brand-text">STRATFIT</span>
        </div>
        
        <div className="inner-actions">
          <div className="mode-pill">
            <span>Mode:</span>
            <select 
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as any)}
            >
              <option value="scenario">Scenario</option>
              <option value="compare">Compare</option>
              <option value="risk">Risk</option>
            </select>
          </div>
          <button className="action-btn" onClick={onSave}>
            💾 Save
          </button>
          <button className="action-btn" onClick={onShare}>
            ↗ Share
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h2 className="cinematic-title">Scenario Mountain</h2>

      {/* KPI GLASS BAR */}
      <div className="kpi-bar">
        <div className="kpi-cell">
          <span className="kpi-label">Cash:</span>
          <span className="kpi-value">{formatCurrency(summary?.cashMedian || 4500000)}</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-label">Burn:</span>
          <span className="kpi-value">{formatCurrency(320000)}/mo</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-label">Runway:</span>
          <span className="kpi-value">{Math.round(summary?.runwayMedian || 18)} Mo</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-label">ARR:</span>
          <span className="kpi-value">{formatCurrency(summary?.arrMedian || 2100000)}</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-label">Risk Score:</span>
          <span className="kpi-value" style={{ color: getRiskColor(currentScore) }}>
            {currentScore} ({getRiskLabel(currentScore)})
          </span>
        </div>
      </div>

      {/* MOUNTAIN SVG */}
      <div className="mountain-stage">
        <svg 
          viewBox="0 0 1000 550" 
          preserveAspectRatio="xMidYMid slice"
          className="mountain-svg"
        >
          <defs>
            {/* Sky gradient */}
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="40%" stopColor="#132844" />
              <stop offset="70%" stopColor="#1e4068" />
              <stop offset="100%" stopColor="#2d5a8a" />
            </linearGradient>
            
            {/* Far mountain gradient */}
            <linearGradient id="farMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a3050" />
              <stop offset="100%" stopColor="#0f1c30" />
            </linearGradient>
            
            {/* Main mountain gradient */}
            <linearGradient id="mainMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a4a6a" />
              <stop offset="30%" stopColor="#1e3a5a" />
              <stop offset="70%" stopColor="#152840" />
              <stop offset="100%" stopColor="#0d1a28" />
            </linearGradient>
            
            {/* Near ridge gradient */}
            <linearGradient id="nearRidgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#152535" />
              <stop offset="100%" stopColor="#080c12" />
            </linearGradient>
            
            {/* Cyan glow */}
            <filter id="cyanGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Orange glow */}
            <filter id="orangeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Cyan path gradient */}
            <linearGradient id="cyanPathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" stopOpacity="1"/>
              <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#0088aa" stopOpacity="0.5"/>
            </linearGradient>
            
            {/* Orange path gradient */}
            <linearGradient id="orangePathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffcc00" stopOpacity="1"/>
              <stop offset="50%" stopColor="#ff9900" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#cc6600" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
          
          {/* BACKGROUND SKY */}
          <rect x="0" y="0" width="1000" height="550" fill="url(#skyGrad)" />
          
          {/* Stars */}
          <circle cx="120" cy="45" r="1" fill="white" opacity="0.6"/>
          <circle cx="250" cy="80" r="1.2" fill="white" opacity="0.4"/>
          <circle cx="380" cy="30" r="0.8" fill="white" opacity="0.7"/>
          <circle cx="520" cy="65" r="1" fill="white" opacity="0.5"/>
          <circle cx="650" cy="40" r="1.3" fill="white" opacity="0.4"/>
          <circle cx="780" cy="75" r="0.9" fill="white" opacity="0.6"/>
          <circle cx="880" cy="25" r="1.1" fill="white" opacity="0.5"/>
          <circle cx="180" cy="100" r="0.7" fill="white" opacity="0.3"/>
          <circle cx="720" cy="95" r="1" fill="white" opacity="0.4"/>
          
          {/* FAR MOUNTAINS */}
          <path
            d="M 0 550 
               L 0 350 
               L 80 320 
               L 150 280 
               L 220 300 
               L 300 250 
               L 380 270 
               L 450 220 
               L 500 200 
               L 550 220 
               L 620 270 
               L 700 250 
               L 780 300 
               L 850 280 
               L 920 320 
               L 1000 350 
               L 1000 550 Z"
            fill="url(#farMountainGrad)"
            opacity="0.5"
          />
          
          {/* MAIN MOUNTAIN */}
          <path
            d="M 0 550 
               L 0 420 
               L 100 380 
               L 180 340 
               L 250 300 
               L 320 260 
               L 380 200 
               L 430 150 
               L 470 110 
               L 500 80 
               L 530 110 
               L 570 150 
               L 620 200 
               L 680 260 
               L 750 300 
               L 820 340 
               L 900 380 
               L 1000 420 
               L 1000 550 Z"
            fill="url(#mainMountainGrad)"
          />
          
          {/* Mountain texture lines */}
          <g opacity="0.15" stroke="#4a6a8a" strokeWidth="1">
            <path d="M 500 80 L 320 300" />
            <path d="M 500 80 L 680 300" />
            <path d="M 500 80 L 250 380" />
            <path d="M 500 80 L 750 380" />
            <path d="M 430 150 L 200 400" />
            <path d="M 570 150 L 800 400" />
            <path d="M 380 200 L 150 450" />
            <path d="M 620 200 L 850 450" />
          </g>
          
          {/* Snow cap on peak */}
          <path
            d="M 470 110 
               L 500 80 
               L 530 110 
               L 515 115 
               L 500 105 
               L 485 115 Z"
            fill="rgba(255,255,255,0.3)"
          />
          
          {/* NEAR RIDGES */}
          <path
            d="M 0 550 
               L 0 480 
               L 120 450 
               L 250 470 
               L 350 440 
               L 450 460 
               L 550 440 
               L 650 470 
               L 750 450 
               L 880 480 
               L 1000 460 
               L 1000 550 Z"
            fill="url(#nearRidgeGrad)"
          />
          
          {/* GRID OVERLAY */}
          <g opacity="0.2" stroke="#5588aa" strokeWidth="0.5">
            <path d="M 130 150 Q 500 130 870 150" fill="none" strokeDasharray="4,8"/>
            <path d="M 160 200 Q 500 180 840 200" fill="none" strokeDasharray="4,8"/>
            <path d="M 190 250 Q 500 230 810 250" fill="none" strokeDasharray="4,8"/>
            <path d="M 220 300 Q 500 280 780 300" fill="none" strokeDasharray="4,8"/>
            <path d="M 250 350 Q 500 330 750 350" fill="none" strokeDasharray="4,8"/>
            <path d="M 280 400 Q 500 380 720 400" fill="none" strokeDasharray="4,8"/>
          </g>
          
          {/* Grid labels */}
          <g fill="rgba(100,150,200,0.4)" fontSize="10" fontFamily="monospace">
            <text x="60" y="160">0.80</text>
            <text x="60" y="220">0.60</text>
            <text x="60" y="280">0.40</text>
            <text x="60" y="340">0.20</text>
            <text x="60" y="400">0.10</text>
            <text x="920" y="160">0.80</text>
            <text x="920" y="220">0.60</text>
            <text x="920" y="280">0.40</text>
            <text x="920" y="340">0.20</text>
            <text x="920" y="400">0.10</text>
          </g>
          
          {/* PEAK MARKER */}
          <g>
            <circle cx="500" cy="80" r="6" fill="white" opacity="0.9"/>
            <circle cx="500" cy="80" r="12" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
            <text x="500" y="60" fill="rgba(255,255,255,0.8)" fontSize="11" textAnchor="middle" fontWeight="600">
              OPTIMAL
            </text>
          </g>
          
          {/* BASELINE PATH (Cyan) - only if baseline exists */}
          {baselinePathData && (
            <g className="path-group path-baseline">
              <path
                d={generateFlowingPath(baselineScore || 70, 'left')}
                fill="none"
                stroke="#00d4ff"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.3"
                filter="url(#cyanGlow)"
              />
              <path
                d={generateFlowingPath(baselineScore || 70, 'left')}
                fill="none"
                stroke="url(#cyanPathGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
                className="path-animated"
              />
              <circle r="4" fill="#00ffff" filter="url(#cyanGlow)">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  path={generateFlowingPath(baselineScore || 70, 'left')}
                />
              </circle>
              <circle r="3" fill="#00ffff" filter="url(#cyanGlow)">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  begin="1.5s"
                  path={generateFlowingPath(baselineScore || 70, 'left')}
                />
              </circle>
              <circle r="2" fill="#88ffff" filter="url(#cyanGlow)">
                <animateMotion
                  dur="5s"
                  repeatCount="indefinite"
                  begin="3s"
                  path={generateFlowingPath(baselineScore || 70, 'left')}
                />
              </circle>
              <text x="100" y="500" fill="#00d4ff" fontSize="12" fontWeight="600">
                ● Baseline
              </text>
            </g>
          )}
          
          {/* CURRENT PATH (Orange) */}
          <g className="path-group path-current">
            <path
              d={generateFlowingPath(currentScore, baselinePathData ? 'right' : 'center')}
              fill="none"
              stroke="#ff9900"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
              filter="url(#orangeGlow)"
            />
            <path
              d={generateFlowingPath(currentScore, baselinePathData ? 'right' : 'center')}
              fill="none"
              stroke="url(#orangePathGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#orangeGlow)"
              className="path-animated"
            />
            <circle r="4" fill="#ffcc00" filter="url(#orangeGlow)">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                path={generateFlowingPath(currentScore, baselinePathData ? 'right' : 'center')}
              />
            </circle>
            <circle r="3" fill="#ffcc00" filter="url(#orangeGlow)">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                begin="2s"
                path={generateFlowingPath(currentScore, baselinePathData ? 'right' : 'center')}
              />
            </circle>
            <circle r="2" fill="#ffee88" filter="url(#orangeGlow)">
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                begin="3.5s"
                path={generateFlowingPath(currentScore, baselinePathData ? 'right' : 'center')}
              />
            </circle>
            <text 
              x={baselinePathData ? 900 : 500} 
              y="500" 
              fill="#ffaa00" 
              fontSize="12" 
              fontWeight="600"
              textAnchor={baselinePathData ? "end" : "middle"}
            >
              ● Current
            </text>
          </g>
          
          {/* ATMOSPHERIC FOG */}
          <rect 
            x="0" y="400" width="1000" height="150" 
            fill="url(#skyGrad)" 
            opacity="0.3"
          />
        </svg>
        
        {/* Carousel dots */}
        <div className="carousel-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
        </div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="bottom-panels">
        {showRiskPanel && (
          <div className={`panel ${riskPanelOpen ? 'open' : ''}`}>
            <button className="panel-toggle" onClick={() => setRiskPanelOpen(!riskPanelOpen)}>
              <span>Risk Breakdowns</span>
              <span className="chevron">{riskPanelOpen ? '▼' : '▶'}</span>
            </button>
            {riskPanelOpen && (
              <div className="panel-body">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Cash</th>
                      <th>Burn</th>
                      <th>ARR</th>
                      <th>Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Current</td>
                      <td>{formatCurrency(summary?.cashMedian || 4500000)}</td>
                      <td>$320K</td>
                      <td>{formatCurrency(summary?.arrMedian || 2100000)}</td>
                      <td style={{ color: getRiskColor(currentScore) }}>{currentScore} ({getRiskLabel(currentScore)})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {showVariancePanel && (
          <div className={`panel ${variancePanelOpen ? 'open' : ''}`}>
            <button className="panel-toggle" onClick={() => setVariancePanelOpen(!variancePanelOpen)}>
              <span>Variance Analysis</span>
              <span className="chevron">{variancePanelOpen ? '▼' : '▶'}</span>
            </button>
            {variancePanelOpen && (
              <div className="panel-body">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Scenario</th>
                      <th>Variance</th>
                      <th>Reset %</th>
                      <th>Runway</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Expand vs Variance A rate</td>
                      <td>8.57%</td>
                      <td>42.35</td>
                      <td className="negative">-0.8%</td>
                      <td>8 Mo / 13 Mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
