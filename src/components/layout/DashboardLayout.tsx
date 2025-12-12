import { useEffect, useMemo, useState } from "react";
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
} from "@/logic/metricsModel";

import type { ScenarioRecord } from "@/types/domain";

const LOCAL_SCENARIOS_KEY = "stratfit_local_scenarios_v1";

export default function DashboardLayout() {
  // --- Core scenario engine state ---
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

  // --- Local save/load state ---
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRecord[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string>("");

  // --- Derived visual points for the mountain ---
  const dataPoints = useMemo(
    () => metricsToDataPoints(metricState),
    [metricState]
  );

  // --- Bootstrapping: load from localStorage once on mount ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(LOCAL_SCENARIOS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ScenarioRecord[];
      if (Array.isArray(parsed)) {
        setSavedScenarios(parsed);
      }
    } catch (err) {
      console.warn("Failed to load local scenarios", err);
    }
  }, []);

  const persistSavedScenarios = (next: ScenarioRecord[]) => {
    setSavedScenarios(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LOCAL_SCENARIOS_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn("Failed to persist local scenarios", err);
    }
  };

  // --- Handlers: scenario, levers, save/load ---

  const handleScenarioChange = (nextScenario: ScenarioId) => {
    setScenario(nextScenario);
    setMetricState(() =>
      calculateMetrics(BASELINE_METRICS, leverState, nextScenario)
    );
  };

  const handleLeverChange = (leverId: LeverId, value: number) => {
    setLeverState((prev) => {
      const next: LeverState = { ...prev, [leverId]: value };
      const nextMetrics = calculateMetrics(BASELINE_METRICS, next, scenario);
      setMetricState(nextMetrics);
      return next;
    });
  };

  const handleSaveScenario = () => {
    const trimmedName = newScenarioName.trim();
    const nameToUse =
      trimmedName ||
      `${currentScenario.label} – ${new Date().toLocaleString()}`;

    // Minimal ScenarioRecord aligned with domain model.
    // For now, we use placeholder IDs for company/user.
    const record: ScenarioRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      companyId: "local-demo-company",
      ownerUserId: "local-user",
      scenarioId: scenario,
      name: nameToUse,
      description: "Local snapshot (not yet synced with Supabase).",
      levers: { ...leverState },
      metricsSnapshot: {
        runway: metricState.runway,
        cash: metricState.cash,
        growth: metricState.growth,
        ebitda: metricState.ebitda,
        burn: metricState.burn,
        risk: metricState.risk,
        value: metricState.value,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };

    const next = [...savedScenarios, record];
    persistSavedScenarios(next);
    setNewScenarioName("");
    setSelectedSavedId(record.id);
  };

  const handleLoadScenario = (id: string) => {
    const record = savedScenarios.find((s) => s.id === id);
    if (!record) return;

    setSelectedSavedId(record.id);
    setScenario(record.scenarioId);

    // Restore lever & metric state from snapshot
    setLeverState(record.levers as LeverState);
    setMetricState(record.metricsSnapshot as MetricState);
    setActiveKPIIndex(null);
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
      <div className="flex flex-col gap-2 max-w-xl">
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
                    (scenario === s.id ? "bg:white/10" : "")
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

        {/* Local save / load bar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Name this scenario (optional)"
            className="flex-1 px-3 py-2 rounded-lg bg-[#0f1b34] border border-[#1e2b45] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
          />
          <button
            onClick={handleSaveScenario}
            className="px-3 py-2 rounded-lg bg-cyan-500 text-xs font-medium text-black hover:bg-cyan-400 transition-colors"
          >
            Save
          </button>
          <select
            className="px-3 py-2 rounded-lg bg-[#0f1b34] border border-[#1e2b45] text-xs text-slate-200 min-w-[180px]"
            value={selectedSavedId}
            onChange={(e) => {
              const id = e.target.value;
              if (id) handleLoadScenario(id);
            }}
          >
            <option value="">Load saved scenario…</option>
            {savedScenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
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
