// src/components/layout/UnifiedHeader.tsx
// STRATFIT GOD MODE — Unified Header with All Navigation
// Moves: ACTIVE SITUATION + TERRAIN/COMPARE/TRADE OFFS + TIMELINE/HEATMAP + SIMULATE

import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, Rocket, TrendingDown, TrendingUp, Globe,
  Layers, SplitSquareHorizontal, Zap,
  Calendar, Grid3X3,
  HelpCircle,
  AlertTriangle,
  Save,
  FolderOpen
} from 'lucide-react';
import type { ScenarioType } from '@/components/blocks/ActiveScenario';
import { ExportReportButton, ShareButton } from '@/components/common';

// ===========================================
// VIEW MODES (moved from ViewModeSelector)
// ===========================================
export type ViewMode = "initialize" | "terrain" | "impact" | "compare" | "simulate" | "risk" | "valuation" | "assessment";

// ===========================================
// SCENARIOS (moved from ActiveScenario)
// ===========================================
interface Scenario {
  id: ScenarioType;
  label: string;
  icon: typeof Activity;
  color: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'current-trajectory', label: 'Baseline Trajectory', icon: Activity, color: '#00D9FF' },
  { id: 'series-b-stress-test', label: 'Series B Raise', icon: Rocket, color: '#00D9FF' },
  { id: 'profitability-push', label: 'Profitability Push', icon: TrendingDown, color: '#FF9500' },
  { id: 'apac-expansion', label: 'Geographic Expansion', icon: Globe, color: '#00FF88' }
];

// ===========================================
// NAV TABS
// ===========================================
const NAV_TABS: Array<{ id: ViewMode; label: string; icon: typeof Layers }> = [
  { id: "initialize", label: "SYSTEM CALIBRATION", icon: Layers },
  { id: "terrain", label: "BASELINE", icon: Layers },
  { id: "simulate", label: "STRATEGY STUDIO", icon: Zap },
  { id: "compare", label: "COMPARE", icon: SplitSquareHorizontal },
  { id: "risk", label: "RISK", icon: AlertTriangle },
  { id: "valuation", label: "VALUATION", icon: TrendingUp },
  { id: "assessment", label: "STRATEGIC ASSESSMENT", icon: Layers },
];

