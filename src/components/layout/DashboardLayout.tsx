import { useMemo, useState } from "react";
import MountainEngine from "@/components/engine/MountainEngine";
import KPICard from "@/components/ui/KPICard";
import Slider from "@/components/ui/Slider";
import AIInsightsPanel from "@/components/ui/AIInsightsPanel";
import { ChevronDown } from "lucide-react";

import {
  METRICS,
  LEVERS,
  SCENARIOS,
  ScenarioId,
  LeverId,
  ScenarioDefinition,
  MetricDefinition,
  LeverDefinition,
} from "@/dashboardConfig";

import {
  LeverState,
  MetricState,
  BASELINE_METRICS,
  getInitialLeverState,
  getInitialMetricState,
  calculateMetrics,
  metricsToDataPoints,
} from "../../logic/metricsModel";

export default function DashboardLayout() {
  // --- Core state ---
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [leverState, setLeverState] = useState<LeverState>(() =>
    getInitialLeverState()
  );
  const [metricState, setMetricState] = useState<MetricState>(() =>
    getInitialMetricState("base", getInitialLeverState())
  );
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentScenario =
    SCENARIOS.find((s: ScenarioDefinition) => s.id === scenario) ?? SCENARIOS[0];

  // --- Derived visual points for the mountain ---
  const dataPoints = useMemo(
    () => metricsToDataPoints(metricState),
    [metricState]
  );

  // --- Handlers ---
  const handleScenarioChange = (nextScenario: ScenarioId) => {
    setScenario(nextScenario);
    setMetricState(() =>
      calculateMetrics(BASELINE_METRICS, leverState, nextScenario)
    );
  };

  const handleLeverChange = (leverId: LeverId, value: number) => {
    setLeverState((prev: LeverState) => {
      const next: LeverState = { ...prev, [leverId]: value };
      const nextMetrics = calculateMetrics(BASELINE_METRICS, next, scenario);
      setMetricState(nextMetrics);
      return next;
    });
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-4">
      {/* Metric cards row */}
      <div className="grid grid-cols-7 gap-4">
        {METRICS.map((metric: MetricDefinition, i: number) => (
          <KPICard
            key={metric.id}
            label={metric.label}
            value={Math.round(metricState[metric.id])}
            unit={metric.unit}
            active={activeKPIIndex === i}
            onClick={() => setActiveKPIIndex(i)}
            sparkValues={dataPoints.slice(Math.max(0, i - 5), i + 1)}
          />
        ))}
      </div>

      {/* Scenario selector */}
      <div className="relative w-64">
        <button
          onClick={() => setDropdownOpen((open) => !open)}
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
              style={{
                backgroundColor: currentScenario.color,
                boxShadow: "0 0 8px " + currentScenario.color,
              }}
            />
            <span className="text-white font-medium">
              {currentScenario.label}
            </span>
          </div>
          <ChevronDown
            className={
              "w-4 h-4 text-slate-400 transition-transform " +
              (dropdownOpen ? "rotate-180" : "")
            }
          />
        </button>

        {dropdownOpen && (
          <div
            className="absolute top-full left-0 w-full mt-2 rounded-xl border overflow-hidden z-50"
            style={{
              background: "rgba(10, 22, 40, 0.95)",
              borderColor: "rgba(94, 234, 212, 0.2)",
            }}
          >
            {SCENARIOS.map((s: ScenarioDefinition) => (
              <button
                key={s.id}
                onClick={() => {
                  handleScenarioChange(s.id);
                  setDropdownOpen(false);
                }}
                className={
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors " +
                  (scenario === s.id ? "bg-white/10" : "")
                }
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: s.color,
                    boxShadow: "0 0 8px " + s.color,
                  }}
                />
                <span className="text-white text-sm">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mountain + AI panel */}
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
            runway: metricState.runway,
            cash: metricState.cash,
            growth: metricState.growth,
            ebitda: metricState.ebitda,
            burn: metricState.burn,
            risk: metricState.risk,
            value: metricState.value,
          }}
          sliderValues={{
            revenueGrowth: leverState.revenueGrowth,
            operatingExpenses: leverState.operatingExpenses,
            hiringRate: leverState.hiringRate,
            wageIncrease: leverState.wageIncrease,
            burnRate: leverState.burnRate,
          }}
        />
      </div>

      {/* Lever sliders */}
      <div className="grid grid-cols-5 gap-4">
        {LEVERS.map((lever: LeverDefinition) => (
          <Slider
            key={lever.id}
            label={lever.label}
            value={leverState[lever.id]}
            min={lever.min}
            max={lever.max}
            step={lever.step}
            onChange={(v) => handleLeverChange(lever.id, v)}
          />
        ))}
      </div>
    </div>
  );
}
