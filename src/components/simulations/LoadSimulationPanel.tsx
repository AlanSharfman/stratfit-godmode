// src/components/simulations/LoadSimulationPanel.tsx
// STRATFIT — Load/Browse Saved Simulations Panel
// God Mode styled panel for browsing and loading saved simulations

import React, { useState, useMemo } from 'react';
import { useSavedSimulationsStore, type SavedSimulation } from '@/state/savedSimulationsStore';
import { useLeverStore } from '@/state/leverStore';
import './SimulationStyles.css';

interface LoadSimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad?: (simulation: SavedSimulation) => void;
  mode?: 'load' | 'compare'; // 'load' applies levers, 'compare' selects for comparison
}

type SortMode = 'date' | 'score' | 'name';

export default function LoadSimulationPanel({ isOpen, onClose, onLoad, mode = 'load' }: LoadSimulationPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Store access
  const simulations = useSavedSimulationsStore((s) => s.simulations);
  const deleteSimulation = useSavedSimulationsStore((s) => s.deleteSimulation);
  const setAsBaseline = useSavedSimulationsStore((s) => s.setAsBaseline);
  const renameSimulation = useSavedSimulationsStore((s) => s.renameSimulation);
  const comparisonA = useSavedSimulationsStore((s) => s.comparisonA);
  const comparisonB = useSavedSimulationsStore((s) => s.comparisonB);
  const setComparisonA = useSavedSimulationsStore((s) => s.setComparisonA);
  const setComparisonB = useSavedSimulationsStore((s) => s.setComparisonB);
  
  const setLevers = useLeverStore((s) => s.loadSnapshot);
  
  // Filter and sort simulations
  const filteredSimulations = useMemo(() => {
    let filtered = simulations;
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    switch (sortMode) {
      case 'date':
        return [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'score':
        return [...filtered].sort((a, b) => 
          b.summary.overallScore - a.summary.overallScore
        );
      case 'name':
        return [...filtered].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      default:
        return filtered;
    }
  }, [simulations, sortMode, searchQuery]);
  
  const handleLoad = (simulation: SavedSimulation) => {
    // Apply levers from saved simulation
    setLevers(simulation.levers);
    onLoad?.(simulation);
    onClose();
  };
  
  const handleSelectForComparison = (simulation: SavedSimulation, slot: 'A' | 'B') => {
    if (slot === 'A') {
      setComparisonA(simulation.id);
    } else {
      setComparisonB(simulation.id);
    }
  };
  
  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSimulation(id);
      setConfirmDelete(null);
      if (selectedId === id) {
        setSelectedId(null);
      }
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCEPTIONAL': return '#22d3ee';
      case 'STRONG': return '#34d399';
      case 'STABLE': return '#a3e635';
      case 'CAUTION': return '#fbbf24';
      case 'CRITICAL': return '#f87171';
      default: return '#94a3b8';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="simulation-panel-overlay" onClick={onClose}>
      <div 
        className="simulation-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title-row">
            <span className="panel-icon">📊</span>
            <h2 className="panel-title">
              {mode === 'compare' ? 'SELECT FOR COMPARISON' : 'SAVED SIMULATIONS'}
            </h2>
            <span className="simulation-count">{simulations.length} saved</span>
          </div>
          <button className="panel-close" onClick={onClose}>×</button>
        </div>
        
        {/* Controls */}
        <div className="panel-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search simulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="sort-controls">
            <span className="sort-label">Sort:</span>
            <button 
              className={`sort-btn ${sortMode === 'date' ? 'active' : ''}`}
              onClick={() => setSortMode('date')}
            >
              Recent
            </button>
            <button 
              className={`sort-btn ${sortMode === 'score' ? 'active' : ''}`}
              onClick={() => setSortMode('score')}
            >
              Score
            </button>
            <button 
              className={`sort-btn ${sortMode === 'name' ? 'active' : ''}`}
              onClick={() => setSortMode('name')}
            >
              Name
            </button>
          </div>
        </div>
        
        {/* Simulation list */}
        <div className="simulation-list">
          {filteredSimulations.length === 0 ? (
            <div className="empty-list">
              {simulations.length === 0 ? (
                <>
                  <span className="empty-icon">📁</span>
                  <p className="empty-text">No saved simulations yet</p>
                  <p className="empty-hint">Run a simulation and save it to see it here</p>
                </>
              ) : (
                <>
                  <span className="empty-icon">🔍</span>
                  <p className="empty-text">No matches found</p>
                  <p className="empty-hint">Try a different search term</p>
                </>
              )}
            </div>
          ) : (
            filteredSimulations.map((sim) => (
              <div 
                key={sim.id}
                className={`simulation-card ${selectedId === sim.id ? 'selected' : ''} ${sim.isBaseline ? 'baseline' : ''}`}
                onClick={() => setSelectedId(selectedId === sim.id ? null : sim.id)}
              >
                {/* Card header */}
                <div className="card-header">
                  <div className="card-title-row">
                    <h3 className="card-title">{sim.name}</h3>
                    {sim.isBaseline && (
                      <span className="baseline-badge">BASELINE</span>
                    )}
                  </div>
                  <span className="card-date">{formatDate(sim.createdAt)}</span>
                </div>
                
                {/* Card metrics */}
                <div className="card-metrics">
                  <div className="card-metric">
                    <span className="metric-label">Survival</span>
                    <span className="metric-value">{sim.summary.survivalPercent}</span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">ARR</span>
                    <span className="metric-value">
                      ${(sim.summary.arrMedian / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">Score</span>
                    <span className="metric-value score">{sim.summary.overallScore}</span>
                  </div>
                  <div className="card-metric">
                    <span className="metric-label">Rating</span>
                    <span 
                      className="metric-value rating"
                      style={{ color: getRatingColor(sim.summary.overallRating) }}
                    >
                      {sim.summary.overallRating}
                    </span>
                  </div>
                </div>
                
                {/* Description if exists */}
                {sim.description && (
                  <p className="card-description">{sim.description}</p>
                )}
                
                {/* Expanded actions */}
                {selectedId === sim.id && (
                  <div className="card-actions">
                    {mode === 'load' ? (
                      <>
                        <button 
                          className="action-btn primary"
                          onClick={(e) => { e.stopPropagation(); handleLoad(sim); }}
                        >
                          <span>📥</span> Load Levers
                        </button>
                        {!sim.isBaseline && (
                          <button 
                            className="action-btn"
                            onClick={(e) => { e.stopPropagation(); setAsBaseline(sim.id); }}
                          >
                            <span>⭐</span> Set Baseline
                          </button>
                        )}
                        <button 
                          className={`action-btn danger ${confirmDelete === sim.id ? 'confirm' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleDelete(sim.id); }}
                        >
                          <span>🗑️</span> {confirmDelete === sim.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className={`action-btn ${comparisonA === sim.id ? 'selected' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleSelectForComparison(sim, 'A'); }}
                        >
                          <span>◀</span> Scenario A
                        </button>
                        <button 
                          className={`action-btn ${comparisonB === sim.id ? 'selected' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleSelectForComparison(sim, 'B'); }}
                        >
                          <span>▶</span> Scenario B
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {/* Selection indicators for compare mode */}
                {mode === 'compare' && (
                  <div className="comparison-indicators">
                    {comparisonA === sim.id && (
                      <span className="comparison-badge a">A</span>
                    )}
                    {comparisonB === sim.id && (
                      <span className="comparison-badge b">B</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="panel-footer">
          {mode === 'compare' && (comparisonA || comparisonB) && (
            <div className="comparison-summary">
              <span className="comparison-label">Comparing:</span>
              <span className="comparison-names">
                {comparisonA ? filteredSimulations.find(s => s.id === comparisonA)?.name || '—' : '—'}
                <span className="vs">vs</span>
                {comparisonB ? filteredSimulations.find(s => s.id === comparisonB)?.name || '—' : '—'}
              </span>
            </div>
          )}
          <button className="panel-btn secondary" onClick={onClose}>
            {mode === 'compare' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

