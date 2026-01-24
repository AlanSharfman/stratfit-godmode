// src/components/simulate/SimulateHeader.tsx
// STRATFIT — Simulation Header

import React from 'react';
import { X, RefreshCw, Download, Zap } from 'lucide-react';

interface SimulateHeaderProps {
  onClose: () => void;
  onRerun: () => void;
  phase: 'idle' | 'running' | 'complete';
  iterations: number;
  executionTime?: number;
}

export default function SimulateHeader({ 
  onClose, 
  onRerun, 
  phase, 
  iterations,
  executionTime 
}: SimulateHeaderProps) {
  return (
    <header className="simulate-header">
      <div className="simulate-header-left">
        <div className="simulate-logo">
          <Zap className="simulate-logo-icon" size={24} />
          <div className="simulate-logo-text">
            <span className="simulate-title">MONTE CARLO SIMULATION</span>
            <span className="simulate-subtitle">
              {phase === 'complete' 
                ? `${iterations.toLocaleString()} scenarios analyzed in ${executionTime?.toFixed(0)}ms`
                : `Analyzing ${iterations.toLocaleString()} possible futures`
              }
            </span>
          </div>
        </div>
      </div>

      <div className="simulate-header-center">
        {phase === 'complete' && (
          <div className="simulate-header-badge">
            <span className="badge-dot" />
            <span className="badge-text">SIMULATION COMPLETE</span>
          </div>
        )}
      </div>

      <div className="simulate-header-right">
        {phase === 'complete' && (
          <>
            <button 
              className="simulate-action-btn"
              onClick={onRerun}
              title="Re-run Simulation"
            >
              <RefreshCw size={16} />
              <span>RE-RUN</span>
            </button>
            <button 
              className="simulate-action-btn"
              title="Export Results"
            >
              <Download size={16} />
              <span>EXPORT</span>
            </button>
          </>
        )}
        <button 
          className="simulate-close-btn"
          onClick={onClose}
          title="Close Simulation"
        >
          <X size={20} />
        </button>
      </div>
    </header>
  );
}

