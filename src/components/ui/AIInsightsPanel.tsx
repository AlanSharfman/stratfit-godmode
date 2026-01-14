import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, MessageSquare, ShieldAlert, Lightbulb } from "lucide-react";

interface AIInsightsPanelProps {
  scenario: "base" | "upside" | "downside" | "stress";
  kpiValues: {
    runway: number;
    cash: number;
    growth: number;
    ebitda: number;
    burn: number;
    risk: number;
    value: number;
  };
  sliderValues: {
    revenueGrowth: number;
    operatingExpenses: number;
    hiringRate: number;
    wageIncrease: number;
    burnRate: number;
  };
}

type TabType = "commentary" | "risks" | "recommendations";

export default function AIInsightsPanel({ scenario, kpiValues, sliderValues }: AIInsightsPanelProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("commentary");
  const [currentIndex, setCurrentIndex] = useState(0);

  const insights = useMemo(() => {
    return {
      base: {
        commentary: [
          "Current trajectory shows " + kpiValues.runway + " months runway with steady burn. The business is operating within normal parameters with revenue growth at " + sliderValues.revenueGrowth + "%.",
          "EBITDA margin of " + kpiValues.ebitda + "% indicates healthy operational efficiency. Cash reserves at " + kpiValues.cash + " provide adequate working capital for planned initiatives.",
          "Enterprise value trending at " + kpiValues.value + " reflects market confidence. Hiring rate of " + sliderValues.hiringRate + "% supports growth without overextending payroll.",
        ],
        risks: [
          "Burn rate sensitivity: Each 10% increase in OpEx reduces runway by approximately " + Math.round(kpiValues.runway * 0.08) + " months. Monitor closely.",
          "Revenue concentration risk: Ensure no single customer exceeds 25% of ARR to maintain healthy portfolio diversification.",
          "Market timing exposure: Current growth rate assumes stable market conditions. Economic headwinds could compress margins by 15-20%.",
        ],
        recommendations: [
          "Maintain cash buffer at minimum 6 months operating expenses. Current position supports this with " + Math.round(kpiValues.cash / (kpiValues.burn || 1)) + " months coverage.",
          "Consider strategic investment in Q2 when cash position peaks. Target 12-15% allocation to growth initiatives.",
          "Review vendor contracts for 10-15% cost optimization opportunities without impacting delivery capacity.",
        ],
      },
      upside: {
        commentary: [
          "Accelerated growth trajectory projects " + Math.round(kpiValues.runway * 1.3) + " months extended runway. Strong unit economics support aggressive expansion.",
          "Revenue momentum at " + sliderValues.revenueGrowth + "% exceeds plan by 25%. Consider accelerating hiring to capture market opportunity window.",
          "Enterprise value trajectory reaching " + kpiValues.value + " under optimal conditions. Investor interest likely to increase at these metrics.",
        ],
        risks: [
          "Scaling risk: Rapid growth may strain operational capacity. Ensure infrastructure can handle 2x current load.",
          "Talent acquisition competition: High hiring rate of " + sliderValues.hiringRate + "% may face market constraints. Budget for 15-20% salary premium.",
          "Customer success capacity: Growth must be matched with support scaling to maintain NPS above 50.",
        ],
        recommendations: [
          "Accelerate Series B timeline by 6 months to capitalize on momentum. Current metrics support improved terms.",
          "Expand sales team by " + Math.round(sliderValues.hiringRate * 0.4) + "% to capture demand. ROI typically 6-8 months for new AEs.",
          "Invest in product differentiation before competitors respond. Allocate 20% of engineering to moat-building features.",
        ],
      },
      downside: {
        commentary: [
          "Runway compression detected: " + kpiValues.runway + " months at current burn. Immediate cost review required to extend operating window.",
          "Revenue headwinds impacting growth trajectory. Current " + sliderValues.revenueGrowth + "% growth insufficient to offset burn rate.",
          "Cash preservation mode recommended. Each month of delayed action reduces strategic options significantly.",
        ],
        risks: [
          "Liquidity crisis: Without intervention, cash exhaustion projected in " + kpiValues.runway + " months. Bridge financing may be required.",
          "Talent retention: Cost-cutting measures may trigger key employee departures. Identify and protect critical personnel.",
          "Customer confidence: Market may perceive weakness. Proactive communication essential to prevent churn acceleration.",
        ],
        recommendations: [
          "Implement immediate hiring freeze. Redirect " + Math.round(sliderValues.operatingExpenses * 0.15) + "% of payroll budget to runway extension.",
          "Renegotiate vendor contracts targeting 20% reduction. Most vendors prefer renegotiation over customer loss.",
          "Focus sales on expansion revenue from existing customers. 3x more efficient than new logo acquisition in downturns.",
        ],
      },
      stress: {
        commentary: [
          "CRITICAL: Runway at " + kpiValues.runway + " months. This is a survival scenario requiring immediate executive action.",
          "All non-essential operations must cease. Focus exclusively on core revenue-generating activities and cash preservation.",
          "Board notification required within 48 hours. Fiduciary duty mandates full transparency on financial position.",
        ],
        risks: [
          "Insolvency risk: Without immediate action, inability to meet obligations within " + Math.round(kpiValues.runway * 0.7) + " months.",
          "Legal exposure: Ensure all creditor communications are documented. Personal liability may attach if trading while insolvent.",
          "Asset devaluation: Fire-sale conditions reduce enterprise value by 60-80%. Structured wind-down preserves more value.",
        ],
        recommendations: [
          "Emergency board meeting within 72 hours. Present three scenarios: bridge financing, strategic sale, or orderly wind-down.",
          "Engage restructuring advisor immediately. Cost is justified by potential value preservation of 30-50%.",
          "Reduce burn by " + Math.round(sliderValues.burnRate * 0.5) + "% minimum within 30 days. All discretionary spend frozen effective immediately.",
        ],
      },
    };
  }, [kpiValues, sliderValues]);

  const currentInsights = insights[scenario]?.[activeTab] || [];

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab, scenario]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % currentInsights.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentInsights.length]);

  useEffect(() => {
    const text = currentInsights[currentIndex] || "";
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 12);
    return () => clearInterval(timer);
  }, [currentIndex, currentInsights]);

  const scenarioStyles: Record<string, { accent: string; glow: string }> = {
    base: { accent: "#5eead4", glow: "rgba(94, 234, 212, 0.3)" },
    upside: { accent: "#4ade80", glow: "rgba(74, 222, 128, 0.3)" },
    downside: { accent: "#fbbf24", glow: "rgba(251, 191, 36, 0.3)" },
    stress: { accent: "#f87171", glow: "rgba(248, 113, 113, 0.4)" },
  };

  const style = scenarioStyles[scenario] || scenarioStyles.base;

  const tabs = [
    { id: "commentary" as TabType, label: "Commentary", icon: MessageSquare },
    { id: "risks" as TabType, label: "Risks", icon: ShieldAlert },
    { id: "recommendations" as TabType, label: "Actions", icon: Lightbulb },
  ];

  return (
    <motion.div
      className="h-full rounded-2xl flex flex-col overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: "linear-gradient(135deg, rgba(10, 22, 40, 0.98), rgba(2, 6, 23, 0.99))",
        border: "1px solid rgba(94, 234, 212, 0.2)",
        boxShadow: "0 0 40px rgba(94, 234, 212, 0.1)",
      }}
    >
      <div className="flex items-center gap-3 p-4 border-b border-[#1a253a]">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, " + style.accent + "22, " + style.accent + "44)" }}
          animate={{ boxShadow: ["0 0 15px " + style.glow, "0 0 25px " + style.glow, "0 0 15px " + style.glow] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-5 h-5" style={{ color: style.accent }} />
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            CFO Intelligence
            <Sparkles className="w-3 h-3" style={{ color: style.accent }} />
          </div>
          <div className="text-[10px] text-slate-500">AI-Powered Financial Analysis</div>
        </div>
        {isTyping && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: style.accent }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex border-b border-[#1a253a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={"flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all " + (activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300")}
            style={{
              borderBottom: activeTab === tab.id ? "2px solid " + style.accent : "2px solid transparent",
              background: activeTab === tab.id ? style.accent + "11" : "transparent",
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + "-" + currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[12px] leading-relaxed font-mono"
            style={{ color: "rgba(148, 163, 184, 0.9)" }}
          >
            {displayedText}
            {isTyping && (
              <motion.span
                className="inline-block w-2 h-4 ml-0.5 align-middle"
                style={{ backgroundColor: style.accent }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 p-3 border-t border-[#1a253a]">
        {currentInsights.map((_, idx) => (
          <motion.div
            key={idx}
            className="w-1.5 h-1.5 rounded-full cursor-pointer"
            style={{ backgroundColor: idx === currentIndex ? style.accent : "rgba(100, 116, 139, 0.3)" }}
            whileHover={{ scale: 1.5 }}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </motion.div>
  );
}