// ===========================================
// PROPS
// ===========================================
interface UnifiedHeaderProps {
  // Scenario
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  // View Mode
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  // Toggles
  timelineEnabled: boolean;
  heatmapEnabled: boolean;
  onTimelineToggle: () => void;
  onHeatmapToggle: () => void;
  // Actions
  onSave?: () => void;
  onLoad?: () => void;
  onHelp?: () => void;
}

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function UnifiedHeader({
  currentScenario,
  onScenarioChange,
  activeView,
  onViewChange,
  timelineEnabled,
  heatmapEnabled,
  onTimelineToggle,
  onSave,
  onLoad,
  onHeatmapToggle,
  onHelp,
}: UnifiedHeaderProps) {
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentScenarioData = SCENARIOS.find(s => s.id === currentScenario) || SCENARIOS[0];
  const CurrentIcon = currentScenarioData.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setScenarioDropdownOpen(false);
      }
    };
    if (scenarioDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [scenarioDropdownOpen]);

  return (
    <>
      <style>{`
        .unified-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          height: 56px;
          background: linear-gradient(180deg, rgba(8, 12, 18, 0.98), rgba(4, 8, 14, 0.95));
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          gap: 12px;
        }

        /* LOGO SECTION */
        .uh-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .uh-logo-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #fff;
        }
        .uh-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
        .uh-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.6);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* SCENARIO DROPDOWN */
        .uh-scenario-container {
          position: relative;
          flex-shrink: 0;
        }
        .uh-scenario-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          background: rgba(34, 211, 238, 0.08);
          border: 1px solid rgba(34, 211, 238, 0.25);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .uh-scenario-btn:hover {
          background: rgba(34, 211, 238, 0.12);
          border-color: rgba(34, 211, 238, 0.4);
        }
        .uh-scenario-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(34, 211, 238, 0.6);
        }
        .uh-scenario-value {
          font-size: 12px;
          font-weight: 600;
          color: #22d3ee;
        }
        .uh-scenario-chevron {
          font-size: 8px;
          color: rgba(34, 211, 238, 0.5);
        }
        .uh-scenario-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 240px;
          background: rgba(12, 16, 22, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 6px;
          z-index: 1000;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .uh-scenario-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.12s ease;
          text-align: left;
        }
        .uh-scenario-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .uh-scenario-option.active {
          background: rgba(34, 211, 238, 0.1);
        }
        .uh-scenario-option-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
        }
        .uh-scenario-option-check {
          margin-left: auto;
          color: #22d3ee;
        }

        /* MAIN NAV — CLEAN INSTITUTIONAL UNDERLINE STYLE */
        .uh-nav {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
          background: transparent;
          border: none;
        }
        .uh-nav-tab {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          height: 56px;
          flex-shrink: 0;
          white-space: nowrap;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.15s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .uh-nav-tab:hover {
          color: rgba(255, 255, 255, 0.8);
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .uh-nav-tab.active {
          color: #22d3ee;
          font-weight: 600;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .uh-nav-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 10px;
          right: 10px;
          height: 2px;
          background: #22d3ee;
          border-radius: 1px;
        }
        /* No special simulate styling — uniform look */
        .uh-nav-tab.simulate {
          color: rgba(255, 255, 255, 0.5);
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .uh-nav-tab.simulate:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        .uh-nav-tab.simulate.active {
          color: #22d3ee;
          font-weight: 600;
        }
        .uh-nav-tab.simulate .uh-nav-icon {
          filter: none;
        }
        .uh-nav-icon {
          display: none; /* Hide icons for clean text-only nav */
        }
        .uh-nav-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.08);
          margin: 0 2px;
          flex-shrink: 0;
        }

        /* TERRAIN TOGGLES */
        .uh-toggles {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .uh-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .uh-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
        }
        .uh-toggle.active {
          background: rgba(34, 211, 238, 0.1);
          border-color: rgba(34, 211, 238, 0.3);
          color: #22d3ee;
        }
        .uh-toggle-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .uh-toggle.active .uh-toggle-dot {
          opacity: 1;
          box-shadow: 0 0 6px currentColor;
        }

        /* HEADER ACTIONS — Ghost institutional */
        .uh-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
        }
        .uh-action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .uh-action-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.7);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .uh-action-btn svg {
          color: rgba(255, 255, 255, 0.35);
          width: 14px;
          height: 14px;
        }
        .uh-action-btn:hover svg {
          color: rgba(255, 255, 255, 0.6);
        }
        .uh-action-divider {
          display: none; /* Remove dividers between ghost buttons */
        }
        .uh-help-btn {
          display: none; /* Removed from institutional nav */
        }
      `}</style>

      <header className="unified-header">
        {/* LOGO */}
        <div className="uh-logo">
          <img src="/logo.svg" alt="STRATFIT Logo" width="36" height="36" style={{ display: 'block' }} />
          <span className="uh-logo-text">STRATFIT</span>
          <div className="uh-status">
            <span>System Status</span>
            <span>·</span>
            <span>Live</span>
            <span className="uh-status-dot" />
          </div>
        </div>

        {/* ACTIVE SITUATION DROPDOWN */}
        <div className="uh-scenario-container" ref={dropdownRef}>
          <button 
            className="uh-scenario-btn"
            onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
          >
            <CurrentIcon size={16} style={{ color: currentScenarioData.color }} />
            <div>
              <div className="uh-scenario-label">ACTIVE SITUATION</div>
              <div className="uh-scenario-value">{currentScenarioData.label}</div>
            </div>
            <span className="uh-scenario-chevron">{scenarioDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {scenarioDropdownOpen && (
            <div className="uh-scenario-dropdown">
              {SCENARIOS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    className={`uh-scenario-option ${s.id === currentScenario ? 'active' : ''}`}
                    onClick={() => {
                      onScenarioChange(s.id);
                      setScenarioDropdownOpen(false);
                    }}
                  >
                    <Icon size={18} style={{ color: s.color }} />
                    <span className="uh-scenario-option-label">{s.label}</span>
                    {s.id === currentScenario && <span className="uh-scenario-option-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MAIN NAVIGATION — Clean institutional text nav */}
        <nav className="uh-nav">
          {NAV_TABS.map((tab, i) => (
            <React.Fragment key={tab.id}>
              <button
                className={`uh-nav-tab ${activeView === tab.id ? 'active' : ''}`}
                onClick={() => onViewChange(tab.id as ViewMode)}
              >
                <span>{tab.label}</span>
              </button>
              {i < NAV_TABS.length - 1 && <div className="uh-nav-divider" />}
            </React.Fragment>
          ))}
        </nav>

        {/* TERRAIN TOGGLES (only show when terrain is active) */}
        {activeView === 'terrain' && (
          <div className="uh-toggles">
            <button 
              className={`uh-toggle ${timelineEnabled ? 'active' : ''}`}
              onClick={onTimelineToggle}
            >
              <Calendar size={12} />
              <span>TIMELINE</span>
              <span className="uh-toggle-dot" />
            </button>
            <button 
              className={`uh-toggle ${heatmapEnabled ? 'active' : ''}`}
              onClick={onHeatmapToggle}
            >
              <Grid3X3 size={12} />
              <span>HEATMAP</span>
              <span className="uh-toggle-dot" />
            </button>
          </div>
        )}

        {/* HEADER ACTIONS */}
        <div className="uh-actions">
          <button className="uh-action-btn" onClick={onSave} title="Save Simulation">
            <Save size={16} />
            <span>SAVE</span>
          </button>
          <div className="uh-action-divider" />
          <button className="uh-action-btn" onClick={onLoad} title="Load Simulation">
            <FolderOpen size={16} />
            <span>LOAD</span>
          </button>
          <div className="uh-action-divider" />
          <ExportReportButton variant="full" />
          <div className="uh-action-divider" />
          <ShareButton variant="full" />
          <div className="uh-action-divider" />
          <button className="uh-help-btn" onClick={onHelp}>
            <HelpCircle size={18} />
          </button>
        </div>
      </header>
    </>
  );
}
