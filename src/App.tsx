/**
 * STRATFIT Dashboard v4.0 — Production Ready
 * 
 * Matches target mockup exactly:
 * - KPI cards with mini widgets at top
 * - Dropdown scenario selector (not buttons)
 * - Grouped levers (Performance, Financial, People)
 * - Save/Load buttons on right
 * - AI Insights with typewriter effect + 3 tabs
 * - Premium dark styling
 */

import { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import MountainEngine from "./components/engine/MountainEngine";

// ============================================================================
// TYPES
// ============================================================================

type ScenarioId = "base" | "upside" | "downside" | "extreme";
type AITab = "highlights" | "risks" | "recommendations";

interface LeverState {
  // Performance
  marketShare: number;
  growthRate: number;
  // Financial  
  revenueGrowth: number;
  cogs: number;
  runwayBuffer: number;
  // People
  headcount: number;
  churnRate: number;
}

interface MetricState {
  revenue: number;
  profit: number;
  runway: number;
  cash: number;
  ebitda: number;
  ebitdaMargin: number;
  risk: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCENARIOS: { id: ScenarioId; label: string; color: string }[] = [
  { id: "base", label: "Base Case", color: "#22d3ee" },
  { id: "upside", label: "Upside", color: "#34d399" },
  { id: "downside", label: "Downside", color: "#fb923c" },
  { id: "extreme", label: "Extreme", color: "#f87171" },
];

const METRICS: { id: keyof MetricState; label: string; unit: string; prefix?: string }[] = [
  { id: "revenue", label: "Revenue", unit: "/mo", prefix: "£" },
  { id: "profit", label: "Profit", unit: "", prefix: "£" },
  { id: "runway", label: "Runway", unit: " Months", prefix: "" },
  { id: "cash", label: "Cash", unit: "/mnth", prefix: "£" },
  { id: "ebitda", label: "EBITDA", unit: "%", prefix: "" },
  { id: "ebitdaMargin", label: "EBITDA", unit: "%", prefix: "" },
  { id: "risk", label: "Risk", unit: "%", prefix: "" },
];

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateMetrics(levers: LeverState, scenario: ScenarioId): MetricState {
  const mult = scenario === "upside" ? 1.3 : scenario === "downside" ? 0.7 : scenario === "extreme" ? 0.5 : 1;
  
  return {
    revenue: Math.round((1.2 + levers.revenueGrowth * 0.02) * mult * 100) / 100,
    profit: Math.round((450 + levers.revenueGrowth * 5 - levers.cogs * 3) * mult),
    runway: Math.round((18 + levers.runwayBuffer * 0.3 - levers.headcount * 0.1) * mult),
    cash: Math.round((2.5 + levers.revenueGrowth * 0.05) * mult * 100) / 100,
    ebitda: Math.round((20 + levers.revenueGrowth * 0.5 - levers.cogs * 0.3) * mult),
    ebitdaMargin: Math.round((23 + levers.revenueGrowth * 0.3 - levers.headcount * 0.2) * mult),
    risk: Math.round(Math.max(5, Math.min(95, (15 + levers.churnRate * 2 - levers.marketShare * 0.2) / mult))),
  };
}

function metricsToDataPoints(metrics: MetricState): number[] {
  return [
    Math.min(1, metrics.revenue / 3),
    Math.min(1, metrics.profit / 800),
    Math.min(1, metrics.runway / 36),
    Math.min(1, metrics.cash / 5),
    Math.min(1, (metrics.ebitda + 10) / 50),
    Math.min(1, metrics.ebitdaMargin / 40),
    Math.min(1, 1 - metrics.risk / 100),
  ];
}

// ============================================================================
// MINI CHART COMPONENT (for KPI cards)
// ============================================================================

const MiniChart = memo(function MiniChart({ value, color, type }: { value: number; color: string; type: "line" | "bar" | "gauge" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 60;
    const h = 24;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, w, h);

    if (type === "line") {
      // Simple line chart
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const points = [0.3, 0.5, 0.4, 0.7, 0.6, value];
      points.forEach((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - p * h * 0.8 - 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (type === "gauge") {
      // Semi-circle gauge
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, h, h - 4, Math.PI, 0);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(w / 2, h, h - 4, Math.PI, Math.PI + Math.PI * value);
      ctx.stroke();
    } else {
      // Bar chart
      const bars = [0.4, 0.6, 0.8, value, 0.7];
      const barW = w / bars.length - 2;
      bars.forEach((b, i) => {
        ctx.fillStyle = i === 3 ? color : "#1e293b";
        const barH = b * h * 0.8;
        ctx.fillRect(i * (barW + 2), h - barH - 2, barW, barH);
      });
    }
  }, [value, color, type]);

  return <canvas ref={canvasRef} style={{ width: 60, height: 24 }} />;
});

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  index: number;
  isActive: boolean;
  onHover: (index: number | null) => void;
  color: string;
  chartType: "line" | "bar" | "gauge";
  chartValue: number;
}

const KPICard = memo(function KPICard({ 
  label, value, subValue, index, isActive, onHover, color, chartType, chartValue 
}: KPICardProps) {
  return (
    <div
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      style={{
        background: isActive ? "rgba(34, 211, 238, 0.1)" : "rgba(15, 23, 42, 0.8)",
        border: `1px solid ${isActive ? color : "#1e3a5f"}`,
        borderRadius: 8,
        padding: "10px 14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 0 20px ${color}33` : "none",
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>
          {subValue}
        </div>
      )}
      <MiniChart value={chartValue} color={color} type={chartType} />
    </div>
  );
});

// ============================================================================
// LEVER GROUP COMPONENT
// ============================================================================

interface LeverGroupProps {
  title: string;
  levers: { id: string; label: string; value: number; max: number }[];
  onChange: (id: string, value: number) => void;
}

const LeverGroup = memo(function LeverGroup({ title, levers, onChange }: LeverGroupProps) {
  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.6)",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 12,
    }}>
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: "#94a3b8", 
        textTransform: "uppercase", 
        letterSpacing: 1,
        marginBottom: 12,
      }}>
        {title}
      </div>
      {levers.map(lever => (
        <div key={lever.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#cbd5e1" }}>{lever.label}</span>
            <span style={{ fontSize: 11, color: "#22d3ee", fontWeight: 500 }}>{lever.value}%</span>
          </div>
          <input
            type="range"
            min="0"
            max={lever.max}
            value={lever.value}
            onChange={(e) => onChange(lever.id, Number(e.target.value))}
            style={{
              width: "100%",
              height: 4,
              appearance: "none",
              background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(lever.value / lever.max) * 100}%, #1e293b ${(lever.value / lever.max) * 100}%, #1e293b 100%)`,
              borderRadius: 2,
              cursor: "pointer",
            }}
          />
        </div>
      ))}
    </div>
  );
});

