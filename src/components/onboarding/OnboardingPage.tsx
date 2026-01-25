// src/components/onboarding/OnboardingPage.tsx
// STRATFIT — Comprehensive Onboarding Wizard
// Multi-step form with God Mode styling and demo data option

import React, { useState, useCallback } from 'react';
import './OnboardingPage.css';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface OnboardingData {
  // Step 1: Company Basics
  companyName: string;
  industry: string;
  stage: string;
  employeeCount: string;
  
  // Step 2: Financial Position
  currentCash: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  revenueGrowthRate: number;
  
  // Step 3: Strategic Context
  fundingGoal: number;
  fundingTimeline: string;
  primaryChallenge: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

interface StepConfig {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
}

// Demo data for quick start
const DEMO_DATA: OnboardingData = {
  companyName: 'TechCo AI',
  industry: 'B2B SaaS',
  stage: 'seed',
  employeeCount: '11-25',
  currentCash: 1200000,
  monthlyBurn: 85000,
  monthlyRevenue: 42000,
  revenueGrowthRate: 15,
  fundingGoal: 3000000,
  fundingTimeline: '6-12',
  primaryChallenge: 'runway',
  riskTolerance: 'moderate',
};

const INITIAL_DATA: OnboardingData = {
  companyName: '',
  industry: '',
  stage: '',
  employeeCount: '',
  currentCash: 0,
  monthlyBurn: 0,
  monthlyRevenue: 0,
  revenueGrowthRate: 0,
  fundingGoal: 0,
  fundingTimeline: '',
  primaryChallenge: '',
  riskTolerance: 'moderate',
};

const STEPS: StepConfig[] = [
  { id: 1, title: 'Company Profile', subtitle: 'Tell us about your business', icon: '🏢' },
  { id: 2, title: 'Financial Position', subtitle: 'Current cash & metrics', icon: '💰' },
  { id: 3, title: 'Strategic Goals', subtitle: 'Where are you headed?', icon: '🎯' },
];

const INDUSTRIES = [
  'B2B SaaS', 'B2C App', 'Fintech', 'Healthtech', 'E-commerce',
  'Marketplace', 'Hardware', 'Deep Tech', 'Climate Tech', 'Other'
];

const STAGES = [
  { value: 'pre-seed', label: 'Pre-Seed', desc: 'Building MVP' },
  { value: 'seed', label: 'Seed', desc: '$500K-$3M raised' },
  { value: 'series-a', label: 'Series A', desc: '$5M-$20M raised' },
  { value: 'series-b', label: 'Series B+', desc: '$20M+ raised' },
  { value: 'bootstrapped', label: 'Bootstrapped', desc: 'Self-funded' },
];

const EMPLOYEE_COUNTS = [
  '1-5', '6-10', '11-25', '26-50', '51-100', '100+'
];

const CHALLENGES = [
  { value: 'runway', label: 'Runway Extension', icon: '⏳' },
  { value: 'growth', label: 'Accelerating Growth', icon: '🚀' },
  { value: 'fundraising', label: 'Fundraising Prep', icon: '💵' },
  { value: 'profitability', label: 'Path to Profit', icon: '📈' },
  { value: 'hiring', label: 'Hiring Decisions', icon: '👥' },
  { value: 'market', label: 'Market Expansion', icon: '🌐' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface OnboardingPageProps {
  onComplete?: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export default function OnboardingPage({ onComplete, onSkip }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Update field
  const updateField = useCallback(<K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  // Load demo data
  const loadDemoData = useCallback(() => {
    setData(DEMO_DATA);
    setErrors({});
  }, []);
  
  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof OnboardingData, string>> = {};
    
    if (step === 1) {
      if (!data.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!data.industry) newErrors.industry = 'Select an industry';
      if (!data.stage) newErrors.stage = 'Select your stage';
      if (!data.employeeCount) newErrors.employeeCount = 'Select team size';
    }
    
    if (step === 2) {
      if (data.currentCash <= 0) newErrors.currentCash = 'Enter your current cash';
      if (data.monthlyBurn <= 0) newErrors.monthlyBurn = 'Enter your monthly burn';
    }
    
    if (step === 3) {
      if (!data.primaryChallenge) newErrors.primaryChallenge = 'Select your primary challenge';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data]);
  
  // Navigate steps
  const goToStep = useCallback((step: number) => {
    if (step > currentStep && !validateStep(currentStep)) {
      return;
    }
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 200);
  }, [currentStep, validateStep]);
  
  const nextStep = () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    } else if (validateStep(3)) {
      onComplete?.(data);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Calculate runway
  const calculateRunway = () => {
    if (data.monthlyBurn <= 0) return '—';
    const netBurn = data.monthlyBurn - data.monthlyRevenue;
    if (netBurn <= 0) return 'Profitable ✨';
    const months = Math.floor(data.currentCash / netBurn);
    return `${months} months`;
  };
  
  return (
    <div className="onboarding-page">
      {/* Background Effects */}
      <div className="onboarding-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
        <div className="bg-glow top-left" />
        <div className="bg-glow bottom-right" />
      </div>
      
      <div className="onboarding-container">
        {/* Header */}
        <header className="onboarding-header">
          <div className="logo">
            <span className="logo-icon">⛰️</span>
            <span className="logo-text">STRATFIT</span>
          </div>
          
          <button className="demo-button" onClick={loadDemoData}>
            <span className="demo-icon">⚡</span>
            Load Demo Data
          </button>
        </header>
        
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-steps">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                onClick={() => currentStep > step.id && goToStep(step.id)}
              >
                <div className="step-indicator">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-number">{step.id}</span>
                </div>
                <div className="step-info">
                  <span className="step-title">{step.title}</span>
                  <span className="step-subtitle">{step.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Form Content */}
        <div className={`form-container ${isAnimating ? 'animating' : ''}`}>
          
          {/* Step 1: Company Profile */}
          {currentStep === 1 && (
            <div className="form-step step-1">
              <div className="step-header">
                <h2>Let's get to know your business</h2>
                <p>This helps us calibrate the simulation to your reality.</p>
              </div>
              
              <div className="form-grid">
                {/* Company Name */}
                <div className="form-group full-width">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    value={data.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    className={errors.companyName ? 'error' : ''}
                  />
                  {errors.companyName && <span className="error-text">{errors.companyName}</span>}
                </div>
                
                {/* Industry */}
                <div className="form-group">
                  <label>Industry</label>
                  <div className="select-wrapper">
                    <select
                      value={data.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className={errors.industry ? 'error' : ''}
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRIES.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  {errors.industry && <span className="error-text">{errors.industry}</span>}
                </div>
                
                {/* Team Size */}
                <div className="form-group">
                  <label>Team Size</label>
                  <div className="chip-group">
                    {EMPLOYEE_COUNTS.map(count => (
                      <button
                        key={count}
                        type="button"
                        className={`chip ${data.employeeCount === count ? 'active' : ''}`}
                        onClick={() => updateField('employeeCount', count)}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  {errors.employeeCount && <span className="error-text">{errors.employeeCount}</span>}
                </div>
                
                {/* Stage */}
                <div className="form-group full-width">
                  <label>Company Stage</label>
                  <div className="stage-grid">
                    {STAGES.map(stage => (
                      <button
                        key={stage.value}
                        type="button"
                        className={`stage-card ${data.stage === stage.value ? 'active' : ''}`}
                        onClick={() => updateField('stage', stage.value)}
                      >
                        <span className="stage-label">{stage.label}</span>
                        <span className="stage-desc">{stage.desc}</span>
                      </button>
                    ))}
                  </div>
                  {errors.stage && <span className="error-text">{errors.stage}</span>}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Financial Position */}
          {currentStep === 2 && (
            <div className="form-step step-2">
              <div className="step-header">
                <h2>Your current financial position</h2>
                <p>We'll use these numbers to model your scenarios.</p>
              </div>
              
              <div className="form-grid">
                {/* Current Cash */}
                <div className="form-group">
                  <label>Cash in Bank</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      placeholder="1,200,000"
                      value={data.currentCash || ''}
                      onChange={(e) => updateField('currentCash', Number(e.target.value))}
                      className={errors.currentCash ? 'error' : ''}
                    />
                  </div>
                  {errors.currentCash && <span className="error-text">{errors.currentCash}</span>}
                </div>
                
                {/* Monthly Burn */}
                <div className="form-group">
                  <label>Monthly Burn Rate</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      placeholder="85,000"
                      value={data.monthlyBurn || ''}
                      onChange={(e) => updateField('monthlyBurn', Number(e.target.value))}
                      className={errors.monthlyBurn ? 'error' : ''}
                    />
                  </div>
                  <span className="input-hint">Total monthly expenses</span>
                  {errors.monthlyBurn && <span className="error-text">{errors.monthlyBurn}</span>}
                </div>
                
                {/* Monthly Revenue */}
                <div className="form-group">
                  <label>Monthly Revenue</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      placeholder="42,000"
                      value={data.monthlyRevenue || ''}
                      onChange={(e) => updateField('monthlyRevenue', Number(e.target.value))}
                    />
                  </div>
                  <span className="input-hint">MRR or monthly sales</span>
                </div>
                
                {/* Growth Rate */}
                <div className="form-group">
                  <label>Monthly Revenue Growth</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      placeholder="15"
                      value={data.revenueGrowthRate || ''}
                      onChange={(e) => updateField('revenueGrowthRate', Number(e.target.value))}
                    />
                    <span className="suffix">%</span>
                  </div>
                  <span className="input-hint">Average MoM growth</span>
                </div>
              </div>
              
              {/* Live Calculation Card */}
              <div className="calculation-card">
                <div className="calc-header">
                  <span className="calc-icon">📊</span>
                  <span className="calc-title">Quick Analysis</span>
                </div>
                <div className="calc-grid">
                  <div className="calc-item">
                    <span className="calc-label">Net Monthly Burn</span>
                    <span className="calc-value negative">
                      {formatCurrency(Math.max(0, data.monthlyBurn - data.monthlyRevenue))}
                    </span>
                  </div>
                  <div className="calc-item">
                    <span className="calc-label">Current Runway</span>
                    <span className={`calc-value ${data.currentCash / (data.monthlyBurn - data.monthlyRevenue) > 12 ? 'positive' : 'warning'}`}>
                      {calculateRunway()}
                    </span>
                  </div>
                  <div className="calc-item">
                    <span className="calc-label">Burn Multiple</span>
                    <span className="calc-value">
                      {data.monthlyRevenue > 0 ? (data.monthlyBurn / data.monthlyRevenue).toFixed(1) + 'x' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Strategic Goals */}
          {currentStep === 3 && (
            <div className="form-step step-3">
              <div className="step-header">
                <h2>Your strategic priorities</h2>
                <p>Help us understand what decisions you're trying to make.</p>
              </div>
              
              <div className="form-grid">
                {/* Primary Challenge */}
                <div className="form-group full-width">
                  <label>Primary Challenge</label>
                  <div className="challenge-grid">
                    {CHALLENGES.map(challenge => (
                      <button
                        key={challenge.value}
                        type="button"
                        className={`challenge-card ${data.primaryChallenge === challenge.value ? 'active' : ''}`}
                        onClick={() => updateField('primaryChallenge', challenge.value)}
                      >
                        <span className="challenge-icon">{challenge.icon}</span>
                        <span className="challenge-label">{challenge.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.primaryChallenge && <span className="error-text">{errors.primaryChallenge}</span>}
                </div>
                
                {/* Funding Goal */}
                <div className="form-group">
                  <label>Target Raise Amount (Optional)</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      placeholder="3,000,000"
                      value={data.fundingGoal || ''}
                      onChange={(e) => updateField('fundingGoal', Number(e.target.value))}
                    />
                  </div>
                  <span className="input-hint">Leave blank if not raising</span>
                </div>
                
                {/* Funding Timeline */}
                <div className="form-group">
                  <label>Funding Timeline</label>
                  <div className="chip-group">
                    {['0-3', '3-6', '6-12', '12+', 'Not raising'].map(timeline => (
                      <button
                        key={timeline}
                        type="button"
                        className={`chip ${data.fundingTimeline === timeline ? 'active' : ''}`}
                        onClick={() => updateField('fundingTimeline', timeline)}
                      >
                        {timeline === 'Not raising' ? timeline : `${timeline} months`}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Risk Tolerance */}
                <div className="form-group full-width">
                  <label>Risk Tolerance</label>
                  <div className="risk-slider">
                    <button
                      type="button"
                      className={`risk-option ${data.riskTolerance === 'conservative' ? 'active' : ''}`}
                      onClick={() => updateField('riskTolerance', 'conservative')}
                    >
                      <span className="risk-icon">🛡️</span>
                      <span className="risk-label">Conservative</span>
                      <span className="risk-desc">Preserve runway</span>
                    </button>
                    <button
                      type="button"
                      className={`risk-option ${data.riskTolerance === 'moderate' ? 'active' : ''}`}
                      onClick={() => updateField('riskTolerance', 'moderate')}
                    >
                      <span className="risk-icon">⚖️</span>
                      <span className="risk-label">Balanced</span>
                      <span className="risk-desc">Calculated risks</span>
                    </button>
                    <button
                      type="button"
                      className={`risk-option ${data.riskTolerance === 'aggressive' ? 'active' : ''}`}
                      onClick={() => updateField('riskTolerance', 'aggressive')}
                    >
                      <span className="risk-icon">🚀</span>
                      <span className="risk-label">Aggressive</span>
                      <span className="risk-desc">Growth at all costs</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer Navigation */}
        <footer className="onboarding-footer">
          <div className="footer-left">
            {currentStep > 1 ? (
              <button className="nav-button secondary" onClick={prevStep}>
                <span className="nav-arrow">←</span>
                Back
              </button>
            ) : (
              <button className="nav-button ghost" onClick={onSkip}>
                Skip for now
              </button>
            )}
          </div>
          
          <div className="footer-right">
            <button className="nav-button primary" onClick={nextStep}>
              {currentStep === 3 ? (
                <>
                  Run Simulation
                  <span className="nav-icon">⚡</span>
                </>
              ) : (
                <>
                  Continue
                  <span className="nav-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </footer>
        
      </div>
    </div>
  );
}

export { DEMO_DATA, INITIAL_DATA };
export type { OnboardingData };
