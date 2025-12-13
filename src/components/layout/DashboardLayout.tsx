/**
 * STRATFIT Complete Dashboard - Self-Contained
 * 
 * All components inline - no external dependencies that could cause flickering
 */

import { useState, useCallback, useMemo, memo } from "react";
import MountainEngine from "../engine/MountainEngine";

// ============================================================================
// TYPES
// ============================================================================

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface LeverState {
  revenueGrowth: number;
  operatingExpenses: number;
  hiringRate: number;
  wageIncrease: number;
  burnRate: number;
}

interface MetricState {
  runway: number;
  cash: number;
  growth: number;
  ebitda: number;
  burn: number;
  risk: number;
  value: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCENARIOS: { id: ScenarioId; label: string; color: string }[] = [
  { id: "base", label: "Base Case", color: "#22d3ee" },
  { id: "upside", label: "Upside", color: "#34d399" },
  { id: "downside", label: "Downside", color: "#fb923c" },
  { id: "extreme", label: "Extreme Risk", color: "#f87171" },
];

const METRICS: { id: keyof MetricState; label: string; unit: string }[] = [
  { id: "runway", label: "Runway", unit: "mo" },
  { id: "cash", label: "Cash", unit: "$M" },
  { id: "growth", label: "Growth", unit: "%" },
  { id: "ebitda", label: "EBITDA", unit: "%" },
  { id: "burn", label: "Burn", unit: "$K" },
  { id: "risk", label: "Risk", unit: "/100" },
  { id: "value", label: "Value", unit: "$M" },
];

const LEVERS: { id: keyof LeverState; label: string; min: number; max: number }[] = [
  { id: "revenueGrowth", label: "Revenue Growth", min: 0, max: 100 },
  { id: "operatingExpenses", label: "Operating Expenses", min: 0, max: 100 },
  { id: "hiringRate", label: "Hiring Rate", min: 0, max: 50 },
  { id: "wageIncrease", label: "Wage Increase", min: 0, max: 30 },
  { id: "burnRate", label: "Burn Rate", min: 0, max: 100 },
];

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

function calculateMetrics(levers: LeverState, scenario: ScenarioId): MetricState {
  const mult = scenario === "upside" ? 1.3 : scenario === "downside" ? 0.7 : scenario === "extreme" ? 0.5 : 1;
  
  return {
    runway: Math.round(Math.max(1, (24 - levers.burnRate * 0.3 + levers.revenueGrowth * 0.2) * mult)),
    cash: Math.round(Math.max(0.5, (3 + levers.revenueGrowth * 0.1 - levers.burnRate * 0.05) * mult) * 10) / 10,
    growth: Math.round((levers.revenueGrowth * 1.2 - levers.operatingExpenses * 0.3) * mult),
    ebitda: Math.round((levers.revenueGrowth * 0.6 - levers.operatingExpenses * 0.5 - levers.hiringRate * 0.4) * mult),
    burn: Math.round((120 + levers.burnRate * 5 + levers.hiringRate * 10 + levers.wageIncrease * 8) / mult),
    risk: Math.round(Math.min(100, Math.max(0, (30 + levers.burnRate * 0.5 - levers.revenueGrowth * 0.3) / mult))),
    value: Math.round(Math.max(1, (10 + levers.revenueGrowth * 0.3 - levers.burnRate * 0.1) * mult)),
  };
}

function metricsToDataPoints(metrics: MetricState): number[] {
  return [
    Math.min(1, metrics.runway / 30),
    Math.min(1, metrics.cash / 10),
    Math.min(1, Math.max(0, metrics.growth + 20) / 60),
    Math.min(1, Math.max(0, metrics.ebitda + 30) / 60),
    Math.min(1, 1 - metrics.burn / 500),
    Math.min(1, 1 - metrics.risk / 100),
    Math.min(1, metrics.value / 25),
  ];
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  label: string;
  value: string;
  index: number;
  isActive: boolean;
  onHover: (index: number | null) => void;
  color: string;
}

const KPICard = memo(function KPICard({ label, value, index, isActive, onHover, color }: KPICardProps) {
  return (
    <div
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: isActive ? `${color}22` : "rgba(10, 22, 40, 0.8)",
        border: `1px solid ${isActive ? color : "#1a253a"}`,
        borderRadius: 12,
        padding: "12px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 0 20px ${color}44` : "none",
      }}
    >
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: isActive ? color : "#fff" }}>
        {value}
      </div>
    </div>
  );
});

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  color: string;
}

const SliderComponent = memo(function SliderComponent({ label, value, min, max, onChange, color }: SliderProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
        <span style={{ fontSize: 12, color: color, fontWeight: 500 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 4,
          appearance: "none",
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #1e293b ${((value - min) / (max - min)) * 100}%, #1e293b 100%)`,
          borderRadius: 2,
          cursor: "pointer",
        }}
      />
    </div>
  );
});