// ============================================================================
// AI INSIGHTS COMPONENT (with typewriter effect)
// ============================================================================

interface AIInsightsProps {
  scenario: ScenarioId;
  metrics: MetricState;
}

const AIInsights = memo(function AIInsights({ scenario, metrics }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<AITab>("highlights");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textRef = useRef("");

  const insights: Record<AITab, string> = useMemo(() => ({
    highlights: `The ${scenario} scenario projects ${metrics.runway} months runway with £${metrics.revenue}M monthly revenue. EBITDA margin of ${metrics.ebitdaMargin}% indicates ${metrics.ebitdaMargin > 20 ? "strong" : "moderate"} operational efficiency. Cash reserves of £${metrics.cash}M provide ${metrics.cash > 2 ? "adequate" : "limited"} buffer for growth initiatives.`,
    risks: `Current risk score of ${metrics.risk}% requires attention. Key concerns: ${metrics.runway < 12 ? "Limited runway below 12 months. " : ""}${metrics.risk > 30 ? "Elevated market exposure. " : ""}${metrics.ebitda < 15 ? "EBITDA margins under pressure. " : ""}Recommend stress-testing assumptions under adverse conditions.`,
    recommendations: `1. ${metrics.runway < 18 ? "Extend runway by reducing burn rate or securing bridge financing. " : "Maintain current trajectory. "}2. ${metrics.ebitdaMargin < 25 ? "Focus on margin improvement through operational efficiency. " : "Explore growth acceleration opportunities. "}3. Monitor cash position weekly and adjust forecasts accordingly.`,
  }), [scenario, metrics]);

  // Typewriter effect
  useEffect(() => {
    const fullText = insights[activeTab];
    if (fullText === textRef.current) return;
    
    textRef.current = fullText;
    setIsTyping(true);
    setDisplayedText("");
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activeTab, insights]);

  const tabs: { id: AITab; label: string }[] = [
    { id: "highlights", label: "Key Highlights" },
    { id: "risks", label: "Risks" },
    { id: "recommendations", label: "Recommendations" },
  ];

  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.8)",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: 16,
      flex: 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: "50%", 
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
            animation: isTyping ? "pulse 1s infinite" : "none",
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
            AI Insights
          </span>
          {isTyping && <span style={{ fontSize: 10, color: "#22c55e" }}>LIVE</span>}
        </div>
        <button
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "1px solid #1e3a5f",
            borderRadius: 4,
            color: "#94a3b8",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          📄 Generate PDF
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 12px",
              background: activeTab === tab.id ? "rgba(34, 211, 238, 0.15)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "#22d3ee" : "#1e3a5f"}`,
              borderRadius: 4,
              color: activeTab === tab.id ? "#22d3ee" : "#64748b",
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <p style={{ 
        color: "#e2e8f0", 
        fontSize: 13, 
        lineHeight: 1.6, 
        margin: 0,
        minHeight: 60,
      }}>
        {displayedText}
        {isTyping && <span style={{ opacity: 0.7 }}>▋</span>}
      </p>

      {/* Badges */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ 
          padding: "4px 10px", 
          borderRadius: 4, 
          background: "rgba(34, 211, 238, 0.15)", 
          border: "1px solid rgba(34, 211, 238, 0.3)" 
        }}>
          <span style={{ fontSize: 11, color: "#22d3ee" }}>Growth: +{metrics.ebitda}%</span>
        </div>
        <div style={{ 
          padding: "4px 10px", 
          borderRadius: 4, 
          background: "rgba(251, 146, 60, 0.15)", 
          border: "1px solid rgba(251, 146, 60, 0.3)" 
        }}>
          <span style={{ fontSize: 11, color: "#fb923c" }}>Risk: {metrics.risk}/100</span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [levers, setLevers] = useState<LeverState>({
    marketShare: 83,
    growthRate: 97,
    revenueGrowth: 28,
    cogs: 5,
    runwayBuffer: 23,
    headcount: 209,
    churnRate: 0,
  });

  const currentScenario = SCENARIOS.find(s => s.id === scenario) ?? SCENARIOS[0];
  const metrics = useMemo(() => calculateMetrics(levers, scenario), [levers, scenario]);
  const dataPoints = useMemo(() => metricsToDataPoints(metrics), [metrics]);

  const handleLeverChange = useCallback((id: string, value: number) => {
    setLevers(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleKPIHover = useCallback((index: number | null) => {
    setActiveKPIIndex(index);
  }, []);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#0a0e17",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: 20,
      gap: 16,
      overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      
      {/* ROW 1: KPI Cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard
          label="Revenue"
          value={`£${metrics.revenue}M`}
          subValue="/mo"
          index={0}
          isActive={activeKPIIndex === 0}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="line"
          chartValue={metrics.revenue / 3}
        />
        <KPICard
          label="Profit"
          value={`£${metrics.profit}K`}
          index={1}
          isActive={activeKPIIndex === 1}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="bar"
          chartValue={metrics.profit / 800}
        />
        <KPICard
          label="Runway"
          value={`${metrics.runway}`}
          subValue="Months"
          index={2}
          isActive={activeKPIIndex === 2}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="gauge"
          chartValue={metrics.runway / 36}
        />
        <KPICard
          label="Cash"
          value={`£${metrics.cash}M`}
          subValue="£150K/mnth"
          index={3}
          isActive={activeKPIIndex === 3}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="line"
          chartValue={metrics.cash / 5}
        />
        <KPICard
          label="EBITDA"
          value={`${metrics.ebitda}%`}
          index={4}
          isActive={activeKPIIndex === 4}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="bar"
          chartValue={metrics.ebitda / 40}
        />
        <KPICard
          label="EBITDA"
          value={`${metrics.ebitdaMargin}%`}
          subValue="BONRATE"
          index={5}
          isActive={activeKPIIndex === 5}
          onHover={handleKPIHover}
          color={currentScenario.color}
          chartType="bar"
          chartValue={metrics.ebitdaMargin / 40}
        />
        <KPICard
          label="Risk"
          value={`${metrics.risk}%`}
          subValue="MODERATE"
          index={6}
          isActive={activeKPIIndex === 6}
          onHover={handleKPIHover}
          color={metrics.risk > 30 ? "#fb923c" : currentScenario.color}
          chartType="gauge"
          chartValue={1 - metrics.risk / 100}
        />
      </div>

      {/* ROW 2: Scenario + Save/Load */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Scenario Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              minWidth: 180,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: currentScenario.color }} />
            <span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>{currentScenario.label}</span>
            <span style={{ color: "#64748b" }}>▼</span>
          </button>
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              marginTop: 4,
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              overflow: "hidden",
              zIndex: 100,
            }}>
              {SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setScenario(s.id); setDropdownOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 16px",
                    background: scenario === s.id ? "rgba(34, 211, 238, 0.1)" : "transparent",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save / Load */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "10px 20px",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid #1e3a5f",
            borderRadius: 8,
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
          }}>
            Save
          </button>
          <button style={{
            padding: "10px 20px",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid #1e3a5f",
            borderRadius: 8,
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
          }}>
            Load
          </button>
        </div>
      </div>

      {/* ROW 3: Levers + Mountain + (empty for balance) */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        
        {/* LEFT: Lever Groups */}
        <div style={{ width: 240, flexShrink: 0, overflowY: "auto" }}>
          <LeverGroup
            title="Performance"
            levers={[
              { id: "marketShare", label: "Market Share", value: levers.marketShare, max: 100 },
              { id: "growthRate", label: "Growth Rate", value: levers.growthRate, max: 100 },
            ]}
            onChange={handleLeverChange}
          />
          <LeverGroup
            title="Financial"
            levers={[
              { id: "revenueGrowth", label: "Revenue Growth", value: levers.revenueGrowth, max: 100 },
              { id: "cogs", label: "COGS", value: levers.cogs, max: 50 },
              { id: "runwayBuffer", label: "Runway Buffer", value: levers.runwayBuffer, max: 100 },
            ]}
            onChange={handleLeverChange}
          />
          <LeverGroup
            title="People"
            levers={[
              { id: "headcount", label: "Headcount", value: levers.headcount, max: 500 },
              { id: "churnRate", label: "Churn Rate", value: levers.churnRate, max: 30 },
            ]}
            onChange={handleLeverChange}
          />
        </div>

        {/* CENTER: Mountain */}
        <div style={{
          flex: 1,
          background: "rgba(10, 14, 23, 0.5)",
          border: "1px solid #1e3a5f",
          borderRadius: 8,
          overflow: "hidden",
          position: "relative",
        }}>
          <MountainEngine
            dataPoints={dataPoints}
            activeKPIIndex={activeKPIIndex}
            scenario={scenario}
          />
        </div>
      </div>

      {/* ROW 4: AI Insights */}
      <div style={{ display: "flex", gap: 16 }}>
        <AIInsights scenario={scenario} metrics={metrics} />
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}