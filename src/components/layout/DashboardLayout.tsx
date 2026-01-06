import { useState } from "react";
import KPICard from "@/components/ui/KPICard";
import Slider from "@/components/ui/Slider";
import MountainEngine from "@/components/engine/MountainEngine";
import AIInsightsPanel from "@/components/ui/AIInsightsPanel";
import { ChevronDown } from "lucide-react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const KPI_LABELS = ["Runway", "Cash", "Growth", "EBITDA", "Burn", "Risk", "Value"];
const SCENARIOS = [
  { id: "base", label: "Base Case", color: "#5eead4" },
  { id: "upside", label: "Upside", color: "#4ade80" },
  { id: "downside", label: "Downside", color: "#fbbf24" },
  { id: "extreme", label: "Extreme", color: "#f87171" },
] as const;

export default function DashboardLayout() {
  const [dataPoints, setDataPoints] = useState<number[]>([50, 60, 75, 80, 70, 65, 85]);
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [scenario, setScenario] = useState<"base" | "upside" | "downside" | "extreme">("base");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentScenario = SCENARIOS.find(s => s.id === scenario) || SCENARIOS[0];

  const updateDataPoint = (index: number, value: number) => {
    setDataPoints((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-4">
      <div className="fixed top-3 left-3 z-[99999] rounded-lg border border-[#00b4ff]/30 bg-[#071225]/80 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#bfefff] backdrop-blur">
        LOCAL — DASHBOARDLAYOUT — 2026-01-06
      </div>
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

      <div className="relative w-64">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
          style={{
            background: "rgba(10, 22, 40, 0.8)",
            borderColor: currentScenario.color + "44",
            boxShadow: "0 0 20px " + currentScenario.color + "22",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentScenario.color, boxShadow: "0 0 8px " + currentScenario.color }}
            />
            <span className="text-white font-medium">{currentScenario.label}</span>
          </div>
          <ChevronDown
            className={"w-4 h-4 text-slate-400 transition-transform " + (dropdownOpen ? "rotate-180" : "")}
          />
        </button>

        {dropdownOpen && (
          <div
            className="absolute top-full left-0 w-full mt-2 rounded-xl border overflow-hidden z-50"
            style={{ background: "rgba(10, 22, 40, 0.95)", borderColor: "rgba(94, 234, 212, 0.2)" }}
          >
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setScenario(s.id);
                  setDropdownOpen(false);
                }}
                className={"w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors " + (scenario === s.id ? "bg-white/10" : "")}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.color, boxShadow: "0 0 8px " + s.color }}
                />
                <span className="text-white text-sm">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-6 h-[420px]">
        <div className="rounded-xl bg-[#0a1628] border border-[#1a253a] overflow-hidden">
          <MountainEngine
            dataPoints={dataPoints}
            activeKPIIndex={activeKPIIndex}
            scenario={scenario}
          />
        </div>

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

      <div className="grid grid-cols-5 gap-4">
        {["Revenue Growth", "Operating Expenses", "Hiring Rate", "Wage Increase", "Burn Rate"].map((label, i) => (
          <Slider
            key={i}
            label={label}
            value={dataPoints[i] ?? 50}
            onChange={(v) => updateDataPoint(i, v)}
          />
        ))}
      </div>

      {/* Onboarding Overlay (localStorage-gated internally) */}
      <OnboardingFlow />
    </div>
  );
}
