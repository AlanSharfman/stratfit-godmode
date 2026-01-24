// src/components/risk/CriticalAlerts.tsx
// STRATFIT — Critical Alert Banners

import React, { useState } from 'react';

interface CriticalAlertsProps {
  warnings: string[];
}

export default function CriticalAlerts({ warnings }: CriticalAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  
  const visibleWarnings = warnings.filter((_, i) => !dismissed.has(i));
  
  if (visibleWarnings.length === 0) return null;
  
  const dismissWarning = (index: number) => {
    setDismissed(prev => new Set([...prev, index]));
  };
  
  const getSeverity = (warning: string): 'critical' | 'warning' | 'alert' => {
    if (warning.includes('CRITICAL') || warning.includes('DANGER')) return 'critical';
    if (warning.includes('WARNING')) return 'warning';
    return 'alert';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'warning': return '#f97316';
      default: return '#fbbf24';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '⚡';
    }
  };
  
  return (
    <div className="critical-alerts">
      {warnings.map((warning, index) => {
        if (dismissed.has(index)) return null;
        
        const severity = getSeverity(warning);
        const color = getSeverityColor(severity);
        const icon = getSeverityIcon(severity);
        
        return (
          <div
            key={index}
            className={`alert-banner ${severity}`}
            style={{
              '--alert-color': color,
              borderLeftColor: color,
            } as React.CSSProperties}
          >
            <span className="alert-icon">{icon}</span>
            <span className="alert-message">{warning}</span>
            <button
              className="alert-dismiss"
              onClick={() => dismissWarning(index)}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
