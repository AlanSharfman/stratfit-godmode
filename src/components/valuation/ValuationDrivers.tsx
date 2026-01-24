// src/components/valuation/ValuationDrivers.tsx
// STRATFIT — Valuation Drivers Panel

import React from 'react';
import type { ValuationDriver } from '../../state/valuationStore';

interface ValuationDriversProps {
  drivers: ValuationDriver[];
}

const CATEGORY_ICONS: Record<string, string> = {
  growth: '📈',
  efficiency: '⚙️',
  market: '🌍',
  team: '👥',
};

const CATEGORY_COLORS: Record<string, string> = {
  growth: '#22d3ee',
  efficiency: '#fbbf24',
  market: '#10b981',
  team: '#a78bfa',
};

const getTrendIcon = (trend: 'up' | 'flat' | 'down') => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};

const getTrendColor = (trend: 'up' | 'flat' | 'down') => {
  switch (trend) {
    case 'up': return '#10b981';
    case 'down': return '#f87171';
    default: return '#fbbf24';
  }
};

export default function ValuationDrivers({ drivers }: ValuationDriversProps) {
  const totalWeight = drivers.reduce((sum, d) => sum + d.weight, 0);
  
  return (
    <div className="valuation-drivers">
      <div className="drivers-header">
        <span className="drivers-icon">◈</span>
        <span className="drivers-title">VALUATION DRIVERS</span>
        <span className="drivers-subtitle">What's moving your multiple</span>
      </div>
      
      <div className="drivers-list">
        {drivers.map((driver) => (
          <div key={driver.id} className="driver-item">
            {/* Header row */}
            <div className="driver-header">
              <span className="driver-icon">{CATEGORY_ICONS[driver.category]}</span>
              <span className="driver-name">{driver.name}</span>
              <span 
                className="driver-trend"
                style={{ color: getTrendColor(driver.trend) }}
              >
                {getTrendIcon(driver.trend)}
              </span>
            </div>
            
            {/* Score bar */}
            <div className="driver-bar-container">
              <div className="driver-bar">
                <div 
                  className="driver-bar-fill"
                  style={{ 
                    width: `${driver.score}%`,
                    background: CATEGORY_COLORS[driver.category],
                  }}
                />
              </div>
              <span className="driver-score">{driver.score}</span>
            </div>
            
            {/* Weight indicator */}
            <div className="driver-meta">
              <span className="driver-weight">
                {Math.round((driver.weight / totalWeight) * 100)}% weight
              </span>
              <span className="driver-description">{driver.description}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Impact summary */}
      <div className="drivers-summary">
        <div className="summary-header">
          <span className="summary-title">DRIVER IMPACT</span>
        </div>
        <div className="summary-chart">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="summary-segment"
              style={{
                width: `${(driver.weight / totalWeight) * 100}%`,
                background: CATEGORY_COLORS[driver.category],
              }}
              title={`${driver.name}: ${Math.round((driver.weight / totalWeight) * 100)}%`}
            />
          ))}
        </div>
        <div className="summary-legend">
          {drivers.map((driver) => (
            <div key={driver.id} className="legend-item">
              <span 
                className="legend-dot"
                style={{ background: CATEGORY_COLORS[driver.category] }}
              />
              <span className="legend-label">{driver.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
