// src/components/KPISimulationRange.tsx
// STRATFIT — KPI Simulation Range Indicator
// Shows Monte Carlo range (P10-P50-P90) under each KPI metric

import React from 'react';
import { useSimulationStore, useHasSimulated } from '@/state/simulationStore';

interface KPISimulationRangeProps {
  metricType: 'arr' | 'cash' | 'runway' | 'burn';
  className?: string;
}

export default function KPISimulationRange({ metricType, className = '' }: KPISimulationRangeProps) {
  const hasSimulated = useHasSimulated();
  const result = useSimulationStore((s) => s.fullResult);

  if (!hasSimulated || !result) {
    return null;
  }

  // Get percentile values based on metric type
  const getValues = () => {
    switch (metricType) {
      case 'arr':
        return {
          p10: result.arrPercentiles.p10,
          p50: result.arrPercentiles.p50,
          p90: result.arrPercentiles.p90,
          format: formatCurrency,
          label: 'Simulated ARR Range (36mo)',
        };
      case 'cash':
        return {
          p10: result.cashPercentiles.p10,
          p50: result.cashPercentiles.p50,
          p90: result.cashPercentiles.p90,
          format: formatCurrency,
          label: 'Simulated Cash Range',
        };
      case 'runway':
        return {
          p10: result.runwayPercentiles.p10,
          p50: result.runwayPercentiles.p50,
          p90: result.runwayPercentiles.p90,
          format: formatMonths,
          label: 'Simulated Runway Range',
        };
      case 'burn':
        // Burn rate doesn't have direct percentiles, use cash flow
        return {
          p10: result.cashPercentiles.p10 / 36, // Approximate monthly
          p50: result.cashPercentiles.p50 / 36,
          p90: result.cashPercentiles.p90 / 36,
          format: formatCurrency,
          label: 'Simulated Burn Impact',
        };
      default:
        return null;
    }
  };

  const values = getValues();
  if (!values) return null;

  // Calculate bar positions (0-100%)
  const min = values.p10 * 0.8; // Add some padding
  const max = values.p90 * 1.2;
  const range = max - min;
  
  const p10Pos = ((values.p10 - min) / range) * 100;
  const p50Pos = ((values.p50 - min) / range) * 100;
  const p90Pos = ((values.p90 - min) / range) * 100;
  const fillWidth = p90Pos - p10Pos;

  return (
    <div className={`kpi-simulation-range ${className}`}>
      <div className="range-header">
        <span className="range-badge">SIM</span>
        <span className="range-label">{values.label}</span>
      </div>
      
      <div className="range-bar">
        <div 
          className="range-fill"
          style={{ 
            left: `${p10Pos}%`, 
            width: `${fillWidth}%` 
          }}
        />
        <div 
          className="range-median"
          style={{ left: `${p50Pos}%` }}
        />
      </div>
      
      <div className="range-values">
        <span className="range-p10">P10: {values.format(values.p10)}</span>
        <span className="range-p50">P50: {values.format(values.p50)}</span>
        <span className="range-p90">P90: {values.format(values.p90)}</span>
      </div>
    </div>
  );
}

// Format helpers
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  if (value < 0) return `-$${Math.abs(value).toFixed(0)}`;
  return `$${value.toFixed(0)}`;
}

function formatMonths(value: number): string {
  return `${Math.round(value)} mo`;
}

// Compact version for smaller KPI cards
export function KPISimulationRangeCompact({ metricType }: { metricType: 'arr' | 'cash' | 'runway' }) {
  const hasSimulated = useHasSimulated();
  const summary = useSimulationStore((s) => s.summary);

  if (!hasSimulated || !summary) {
    return null;
  }

  const getRangeText = () => {
    switch (metricType) {
      case 'arr':
        return `${summary.arrFormatted.p10} — ${summary.arrFormatted.p90}`;
      case 'cash':
        return `${formatCurrency(summary.cashP10)} — ${formatCurrency(summary.cashP90)}`;
      case 'runway':
        return `${Math.round(summary.runwayP10)} — ${Math.round(summary.runwayP90)} mo`;
      default:
        return '';
    }
  };

  return (
    <div className="kpi-range-compact">
      <span className="range-badge-mini">SIM</span>
      <span className="range-text-compact">{getRangeText()}</span>
    </div>
  );
}

