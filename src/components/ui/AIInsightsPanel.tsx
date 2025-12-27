// src/components/ui/AIInsightsPanel.tsx
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { SCENARIOS, ScenarioDefinition } from "../../dashboardConfig";
import { useMetricsStore } from "../../state/metricsStore";

export default function AIInsightsPanel() {
  // ✅ STEP 4: Read from store - single source of truth
  const scenario = useMetricsStore((s) => s.scenario);
  const metrics = useMetricsStore((s) => s.metrics);
  const levers = useMetricsStore((s) => s.levers);
  
  const kpiValues = metrics;
  const sliderValues = levers;
  const scenarioMeta = SCENARIOS.find((s: ScenarioDefinition) => s.id === scenario) ?? SCENARIOS[0];
  const [isThinking, setIsThinking] = useState(false);

  // Simulate "thinking" when values change significantly
  useEffect(() => {
    setIsThinking(true);
    const timer = setTimeout(() => setIsThinking(false), 800);
    return () => clearTimeout(timer);
  }, [kpiValues.runway, kpiValues.cash, kpiValues.growth, kpiValues.burn]);

  const { headline, bullets, tags } = useMemo(() => {
    const items: string[] = [];
    const tagList: string[] = [];

    // --- Runway / burn ---
    if (kpiValues.runway < 6) {
      items.push("Runway is under 6 months – prioritise burn reduction or new capital.");
      tagList.push("Critical runway");
    } else if (kpiValues.runway < 12) {
      items.push("Runway is in the 6–12 month zone – tighten spend and extend visibility.");
      tagList.push("Watch runway");
    } else {
      items.push("Runway is healthy – you have space to invest in growth, but keep burn in check.");
      tagList.push("Comfortable runway");
    }

    // --- Growth / value ---
    if (kpiValues.growth >= 30) {
      items.push(
        "Growth is strong – focus on repeatability, unit economics and hiring ahead of demand."
      );
      tagList.push("High growth");
    } else if (kpiValues.growth <= 5) {
      items.push(
        "Growth is soft – review pricing, acquisition channels and product fit before scaling spend."
      );
      tagList.push("Low growth");
    } else {
      items.push(
        "Growth is moderate – refine your playbook and decide whether to lean into efficiency or acceleration."
      );
      tagList.push("Stable growth");
    }

    // --- Risk / operating profile ---
    if (kpiValues.risk >= 70) {
      items.push(
        "Risk score is elevated – burn, opex or execution risk is high. Consider scenario testing downside cases."
      );
      tagList.push("High risk");
    } else if (kpiValues.risk <= 30) {
      items.push(
        "Risk score is contained – keep current discipline and avoid sudden cost step-ups."
      );
      tagList.push("Disciplined profile");
    } else {
      items.push(
        "Risk is balanced – you have room to experiment, but monitor burn and hiring closely."
      );
      tagList.push("Balanced risk");
    }

    // --- Levers summary for the headline ---
    const growthBias =
      sliderValues.revenueGrowth - sliderValues.operatingExpenses - sliderValues.burnRate;

    let headlineText = "";
    if (growthBias > 20) {
      headlineText = "You’re skewed towards growth – ensure runway and risk stay within your comfort band.";
    } else if (growthBias < -10) {
      headlineText =
        "Current lever mix is defensive – conserving cash at the cost of growth. Confirm this matches your strategy.";
    } else {
      headlineText =
        "Your lever mix is fairly balanced – small adjustments to growth vs. efficiency will shift the profile.";
    }

    return {
      headline: headlineText,
      bullets: items,
      tags: tagList,
    };
  }, [kpiValues, sliderValues]);

  return (
    <div className="h-full rounded-xl bg-gradient-to-br from-[#050814] via-[#0a0f1c] to-[#050814] border-2 border-cyan-500/20 flex flex-col p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isThinking ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isThinking ? Infinity : 0, ease: "linear" }}
          >
            <Brain className={`w-5 h-5 ${isThinking ? "text-cyan-400" : "text-cyan-500"}`} />
          </motion.div>
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-cyan-400">
              AI Strategic Advisor
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {isThinking ? "Analyzing..." : "Live insights"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: scenarioMeta.color + "22",
              color: "#e5f9ff",
              border: `1px solid ${scenarioMeta.color}88`,
              boxShadow: `0 0 12px ${scenarioMeta.color}55`,
            }}
          >
            {scenarioMeta.label}
          </span>
        </div>
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <motion.div
          className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-xs text-cyan-200">Processing strategic insights...</span>
        </motion.div>
      )}

      {/* Headline */}
      <motion.div
        key={headline}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 text-sm font-medium text-slate-100 leading-relaxed"
      >
        {headline}
      </motion.div>

      {/* Bullet insights */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1 min-h-0">
        {bullets.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
            className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed"
          >
            <motion.span
              className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400"
              animate={{
                boxShadow: [
                  "0 0 8px rgba(34,211,238,0.8)",
                  "0 0 16px rgba(34,211,238,0.6)",
                  "0 0 8px rgba(34,211,238,0.8)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>{line}</span>
          </motion.div>
        ))}
      </div>

      {/* Footer metrics summary */}
      <div className="mt-4 pt-4 border-t border-cyan-500/20">
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t) => (
            <motion.span
              key={t}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-100 bg-cyan-500/20 border border-cyan-500/40"
            >
              {t}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
          <MetricChip label="Runway" value={`${kpiValues.runway.toFixed(1)} mo`} />
          <MetricChip label="Burn" value={`$${kpiValues.burn.toFixed(0)}k/m`} />
          <MetricChip label="Cash" value={`$${kpiValues.cash.toFixed(1)}m`} />
          <MetricChip label="Growth" value={`${kpiValues.growth.toFixed(1)}%`} />
          <MetricChip label="EBITDA" value={`${kpiValues.ebitda.toFixed(1)}%`} />
          <MetricChip label="Risk" value={`${kpiValues.risk.toFixed(0)}/100`} />
        </div>
      </div>
    </div>
  );
}

interface MetricChipProps {
  label: string;
  value: string;
}

function MetricChip({ label, value }: MetricChipProps) {
  return (
    <div className="flex flex-col rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 px-2 py-1.5 hover:border-cyan-500/30 transition-all">
      <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
        {label}
      </span>
      <span className="text-xs text-white font-bold tabular-nums">{value}</span>
    </div>
  );
}
