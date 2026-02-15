// src/components/common/ExportReportButton.tsx
// STRATFIT — Export Report Button (PDF Generation)

import React, { useState } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { useLeverStore } from '../../state/leverStore';
import { useScenarioStore } from '../../state/scenarioStore';
import { useRiskStore } from '../../state/riskStore';
import { useValuationStore } from '../../state/valuationStore';
import { emitCompute } from '@/engine/computeTelemetry';

import './ExportReportButton.css';

interface ExportReportButtonProps {
  variant?: 'icon' | 'full';
  onExported?: () => void;
}

// Format helpers
const formatCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

export default function ExportReportButton({
  variant = 'icon',
  onExported,
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Get all the data
  const simulation = useSimulationStore(s => s.summary);
  const hasSimulated = useSimulationStore(s => s.hasSimulated);
  const levers = useLeverStore(s => s.levers);
  const baseline = useScenarioStore(s => s.baseline);
  const riskSnapshot = useRiskStore(s => s.riskSnapshot);
  const valuationSnapshot = useValuationStore(s => s.snapshot);
  
  // Generate report HTML
  const generateReportHTML = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>STRATFIT Strategy Report - ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a1628;
      color: #e2e8f0;
      padding: 40px;
      line-height: 1.6;
    }
    .report {
      max-width: 800px;
      margin: 0 auto;
      background: #0d1a2d;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0d1a2d, #1a2d4a);
      padding: 40px;
      border-bottom: 1px solid rgba(34, 211, 238, 0.2);
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #22d3ee;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
    }
    .date {
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
    }
    .section {
      padding: 32px 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #22d3ee;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .metric {
      background: rgba(0, 0, 0, 0.2);
      padding: 20px;
      border-radius: 12px;
      border-left: 3px solid #22d3ee;
    }
    .metric-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #22d3ee;
    }
    .metric-note {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
    }
    .levers-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .lever {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }
    .lever-name {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
    .lever-value {
      font-size: 12px;
      font-weight: 600;
      color: #22d3ee;
    }
    .risk-section {
      display: flex;
      gap: 24px;
    }
    .risk-score {
      text-align: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      min-width: 120px;
    }
    .risk-number {
      font-size: 48px;
      font-weight: 700;
      color: ${riskSnapshot?.overallScore && riskSnapshot.overallScore > 60 ? '#ef4444' : riskSnapshot?.overallScore && riskSnapshot.overallScore > 40 ? '#fbbf24' : '#22d3ee'};
    }
    .risk-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 4px;
    }
    .risk-factors {
      flex: 1;
    }
    .risk-factor {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .risk-factor:last-child { border-bottom: none; }
    .factor-name { font-size: 12px; color: rgba(255, 255, 255, 0.7); }
    .factor-score { font-size: 12px; font-weight: 600; }
    .valuation-display {
      text-align: center;
      padding: 32px;
      background: rgba(34, 211, 238, 0.05);
      border: 1px solid rgba(34, 211, 238, 0.15);
      border-radius: 12px;
    }
    .val-label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 8px;
    }
    .val-main {
      font-size: 48px;
      font-weight: 700;
      color: #22d3ee;
    }
    .val-range {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 8px;
    }
    .val-multiple {
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    .footer {
      padding: 24px 40px;
      background: rgba(0, 0, 0, 0.2);
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
    }
    .disclaimer {
      margin-top: 16px;
      font-size: 9px;
      color: rgba(255, 255, 255, 0.3);
      font-style: italic;
    }
    @media print {
      body { background: white; color: #1a1a1a; }
      .report { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="report">
    <div class="header">
      <div class="logo">STRATFIT</div>
      <div class="subtitle">Strategy Intelligence Report</div>
      <div class="date">Generated on ${dateStr}</div>
    </div>
    
    ${simulation ? `
    <div class="section">
      <div class="section-title">📊 Simulation Results</div>
      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-label">Survival Probability</div>
          <div class="metric-value">${formatPercent(simulation.survivalRate)}</div>
          <div class="metric-note">Based on 10,000 Monte Carlo simulations</div>
        </div>
          <div class="metric">
          <div class="metric-label">Projected ARR</div>
          <div class="metric-value">${formatCurrency(simulation.arrMedian)}</div>
          <div class="metric-note">Median outcome at 36 months</div>
        </div>
        <div class="metric">
          <div class="metric-label">Cash Runway</div>
          <div class="metric-value">${Math.round(simulation.runwayMedian)}mo</div>
          <div class="metric-note">Until profitability or next raise</div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">⚙️ Strategy Levers</div>
      <div class="levers-grid">
        ${Object.entries(levers).map(([key, value]) => `
          <div class="lever">
            <span class="lever-name">${formatLeverName(key)}</span>
            <span class="lever-value">${value}%</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    ${riskSnapshot ? `
    <div class="section">
      <div class="section-title">⚡ Risk Assessment</div>
      <div class="risk-section">
        <div class="risk-score">
          <div class="risk-number">${riskSnapshot.overallScore}</div>
          <div class="risk-label">${riskSnapshot.overallLevel}</div>
        </div>
        <div class="risk-factors">
          ${riskSnapshot.factors.map(f => `
            <div class="risk-factor">
              <span class="factor-name">${f.label}</span>
              <span class="factor-score" style="color: ${f.score > 60 ? '#ef4444' : f.score > 40 ? '#fbbf24' : '#22d3ee'}">${f.score}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ` : ''}
    
    ${valuationSnapshot ? `
    <div class="section">
      <div class="section-title">💎 Valuation Estimate</div>
      <div class="valuation-display">
        <div class="val-label">Estimated Company Value</div>
        <div class="val-main">${formatCurrency(valuationSnapshot.currentValuation)}</div>
        <div class="val-range">${formatCurrency(valuationSnapshot.valuationRange.low)} — ${formatCurrency(valuationSnapshot.valuationRange.high)}</div>
        <div class="val-multiple">${valuationSnapshot.arrMultiple.toFixed(1)}x ARR Multiple</div>
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <div class="footer-text">
        Powered by STRATFIT — Scenario Intelligence Platform
      </div>
      <div class="disclaimer">
        This report is for informational purposes only. Projections are based on Monte Carlo simulations 
        and should not be considered financial advice. Past performance does not guarantee future results.
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };
  
  // Export as HTML/Print
  const handleExportHTML = () => {
    setIsExporting(true);
    const _t0 = performance.now();
    emitCompute("report_pack_generate", "initialize");
    
    try {
      emitCompute("report_pack_generate", "render");
      const html = generateReportHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
      
      emitCompute("report_pack_generate", "complete", {
        durationMs: performance.now() - _t0,
      });
      onExported?.();
    } catch (err) {
      emitCompute("report_pack_generate", "error", {
        note: String(err),
      });
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };
  
  // Export as downloadable HTML
  const handleDownloadHTML = () => {
    setIsExporting(true);
    const _t0 = performance.now();
    emitCompute("report_pack_generate", "initialize");
    
    try {
      emitCompute("report_pack_generate", "render");
      const html = generateReportHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stratfit-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      emitCompute("report_pack_generate", "complete", {
        durationMs: performance.now() - _t0,
      });
      onExported?.();
    } catch (err) {
      emitCompute("report_pack_generate", "error", {
        note: String(err),
      });
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };
  
  // Disabled if no simulation
  if (!hasSimulated) {
    return (
      <button className="export-btn disabled" disabled title="Run simulation first">
        {variant === 'icon' ? '📊' : '📊 Export'}
      </button>
    );
  }
  
  return (
    <div className="export-container">
      <button
        className={`export-btn ${variant} ${isExporting ? 'exporting' : ''}`}
        onClick={() => setShowOptions(!showOptions)}
        title="Export Report"
      >
        {isExporting ? (
          <span className="spinner" />
        ) : (
          <>
            <span className="btn-icon">📊</span>
            {variant === 'full' && <span className="btn-text">EXPORT</span>}
          </>
        )}
      </button>
      
      {showOptions && (
        <div className="export-dropdown">
          <button className="dropdown-item" onClick={handleExportHTML}>
            <span className="item-icon">🖨️</span>
            <span className="item-text">Print / Save as PDF</span>
          </button>
          <button className="dropdown-item" onClick={handleDownloadHTML}>
            <span className="item-icon">📄</span>
            <span className="item-text">Download HTML Report</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to format lever names
function formatLeverName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
