import React, { useState, useMemo } from "react";
import "../styles/foundation.css";
import { useFoundationStore } from "../store/foundationStore";
import { exportFoundationPDF } from "../utils/exportFoundation";
import { ModelSensitivityPanel } from "../components/foundation/ModelSensitivityPanel";
import { FoundationImpactReport } from "../components/foundation/FoundationImpactReport";
import { FoundationMountainPreview } from "../components/foundation/FoundationMountainPreview";

interface FoundationProps {
  onLockedNavigate?: () => void;
}

type ViewMode = "setup" | "sensitivity" | "impact";

export default function Foundation({ onLockedNavigate }: FoundationProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("setup");

  const { draft, baseline, setField, locked, lock, unlock, dirtySinceLock } = useFoundationStore();
  
  // Helper to parse number values
  const nz = (v: string) => {
    const x = Number(String(v ?? "").replace(/,/g, "").trim());
    return Number.isFinite(x) ? x : 0;
  };

  // Calculate derived metrics
  const cash = nz(draft.cash);
  const burn = nz(draft.burn);
  const arr = nz(draft.arr);
  const mrr = nz(draft.mrr);
  const calcRunway = burn > 0 ? cash / burn : 0;
  const burnMultiple = mrr > 0 ? burn / mrr : 0;
  const survivalProb = calcRunway > 12 ? 85 : calcRunway > 6 ? 65 : calcRunway > 3 ? 40 : 20;

  const completionPercent = useMemo(() => {
    return Math.round(
      (Object.values(draft).filter((v) => v !== "").length /
        Object.keys(draft).length) *
        100
    );
  }, [draft]);

  const canLock = useMemo(() => {
    return draft.industry &&
      draft.stage &&
      draft.currency &&
      cash > 0 &&
      burn > 0 &&
      arr > 0;
  }, [draft, cash, burn, arr]);

  const confirmLock = () => {
    lock();

    const overlay = document.createElement("div");
    overlay.className = "fd-transition";
    document.body.appendChild(overlay);

    setTimeout(() => {
      onLockedNavigate?.();
      setTimeout(() => {
        overlay.remove();
      }, 600);
    }, 500);
  };

  const renderSlider = (label: string, key: keyof typeof draft, min: number, max: number, unit?: string) => {
    const value = nz(draft[key]);
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    
    const formatValue = () => {
      if (unit === "K") return `$${value.toLocaleString()}`;
      if (unit === "%") return `${value.toFixed(1)}%`;
      if (unit === "x") return `${value.toFixed(2)}x`;
      return value.toLocaleString();
    };
    
    return (
      <div className="fd-field-row">
        <div className="fd-field-label">{label}</div>
        <div className="fd-field-control">
          <div className="fd-slider-container">
            <div className="fd-slider-track">
              <div className="fd-slider-groove" />
              <div className="fd-slider-detents">
                <div className="fd-slider-tick" style={{ left: '0%' }} />
                <div className="fd-slider-tick" style={{ left: '25%' }} />
                <div className="fd-slider-tick fd-slider-tick-center" style={{ left: '50%' }} />
                <div className="fd-slider-tick" style={{ left: '75%' }} />
                <div className="fd-slider-tick" style={{ left: '100%' }} />
              </div>
              <div className="fd-slider-fill" style={{ width: `${percentage}%` }} />
              <div className="fd-slider-thumb" style={{ left: `${percentage}%` }}>
                <div className="fd-slider-thumb-core" />
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={unit === "%" || unit === "x" ? 0.1 : 1}
                value={value}
                onChange={(e) => setField(key, e.target.value)}
                disabled={locked}
                style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0, 
                  cursor: 'pointer',
                  zIndex: 2
                }}
              />
            </div>
            <div className="fd-slider-labels">
              <span className="fd-slider-label">Low</span>
              <span className="fd-slider-label fd-slider-label-center">Neutral</span>
              <span className="fd-slider-label">High</span>
            </div>
          </div>
          <div style={{ marginTop: '6px', textAlign: 'right', fontSize: '12px', fontWeight: '800', color: 'var(--fd-cyan)' }}>
            {formatValue()}
          </div>
        </div>
      </div>
    );
  };

  const renderDropdown = (label: string, key: keyof typeof draft, options: string[]) => (
    <div className="fd-field-row">
      <div className="fd-field-label">{label}</div>
      <div className="fd-field-control">
        <select
          className="fd-dropdown-select"
          value={draft[key]}
          onChange={(e) => setField(key, e.target.value)}
          disabled={locked}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    </div>
  );

  const renderNumberInput = (label: string, key: keyof typeof draft, unit?: string) => (
    <div className="fd-field-row">
      <div className="fd-field-label">{label}</div>
      <div className="fd-field-control">
        <div className="fd-number-wrapper">
          <input
            type="text"
            className="fd-number-input"
            value={draft[key]}
            onChange={(e) => setField(key, e.target.value)}
            disabled={locked}
            placeholder="0"
          />
          {unit && <span className="fd-number-unit">{unit}</span>}
        </div>
      </div>
    </div>
  );

  const renderToggleGroup = (label: string, key: keyof typeof draft, options: string[]) => (
    <div className="fd-field-row">
      <div className="fd-field-label">{label}</div>
      <div className="fd-field-control">
        <div className="fd-toggle-group">
          {options.map(opt => (
            <button
              key={opt}
              className={`fd-toggle-btn ${draft[key] === opt ? "selected" : ""}`}
              onClick={() => !locked && setField(key, opt)}
              disabled={locked}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const industries = ["SaaS", "FinTech", "HealthTech", "E-Commerce", "Marketplace", "Infrastructure", "DevTools", "AI/ML", "Other"];
  const stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Bootstrap", "Growth"];
  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

  const steps = [
    { id: 1, label: "Identity & Context" },
    { id: 2, label: "Financial Position" },
    { id: 3, label: "Operating Structure" },
    { id: 4, label: "Strategic Intent" },
  ];

  const [activeStepId, setActiveStepId] = React.useState(viewMode === "setup" ? 2 : 1);

  return (
    <div className="fd-root">
      <div className="fd-container">
        {/* SIDEBAR */}
        <aside className="fd-sidebar">
          <div className="fd-sidebar-header">
            <div className="fd-logo">
              <div className="fd-logo-icon">⬢</div>
              <div>
                <div className="fd-logo-title">STRATFIT</div>
                <div className="fd-logo-subtitle">Baseline Input</div>
              </div>
            </div>
          </div>

          <div className="fd-sidebar-content">
            {/* Step Navigation */}
            <div className="fd-steps">
              {steps.map((step) => (
                <button
                  key={step.id}
                  className={`fd-step ${activeStepId === step.id ? "active" : ""}`}
                  onClick={() => setActiveStepId(step.id)}
                >
                  <div className="fd-step-number">{step.id}</div>
                  <div className="fd-step-label">{step.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="fd-sidebar-bottom">
            <div className="fd-status-badge">
              {locked ? "LOCKED" : "DRAFT — NOT LOCKED"}
            </div>
            {locked && (
              <div className="fd-sidebar-actions">
                <button
                  className="fd-sidebar-btn"
                  onClick={() => setShowUnlockModal(true)}
                >
                  UNLOCK BASELINE
                </button>
                {baseline && (
                  <button
                    className="fd-sidebar-btn"
                    onClick={() => exportFoundationPDF(baseline)}
                  >
                    EXPORT SNAPSHOT
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="fd-main">
          {viewMode === "setup" && (
            <>
              {/* Header */}
              <div className="fd-header">
                <h1 className="fd-header-title">INITIATE</h1>
                <p className="fd-header-subtitle">Enter your current financial truth to anchor scenario modelling</p>
              </div>

              {/* Metrics Summary */}
              <div className="fd-metrics">
                <div className="fd-metric">
                  <div className="fd-metric-icon">▲</div>
                  <div className="fd-metric-label">RUNWAY</div>
                  <div className="fd-metric-value">{calcRunway.toFixed(1)} months</div>
                </div>
                <div className="fd-metric">
                  <div className="fd-metric-label">BURN MULTIPLE</div>
                  <div className="fd-metric-value">{burnMultiple.toFixed(2)} ×</div>
                </div>
                <div className="fd-metric">
                  <div className="fd-metric-icon">$</div>
                  <div className="fd-metric-label">MONTHLY BURN</div>
                  <div className="fd-metric-value">${burn.toLocaleString()}</div>
                </div>
                <div className="fd-metric">
                  <div className="fd-metric-label">SURVIVAL PROBABILITY</div>
                  <div className="fd-metric-value">{survivalProb} %</div>
                </div>
              </div>

              {/* Terrain Preview (2.5D) */}
              <div className="fd-mountainRow">
                <FoundationMountainPreview />
              </div>

              {/* Scrollable Sections */}
              <div className="fd-content">
                {/* Identity & Context */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Identity & Context</h2>
                  <div className="fd-section-content">
                    {renderDropdown("Industry", "industry", industries)}
                    {renderToggleGroup("Stage", "stage", stages)}
                    {renderToggleGroup("Currency", "currency", ["USD", "EUR", "GBP"])}
                  </div>
                </section>

                {/* Liquidity */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Liquidity</h2>
                  <div className="fd-section-content">
                    {renderSlider("Cash on Hand", "cash", 0, 5000, "K")}
                    {renderSlider("Monthly Net Burn", "burn", 0, 500, "K")}
                  </div>
                </section>

                {/* Revenue Engine */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Revenue Engine</h2>
                  <div className="fd-section-content">
                    {renderSlider("Current ARR", "arr", 0, 10000, "K")}
                    {renderSlider("Monthly Growth %", "growth", 0, 30, "%")}
                    {renderSlider("Monthly Churn %", "churn", 0, 15, "%")}
                    {renderSlider("Net Revenue Retention %", "nrr", 50, 150, "%")}
                  </div>
                </section>

                {/* Unit Economics */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Unit Economics</h2>
                  <div className="fd-section-content">
                    {renderNumberInput("Customer Count", "customerCount", "customers")}
                    {renderNumberInput("ACV", "acv", "$K")}
                    {renderNumberInput("CAC", "cac", "$K")}
                    {renderNumberInput("LTV", "ltv", "$K")}
                    {renderNumberInput("Payback Period", "paybackPeriod", "months")}
                  </div>
                </section>

                {/* Efficiency Metrics */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Efficiency Metrics</h2>
                  <div className="fd-section-content">
                    {renderSlider("Gross Margin %", "grossMargin", 0, 100, "%")}
                    {renderNumberInput("Magic Number", "magicNumber", "x")}
                    {renderNumberInput("MRR", "mrr", "$K")}
                  </div>
                </section>

                {/* Cost Structure */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Cost Structure</h2>
                  <div className="fd-section-content">
                    {renderNumberInput("Headcount", "headcount", "FTEs")}
                    {renderNumberInput("Avg Fully Loaded Cost", "avgCost", "$K/yr")}
                    {renderNumberInput("S&M Spend", "salesMarketingSpend", "$K/mo")}
                    {renderNumberInput("R&D Spend", "rdSpend", "$K/mo")}
                  </div>
                </section>

                {/* Capital Structure */}
                <section className="fd-section">
                  <h2 className="fd-section-title">Capital Structure</h2>
                  <div className="fd-section-content">
                    {renderNumberInput("Debt Outstanding", "debtOutstanding", "$K")}
                    {renderSlider("Interest Rate %", "interestRate", 0, 20, "%")}
                    {renderNumberInput("Next Raise Timeline", "nextRaiseMonths", "months")}
                    {renderNumberInput("Last Raise Amount", "lastRaiseAmount", "$K")}
                  </div>
                </section>

                {/* Lock Button */}
                {!locked && canLock && (
                  <button className="fd-lock-btn" onClick={confirmLock}>
                    LOCK BASELINE & ENTER TERRAIN
                  </button>
                )}

                {dirtySinceLock && (
                  <div className="fd-warning-banner">
                    ⚠ Baseline modified. Re-lock required to update Terrain.
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === "sensitivity" && <ModelSensitivityPanel />}
          {viewMode === "impact" && <FoundationImpactReport />}
        </main>
      </div>

      {/* UNLOCK CONFIRMATION MODAL */}
      {showUnlockModal && (
        <div className="fd-modalOverlay">
          <div className="fd-modal-bezel">
            <div className="fd-modal-rim">
              <div className="fd-modal-well">
                <div className="fd-modalTop">
                  <div className="fd-modalTitle">UNLOCK FOUNDATION?</div>
                  <div className="fd-modalSub">
                    Unlocking will invalidate the current baseline and require re-locking before simulation.
                  </div>
                </div>
                <div className="fd-modalActions">
                  <button
                    className="fd-btnGhost"
                    onClick={() => setShowUnlockModal(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="fd-btnPrimary"
                    onClick={() => {
                      unlock();
                      setShowUnlockModal(false);
                    }}
                  >
                    CONFIRM UNLOCK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
