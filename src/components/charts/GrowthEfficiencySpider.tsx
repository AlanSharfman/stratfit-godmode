import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useScenarioStore } from "@/state/scenarioStore";

export const GrowthEfficiencySpider = () => {
  const scenario = useScenarioStore((s) => s.scenario);
  const kpis = useScenarioStore((s) => s.engineResults?.[scenario]?.kpis);
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis);

  if (!kpis) return null;

  // Scenario data (bright) — uses canonical qualityScore (0-1 scaled to 0-100)
  const data = [
    { metric: "Quality", value: (kpis.qualityScore?.value ?? 0.5) * 100 },
    { metric: "LTV/CAC", value: Math.min(100, (kpis.ltvCac?.value ?? 0) * 20) },
    { metric: "Payback", value: Math.max(0, 100 - (kpis.cacPayback?.value ?? 0) * 4) },
    { metric: "Margin", value: kpis.earningsPower?.value ?? 0 },
    { metric: "Momentum", value: (kpis.momentum?.value ?? 0) / 1000 },
  ];

  // Base data (faint reference)
  const baseData = [
    { metric: "Quality", value: (baseKpis?.qualityScore?.value ?? 0.5) * 100 },
    { metric: "LTV/CAC", value: Math.min(100, (baseKpis?.ltvCac?.value ?? 0) * 20) },
    { metric: "Payback", value: Math.max(0, 100 - (baseKpis?.cacPayback?.value ?? 0) * 4) },
    { metric: "Margin", value: baseKpis?.earningsPower?.value ?? 0 },
    { metric: "Momentum", value: (baseKpis?.momentum?.value ?? 0) / 1000 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="80%">
        <PolarGrid stroke="rgba(80,200,255,0.2)" />
        <PolarAngleAxis
          dataKey="metric"
          stroke="rgba(160,220,255,0.8)"
          tick={{ fill: "rgba(160,220,255,0.8)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "rgba(160,220,255,0.5)", fontSize: 9 }}
          axisLine={false}
        />

        {/* Base (faint reference shape) */}
        <Radar
          dataKey="value"
          stroke="rgba(200,200,255,0.5)"
          fill="rgba(200,200,255,0.08)"
          strokeWidth={1}
          isAnimationActive={false}
        />

        {/* Scenario (bright animated shape) */}
        <Radar
          dataKey="value"
          stroke="cyan"
          fill="rgba(80,220,255,0.25)"
          strokeWidth={2}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-out"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default GrowthEfficiencySpider;
