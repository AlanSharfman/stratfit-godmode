// src/components/ui/AIInsightsPanel.tsx
import { useMemo } from "react";
import { SCENARIOS, ScenarioId, ScenarioDefinition } from "@/dashboardConfig";

interface KPIValues {
  runway: number;
  cash: number;
  growth: number;
  ebitda: number;
  burn: number;
  risk: number;
  value: number;
}

interface SliderValues {
  revenueGrowth: number;
  operatingExpenses: number;
  hiringRate: number;
  wageIncrease: number;
  burnRate: number;
}

interface AIInsightsPanelProps {
  scenario: ScenarioId;
  kpiValues: KPIValues;
  sliderValues: SliderValues;
}

export default function AIInsightsPanel({
  scenario,
  kpiValues,
  sliderValues,
}: AIInsightsPanelProps) {
  const scenarioMeta = SCENARIOS.find((s: ScenarioDefinition) => s.id === scenario) ?? SCENARIOS[0];

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
    <div className="h-full rounded-xl bg-[#050814] border border-[#1a253a] flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Scenario Insights
          </div>
          <div className="text-sm text-slate-300">
            Live, rule-based commentary. (AI model wiring comes next.)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Scenario</span>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: scenarioMeta.color + "22",
              color: "#e5f9ff",
              boxShadow: `0 0 10px ${scenarioMeta.color}55`,
            }}
          >
            {scenarioMeta.label}
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-slate-100">
        {headline}
      </div>

      {/* Bullet insights */}
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {bullets.map((line, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-slate-200">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span>{line}</span>
          </div>
        ))}
      </div>

      {/* Footer metrics summary */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className="px-2 py-1 rounded-full text-[11px] text-cyan-100 bg-cyan-500/10 border border-cyan-500/30"
            >
              {t}
            </span>
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
    <div className="flex flex-col rounded-lg bg-white/5 px-2 py-1">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-xs text-slate-100 font-medium">{value}</span>
    </div>
  );
}
