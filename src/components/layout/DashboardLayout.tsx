import { useState } from "react";
import ScenarioDock from "@/components/ui/ScenarioDock";
import KPICard from "@/components/ui/KPICard";
import Slider from "@/components/ui/Slider";
import MountainEngine from "@/components/engine/MountainEngine";
import AIInsightsPanel from "@/components/ui/AIInsightsPanel";

const KPI_LABELS = ["Runway", "Cash", "Growth", "EBITDA", "Burn", "Risk", "Value"];

export default function DashboardLayout() {
  const [dataPoints, setDataPoints] = useState<number[]>([
    50, 60, 75, 80, 70, 65, 85,
  ]);

  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);

  const [scenario, setScenario] = useState<
    "base" | "upside" | "downside" | "extreme"
  >("base");

  const updateDataPoint = (index: number, value: number) => {
    setDataPoints((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">

      {/* Scenario Picker */}
      <ScenarioDock scenario={scenario} onScenarioChange={setScenario} />

      {/* KPI Cards */}
      <div className="grid grid-cols-7 gap-4">
        {dataPoints.map((v, i) => (
          <KPICard
            key={i}
            label={KPI_LABELS[i]}
            value={Math.round(v)}
            active={activeKPIIndex === i}
            onClick={() => setActiveKPIIndex(i)}
            sparkValues={dataPoints.slice(Math.max(0, i - 5), i + 1)}
          />
        ))}
      </div>

      {/* Mountain and AI Insights */}
      <div className="grid grid-cols-[1fr_320px] gap-4 h-[420px]">
        {/* Mountain Terrain - Left side */}
        <div className="rounded-xl bg-[#0a1628] border border-[#1a253a] overflow-hidden">
          <MountainEngine
            dataPoints={dataPoints}
            activeKPIIndex={activeKPIIndex}
            scenario={scenario}
          />
        </div>
        
        {/* AI Insights Panel - Right side */}
        <AIInsightsPanel
          scenario={scenario}
          kpiValues={{
            runway: dataPoints[0] ?? 50,
            cash: dataPoints[1] ?? 60,
            growth: dataPoints[2] ?? 75,
            ebitda: dataPoints[3] ?? 80,
            burn: dataPoints[4] ?? 70,
            risk: dataPoints[5] ?? 65,
            value: dataPoints[6] ?? 85
          }}
          sliderValues={{
            revenueGrowth: dataPoints[0] ?? 50,
            operatingExpenses: dataPoints[1] ?? 60,
            hiringRate: dataPoints[2] ?? 75,
            wageIncrease: dataPoints[3] ?? 80,
            burnRate: dataPoints[4] ?? 70
          }}
        />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-5 gap-4 mt-4">
        {[
          "Revenue Growth",
          "Operating Expenses",
          "Hiring Rate",
          "Wage Increase",
          "Burn Rate",
        ].map((label, i) => (
          <Slider
            key={i}
            label={label}
            value={dataPoints[i] ?? 50}
            onChange={(v) => updateDataPoint(i, v)}
          />
        ))}
      </div>
    </div>
  );
}