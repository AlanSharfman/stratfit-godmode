// src/components/AIStrategicAdvisor.tsx
// STRATFIT — AI Strategic Advisor Panel (Dashboard Style)

import React from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";

// ============================================================================
// BRAIN ICON
// ============================================================================
function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="1.5">
      <path d="M12 2a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 3 3h1a4 4 0 0 0 8 0h1a3 3 0 0 0 3-3v-1a3 3 0 0 0 0-6v-1a3 3 0 0 0-3-3V6a4 4 0 0 0-4-4z" />
      <circle cx="9" cy="9" r="1" fill="#00E5FF" />
      <circle cx="15" cy="9" r="1" fill="#00E5FF" />
      <circle cx="9" cy="15" r="1" fill="#00E5FF" />
      <circle cx="15" cy="15" r="1" fill="#00E5FF" />
      <path d="M9 9v6M15 9v6M9 12h6" strokeWidth="1" />
    </svg>
  );
}

// ============================================================================
// SETTINGS/FILTER ICON
// ============================================================================
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

// ============================================================================
// SCENARIO LABEL MAP
// ============================================================================
const scenarioLabels: Record<ScenarioId, string> = {
  base: "BASE CASE",
  upside: "UPSIDE",
  downside: "DOWNSIDE",
};

// ============================================================================
// AI INSIGHTS DATA (driven by scenario)
// ============================================================================
function getInsightsForScenario(scenario: ScenarioId) {
  const insightsMap: Record<ScenarioId, {
    mainInsight: string;
    bullets: string[];
    badges: string[];
    metrics: { label: string; value: string }[];
  }> = {
    base: {
      mainInsight: "Your lever mix is fairly balanced – small adjustments to growth vs. efficiency will shift the profile.",
      bullets: [
        "Runway is healthy – you have space to invest in growth, but keep burn in check.",
        "Growth is moderate – refine your playbook and decide whether to lean into efficiency or acceleration.",
      ],
      badges: ["COMFORTABLE RUNWAY", "STABLE GROWTH", "BALANCED RISK"],
      metrics: [
        { label: "RUNWAY", value: "12.0 mo" },
        { label: "BURN", value: "$204k/m" },
        { label: "CASH", value: "$2.4m" },
        { label: "GROWTH", value: "24.6%" },
        { label: "EBITDA", value: "7.7%" },
        { label: "RISK", value: "34/100" },
      ],
    },
    upside: {
      mainInsight: "Aggressive growth posture detected – burn is elevated but runway remains manageable if targets hit.",
      bullets: [
        "High growth trajectory – ensure sales efficiency metrics support the spend.",
        "Runway is tighter – monitor monthly and prepare contingency levers.",
      ],
      badges: ["GROWTH MODE", "ELEVATED BURN", "HIGHER RISK"],
      metrics: [
        { label: "RUNWAY", value: "9.2 mo" },
        { label: "BURN", value: "$312k/m" },
        { label: "CASH", value: "$2.4m" },
        { label: "GROWTH", value: "42.1%" },
        { label: "EBITDA", value: "-4.2%" },
        { label: "RISK", value: "58/100" },
      ],
    },
    downside: {
      mainInsight: "Conservative efficiency mode – extended runway with slower growth. Ideal for uncertain markets.",
      bullets: [
        "Runway is extended – you have breathing room to wait for better conditions.",
        "Growth is slower – acceptable if preserving optionality is the priority.",
      ],
      badges: ["EXTENDED RUNWAY", "CONSERVATIVE", "LOW RISK"],
      metrics: [
        { label: "RUNWAY", value: "18.4 mo" },
        { label: "BURN", value: "$142k/m" },
        { label: "CASH", value: "$2.4m" },
        { label: "GROWTH", value: "12.3%" },
        { label: "EBITDA", value: "14.8%" },
        { label: "RISK", value: "21/100" },
      ],
    },
  };

  return insightsMap[scenario] || insightsMap.base;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AIStrategicAdvisor() {
  const scenario = useScenarioStore((s) => s.scenario);
  const insights = getInsightsForScenario(scenario);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-b from-slate-950/80 to-black/90 rounded-xl border border-slate-700/40 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <BrainIcon />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-[#00E5FF]">
              AI STRATEGIC ADVISOR
            </span>
            <span className="text-xs text-cyan-400/70">Live insights</span>
          </div>
        </div>

        {/* Scenario Badge */}
        <div className="px-4 py-1.5 rounded-lg border border-slate-600/50 bg-slate-900/60 text-xs font-semibold tracking-wide text-slate-300">
          {scenarioLabels[scenario]}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN INSIGHT CARD
      ───────────────────────────────────────────────────────────────────── */}
      <div className="mx-5 mb-4">
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/60 border border-slate-700/40">
          <p className="text-sm text-slate-200 leading-relaxed pr-8">
            {insights.mainInsight}
          </p>
          <button className="absolute top-3 right-3 text-slate-500 hover:text-cyan-400 transition-colors">
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          BULLET INSIGHTS
      ───────────────────────────────────────────────────────────────────── */}
      <div className="px-5 space-y-3 mb-5">
        {insights.bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
            <p className="text-sm text-slate-300 leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          BADGES
      ───────────────────────────────────────────────────────────────────── */}
      <div className="px-5 mb-5 flex flex-wrap gap-2">
        {insights.badges.map((badge, i) => (
          <span
            key={i}
            className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold tracking-wide text-cyan-400"
          >
            {badge}
          </span>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          METRICS GRID
      ───────────────────────────────────────────────────────────────────── */}
      <div className="mt-auto px-5 pb-5">
        <div className="grid grid-cols-3 gap-px bg-slate-700/30 rounded-xl overflow-hidden border border-slate-700/40">
          {insights.metrics.map((metric, i) => (
            <div
              key={i}
              className="bg-slate-900/80 px-4 py-3 flex flex-col"
            >
              <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                {metric.label}
              </span>
              <span className="mt-1 text-base font-bold text-white">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
