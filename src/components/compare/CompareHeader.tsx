// src/components/compare/CompareHeader.tsx
// STRATFIT — Compare Header with View Mode Toggle

import React from 'react';
import { useViewTogglesStore } from '../../state/viewTogglesStore';

interface CompareHeaderProps {
  scenarioAName?: string;
  scenarioBName?: string;
  divergence?: number;
  viewMode?: 'data' | 'terrain';
  onViewModeChange?: (mode: 'data' | 'terrain') => void;
}

export default function CompareHeader({
  scenarioAName,
  scenarioBName,
  divergence = 0,
  viewMode = 'terrain',
  onViewModeChange,
}: CompareHeaderProps) {
  const {
    timelineEnabled,
    heatmapEnabled,
    toggleTimeline,
    toggleHeatmap,
    isTimelineAvailable,
    isHeatmapAvailable,
  } = useViewTogglesStore();
  
  return (
    <header className="compare-header">
      <div className="header-left">
        <h1 className="header-title">
          <span className="title-icon">◇</span>
          COMPARE
        </h1>
        {scenarioAName && scenarioBName && (
          <div className="header-scenarios">
            <span className="scenario-name cyan">{scenarioAName}</span>
            <span className="vs-divider">vs</span>
            <span className="scenario-name amber">{scenarioBName}</span>
          </div>
        )}
      </div>
      
      <div className="header-right">
        {/* Timeline toggle */}
        <button
          className={`feature-toggle ${timelineEnabled ? 'active' : ''} ${!isTimelineAvailable() ? 'disabled' : ''}`}
          onClick={toggleTimeline}
          disabled={!isTimelineAvailable()}
          title={isTimelineAvailable() ? 'Toggle Timeline' : 'Timeline not available on this tab'}
        >
          <span className="toggle-icon">◔</span>
          <span className="toggle-label">TIMELINE</span>
        </button>
        
        {/* Heatmap toggle */}
        <button
          className={`feature-toggle ${heatmapEnabled ? 'active' : ''} ${!isHeatmapAvailable() ? 'disabled' : ''}`}
          onClick={toggleHeatmap}
          disabled={!isHeatmapAvailable()}
          title={isHeatmapAvailable() ? 'Toggle Heatmap' : 'Heatmap not available on this tab'}
        >
          <span className="toggle-icon">▦</span>
          <span className="toggle-label">HEATMAP</span>
        </button>
        
        {/* Divergence badge */}
        {divergence > 0 && (
          <div className="divergence-badge-header">
            <span className="badge-value">{divergence}%</span>
            <span className="badge-label">DIVERGENCE</span>
          </div>
        )}
      </div>
    </header>
  );
}
