// src/components/valuation/ValuationTab.tsx
// STRATFIT — Valuation Engine (GOD MODE)
// Full-width, no sidebars, elegant inputs

import { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Zap,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react'

import './ValuationStyles.css'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ValuationInputs {
  arr: number
  growth: number
  nrr: number
  grossMargin: number
  rule40: number
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth'
}

interface MultipleBenchmark {
  label: string
  multiple: number
  description: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALUATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function calculateValuation(inputs: ValuationInputs) {
  // Base multiple from growth
  let baseMultiple = 5
  if (inputs.growth >= 100) baseMultiple = 15
  else if (inputs.growth >= 75) baseMultiple = 12
  else if (inputs.growth >= 50) baseMultiple = 9
  else if (inputs.growth >= 30) baseMultiple = 7
  
  // NRR adjustment
  let nrrMultiplier = 1
  if (inputs.nrr >= 130) nrrMultiplier = 1.3
  else if (inputs.nrr >= 120) nrrMultiplier = 1.2
  else if (inputs.nrr >= 110) nrrMultiplier = 1.1
  else if (inputs.nrr < 100) nrrMultiplier = 0.8
  
  // Gross margin adjustment
  let marginMultiplier = 1
  if (inputs.grossMargin >= 80) marginMultiplier = 1.15
  else if (inputs.grossMargin >= 70) marginMultiplier = 1.05
  else if (inputs.grossMargin < 60) marginMultiplier = 0.85
  
  // Rule of 40 adjustment
  let rule40Multiplier = 1
  if (inputs.rule40 >= 60) rule40Multiplier = 1.25
  else if (inputs.rule40 >= 40) rule40Multiplier = 1.1
  else if (inputs.rule40 < 20) rule40Multiplier = 0.8
  
  // Stage adjustment
  const stageMultipliers = {
    'pre-seed': 0.7,
    'seed': 0.85,
    'series-a': 1.0,
    'series-b': 1.1,
    'growth': 1.15,
  }
  
  const finalMultiple = baseMultiple * nrrMultiplier * marginMultiplier * rule40Multiplier * stageMultipliers[inputs.stage]
  const valuation = inputs.arr * finalMultiple
  
  // Ranges (±20% for low/high)
  const lowValuation = valuation * 0.8
  const highValuation = valuation * 1.25
  
  return {
    multiple: finalMultiple,
    valuation,
    lowValuation,
    highValuation,
    components: {
      base: baseMultiple,
      nrr: nrrMultiplier,
      margin: marginMultiplier,
      rule40: rule40Multiplier,
      stage: stageMultipliers[inputs.stage],
    }
  }
}

function getBenchmarks(): MultipleBenchmark[] {
  return [
    { label: 'Bottom Quartile', multiple: 4, description: 'Struggling companies' },
    { label: 'Median', multiple: 8, description: 'Average performers' },
    { label: 'Top Quartile', multiple: 14, description: 'Strong performers' },
    { label: 'Best in Class', multiple: 25, description: 'Category leaders' },
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function MetricInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  format,
  description,
  color = 'violet',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  format?: (v: number) => string
  description?: string
  color?: 'violet' | 'cyan' | 'emerald' | 'amber'
}) {
  const colorClasses = {
    violet: 'val-input-violet',
    cyan: 'val-input-cyan',
    emerald: 'val-input-emerald',
    amber: 'val-input-amber',
  }
  
  const increment = () => onChange(Math.min(max, value + step))
  const decrement = () => onChange(Math.max(min, value - step))
  
  const displayValue = format ? format(value) : `${value}${unit}`
  
  return (
    <div className="val-metric-input">
      <div className="val-input-header">
        <div>
          <div className="val-input-label">{label}</div>
          {description && (
            <div className="val-input-desc">{description}</div>
          )}
        </div>
        <div className={`val-input-control ${colorClasses[color]}`}>
          <button onClick={decrement} className="val-input-btn">
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="val-input-value">{displayValue}</span>
          <button onClick={increment} className="val-input-btn">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Slider */}
      <div className="val-slider-track">
        <div 
          className={`val-slider-fill val-slider-fill--${color}`}
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="val-slider-input"
        />
      </div>
      
      {/* Range labels */}
      <div className="val-slider-range">
        <span>{format ? format(min) : `${min}${unit}`}</span>
        <span>{format ? format(max) : `${max}${unit}`}</span>
      </div>
    </div>
  )
}

function StageSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth') => void
}) {
  const stages = [
    { id: 'pre-seed', label: 'Pre-Seed', arr: '<$500K' },
    { id: 'seed', label: 'Seed', arr: '$500K-2M' },
    { id: 'series-a', label: 'Series A', arr: '$2M-10M' },
    { id: 'series-b', label: 'Series B', arr: '$10M-30M' },
    { id: 'growth', label: 'Growth', arr: '$30M+' },
  ] as const
  
  return (
    <div className="val-stage-selector">
      <div className="val-input-label">Company Stage</div>
      <div className="val-stage-buttons">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => onChange(stage.id)}
            className={`val-stage-btn ${value === stage.id ? 'active' : ''}`}
          >
            <div className="val-stage-label">{stage.label}</div>
            <div className="val-stage-arr">{stage.arr}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ValuationTab() {
  const [inputs, setInputs] = useState<ValuationInputs>({
    arr: 4000000,
    growth: 45,
    nrr: 115,
    grossMargin: 75,
    rule40: 50,
    stage: 'seed',
  })

  const result = useMemo(() => calculateValuation(inputs), [inputs])
  const benchmarks = useMemo(() => getBenchmarks(), [])

  const formatMoney = (x: number) => {
    if (x >= 1000000000) return `$${(x / 1000000000).toFixed(1)}B`
    if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
    if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
    return `$${x.toFixed(0)}`
  }

  const formatARR = (x: number) => {
    if (x >= 1000000) return `$${(x / 1000000).toFixed(1)}M`
    if (x >= 1000) return `$${(x / 1000).toFixed(0)}K`
    return `$${x}`
  }

  return (
    <div className="valuation-tab valuation-tab--godmode">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <header className="val-header">
        <div className="val-header-left">
          <div className="val-header-brand">
            <DollarSign className="w-5 h-5 text-violet-400" />
            <span className="val-header-title">STRATFIT</span>
          </div>
          <div className="val-header-divider" />
          <span className="val-header-subtitle">VALUATION ENGINE</span>
        </div>

        <div className="val-header-badge">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
          <span>REAL-TIME CALCULATION</span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <main className="val-content">
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* HERO: VALUATION RESULT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="val-hero">
          <div className="val-hero-label">ESTIMATED VALUATION</div>
          
          {/* Main Value */}
          <div className="val-hero-value-wrap">
            <div className="val-hero-value">
              {formatMoney(result.valuation)}
            </div>
            <div className="val-hero-glow">
              {formatMoney(result.valuation)}
            </div>
          </div>
          
          {/* Range */}
          <div className="val-hero-range">
            <span className="val-hero-range-label">Range:</span>
            <span className="val-hero-range-value">{formatMoney(result.lowValuation)}</span>
            <div className="val-hero-range-bar" />
            <span className="val-hero-range-value">{formatMoney(result.highValuation)}</span>
          </div>
          
          {/* Multiple Badge */}
          <div className="val-hero-multiple">
            <span className="val-hero-multiple-label">Revenue Multiple:</span>
            <span className="val-hero-multiple-value">{result.multiple.toFixed(1)}x</span>
            <span className="val-hero-multiple-unit">ARR</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* BENCHMARK BAR */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="val-benchmark">
          <div className="val-benchmark-header">
            <div className="val-benchmark-title">YOUR POSITION VS MARKET</div>
            <div className="val-benchmark-note">Based on comparable SaaS transactions</div>
          </div>
          
          <div className="val-benchmark-bar">
            {/* Gradient background */}
            <div className="val-benchmark-gradient" />
            
            {/* Benchmark markers */}
            {benchmarks.map((b) => (
              <div 
                key={b.label}
                className="val-benchmark-marker"
                style={{ left: `${(b.multiple / 30) * 100}%` }}
              >
                <div className="val-benchmark-line" />
              </div>
            ))}
            
            {/* Your position marker */}
            <div 
              className="val-benchmark-position"
              style={{ left: `${Math.min(95, (result.multiple / 30) * 100)}%` }}
            >
              <div className="val-benchmark-indicator">
                <div className="val-benchmark-indicator-value">{result.multiple.toFixed(1)}x</div>
                <div className="val-benchmark-indicator-arrow" />
              </div>
            </div>
          </div>
          
          {/* Benchmark labels below */}
          <div className="val-benchmark-labels">
            {benchmarks.map((b) => (
              <div key={b.label} className="val-benchmark-label">
                <div className="val-benchmark-label-value">{b.multiple}x</div>
                <div className="val-benchmark-label-desc">{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* INPUT CONTROLS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="val-inputs">
          {/* Left Column */}
          <div className="val-inputs-col">
            {/* ARR */}
            <MetricInput
              label="Annual Recurring Revenue"
              description="Your current ARR"
              value={inputs.arr}
              onChange={(v) => setInputs({ ...inputs, arr: v })}
              min={100000}
              max={50000000}
              step={100000}
              unit=""
              format={formatARR}
              color="violet"
            />
            
            {/* Growth */}
            <MetricInput
              label="YoY Revenue Growth"
              description="Year-over-year growth rate"
              value={inputs.growth}
              onChange={(v) => setInputs({ ...inputs, growth: v })}
              min={0}
              max={200}
              step={5}
              unit="%"
              color="emerald"
            />
            
            {/* NRR */}
            <MetricInput
              label="Net Revenue Retention"
              description="Including expansion, net of churn"
              value={inputs.nrr}
              onChange={(v) => setInputs({ ...inputs, nrr: v })}
              min={60}
              max={180}
              step={5}
              unit="%"
              color="cyan"
            />
          </div>
          
          {/* Right Column */}
          <div className="val-inputs-col">
            {/* Gross Margin */}
            <MetricInput
              label="Gross Margin"
              description="Revenue minus COGS"
              value={inputs.grossMargin}
              onChange={(v) => setInputs({ ...inputs, grossMargin: v })}
              min={30}
              max={95}
              step={5}
              unit="%"
              color="amber"
            />
            
            {/* Rule of 40 */}
            <MetricInput
              label="Rule of 40 Score"
              description="Growth % + Profit Margin %"
              value={inputs.rule40}
              onChange={(v) => setInputs({ ...inputs, rule40: v })}
              min={-20}
              max={100}
              step={5}
              unit="%"
              color="violet"
            />
            
            {/* Stage */}
            <StageSelector
              value={inputs.stage}
              onChange={(v) => setInputs({ ...inputs, stage: v })}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* MULTIPLE BREAKDOWN */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="val-breakdown">
          <div className="val-breakdown-header">
            <div>
              <div className="val-breakdown-title">MULTIPLE CALCULATION</div>
              <div className="val-breakdown-subtitle">How we got to {result.multiple.toFixed(1)}x</div>
            </div>
            <div className="val-breakdown-note">
              <Info className="w-4 h-4" />
              Based on SaaS benchmarks
            </div>
          </div>
          
          <div className="val-breakdown-formula">
            {/* Base */}
            <div className="val-breakdown-card">
              <div className="val-breakdown-card-label">BASE</div>
              <div className="val-breakdown-card-value">{result.components.base.toFixed(0)}x</div>
              <div className="val-breakdown-card-desc">from growth</div>
            </div>
            
            <div className="val-breakdown-op">×</div>
            
            {/* NRR */}
            <div className="val-breakdown-card val-breakdown-card--cyan">
              <div className="val-breakdown-card-label">NRR</div>
              <div className="val-breakdown-card-value">{result.components.nrr.toFixed(2)}x</div>
              <div className="val-breakdown-card-desc">{inputs.nrr}% retention</div>
            </div>
            
            <div className="val-breakdown-op">×</div>
            
            {/* Margin */}
            <div className="val-breakdown-card val-breakdown-card--amber">
              <div className="val-breakdown-card-label">MARGIN</div>
              <div className="val-breakdown-card-value">{result.components.margin.toFixed(2)}x</div>
              <div className="val-breakdown-card-desc">{inputs.grossMargin}% GM</div>
            </div>
            
            <div className="val-breakdown-op">×</div>
            
            {/* Rule of 40 */}
            <div className="val-breakdown-card val-breakdown-card--emerald">
              <div className="val-breakdown-card-label">RULE 40</div>
              <div className="val-breakdown-card-value">{result.components.rule40.toFixed(2)}x</div>
              <div className="val-breakdown-card-desc">{inputs.rule40}% score</div>
            </div>
            
            <div className="val-breakdown-op">×</div>
            
            {/* Stage */}
            <div className="val-breakdown-card val-breakdown-card--violet">
              <div className="val-breakdown-card-label">STAGE</div>
              <div className="val-breakdown-card-value">{result.components.stage.toFixed(2)}x</div>
              <div className="val-breakdown-card-desc">{inputs.stage}</div>
            </div>
            
            <div className="val-breakdown-op">=</div>
            
            {/* Result */}
            <div className="val-breakdown-card val-breakdown-card--result">
              <div className="val-breakdown-card-label">FINAL</div>
              <div className="val-breakdown-card-value val-breakdown-card-value--lg">{result.multiple.toFixed(1)}x</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* INSIGHTS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="val-insights">
          {/* Insight 1 */}
          <div className="val-insight-card">
            <div className="val-insight-header">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="val-insight-label val-insight-label--emerald">STRENGTH</span>
            </div>
            <div className="val-insight-text">
              {inputs.growth >= 50 
                ? `Your ${inputs.growth}% growth rate is driving premium multiples`
                : inputs.nrr >= 120
                ? `${inputs.nrr}% NRR shows exceptional retention`
                : inputs.rule40 >= 40
                ? `Rule of 40 score of ${inputs.rule40} signals healthy unit economics`
                : `Your metrics are solid across the board`
              }
            </div>
          </div>
          
          {/* Insight 2 */}
          <div className="val-insight-card">
            <div className="val-insight-header">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="val-insight-label val-insight-label--amber">OPPORTUNITY</span>
            </div>
            <div className="val-insight-text">
              {inputs.nrr < 110
                ? `Improving NRR to 120%+ would add ~${((1.2 / result.components.nrr - 1) * 100).toFixed(0)}% to your multiple`
                : inputs.grossMargin < 75
                ? `Raising gross margin to 80%+ could boost valuation by 10-15%`
                : inputs.growth < 50
                ? `Accelerating growth to 50%+ would significantly improve multiples`
                : `Focus on maintaining these strong metrics through scale`
              }
            </div>
          </div>
          
          {/* Insight 3 */}
          <div className="val-insight-card val-insight-card--ai">
            <div className="val-insight-header">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="val-insight-label val-insight-label--violet">AI INSIGHT</span>
            </div>
            <div className="val-insight-text">
              At {formatARR(inputs.arr)} ARR with {result.multiple.toFixed(1)}x multiple, you're positioned in the{' '}
              <span className="text-violet-400">
                {result.multiple >= 14 ? 'top quartile' : result.multiple >= 8 ? 'above median' : 'median range'}
              </span>{' '}
              for {inputs.stage.replace('-', ' ')} stage companies.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
