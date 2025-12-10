import { useState } from "react";
import ScenarioDock from "@/components/ui/ScenarioDock";
import KPICard from "@/components/ui/KPICard";
import Slider from "@/components/ui/Slider";
import MountainEngine from "@/components/engine/MountainEngine";

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
            label={`KPI ${i + 1}`}
            value={Math.round(v)}
            active={activeKPIIndex === i}
            onClick={() => setActiveKPIIndex(i)}
            sparkValues={dataPoints.slice(Math.max(0, i - 5), i + 1)}
          />
        ))}
      </div>

      {/* Mountain */}
      <div className="w-full h-[420px] rounded-xl bg-[#0a1628] border border-[#1a253a] overflow-hidden">
        <MountainEngine
          dataPoints={dataPoints}
          activeKPIIndex={activeKPIIndex}
          scenario={scenario}
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