// ============================================================================
// AI INSIGHTS COMPONENT
// ============================================================================

interface AIInsightsProps {
  scenario: ScenarioId;
  metrics: MetricState;
  color: string;
}

const AIInsights = memo(function AIInsights({ scenario, metrics, color }: AIInsightsProps) {
  const insight = useMemo(() => {
    if (scenario === "upside") {
      return `Strong growth trajectory with ${metrics.growth}% projected growth. Runway of ${metrics.runway} months provides solid foundation for expansion. Consider accelerating hiring to capitalize on market conditions.`;
    } else if (scenario === "downside") {
      return `Caution advised with current ${metrics.burn}K monthly burn. Risk score of ${metrics.risk}/100 suggests tightening operational expenses. Focus on extending runway beyond ${metrics.runway} months.`;
    } else if (scenario === "extreme") {
      return `Critical conditions detected. Immediate action required to address ${metrics.risk}/100 risk level. Recommend reducing burn rate and securing bridge financing to extend ${metrics.runway} month runway.`;
    }
    return `Base case projects ${metrics.runway} months runway with ${metrics.growth}% growth. Current valuation estimate: $${metrics.value}M. Monitor burn rate of $${metrics.burn}K/month against cash reserves of $${metrics.cash}M.`;
  }, [scenario, metrics]);

  return (
    <div
      style={{
        background: "rgba(10, 22, 40, 0.8)",
        border: "1px solid #1a253a",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
          AI Insights
        </span>
      </div>
      <p style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
        {insight}
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <div style={{ padding: "6px 12px", borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44` }}>
          <span style={{ fontSize: 12, color }}>Growth: {metrics.growth}%</span>
        </div>
        <div style={{ padding: "6px 12px", borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44` }}>
          <span style={{ fontSize: 12, color }}>Risk: {metrics.risk}/100</span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  // State
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [levers, setLevers] = useState<LeverState>({
    revenueGrowth: 25,
    operatingExpenses: 20,
    hiringRate: 15,
    wageIncrease: 8,
    burnRate: 35,
  });

  // Derived
  const currentScenario = SCENARIOS.find(s => s.id === scenario) ?? SCENARIOS[0];
  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  // Handlers
  const handleLeverChange = useCallback((id: keyof LeverState, value: number) => {
    setLevers(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleKPIHover = useCallback((index: number | null) => {
    setActiveKPIIndex(index);
  }, []);

  return (
    <div style={{ 
      width: "100vw", 
      height: "100vh", 
      background: "#070b12", 
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: 24,
      gap: 20,
      overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      
      {/* ROW 1: KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {METRICS.map((metric, i) => (
          <KPICard
            key={metric.id}
            label={metric.label}
            value={`${metrics[metric.id]}${metric.unit}`}
            index={i}
            isActive={activeKPIIndex === i}
            onHover={handleKPIHover}
            color={currentScenario.color}
          />
        ))}
      </div>

      {/* ROW 2: Scenario Selector */}
      <div style={{ display: "flex", gap: 12 }}>
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => setScenario(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              border: `1px solid ${scenario === s.id ? s.color : "#1a253a"}`,
              background: scenario === s.id ? `${s.color}22` : "rgba(10, 22, 40, 0.8)",
              color: scenario === s.id ? s.color : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: "50%", 
              background: s.color,
              boxShadow: scenario === s.id ? `0 0 10px ${s.color}` : "none",
            }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ROW 3: Sliders + Mountain */}
      <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
        
        {/* LEFT: Sliders */}
        <div style={{
          width: 280,
          flexShrink: 0,
          background: "rgba(10, 22, 40, 0.6)",
          border: "1px solid #1a253a",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: 11, 
            fontWeight: 600, 
            color: "#64748b", 
            textTransform: "uppercase", 
            letterSpacing: 1.5 
          }}>
            Scenario Levers
          </h3>
          {LEVERS.map(lever => (
            <SliderComponent
              key={lever.id}
              label={lever.label}
              value={levers[lever.id]}
              min={lever.min}
              max={lever.max}
              onChange={(v) => handleLeverChange(lever.id, v)}
              color={currentScenario.color}
            />
          ))}
        </div>

        {/* RIGHT: Mountain */}
        <div style={{
          flex: 1,
          background: "rgba(10, 22, 40, 0.4)",
          border: "1px solid #1a253a",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <MountainEngine
            dataPoints={dataPoints}
            activeKPIIndex={activeKPIIndex}
            scenario={scenario}
          />
        </div>
      </div>

      {/* ROW 4: AI Insights */}
      <AIInsights
        scenario={scenario}
        metrics={metrics}
        color={currentScenario.color}
      />
    </div>
  );
}
