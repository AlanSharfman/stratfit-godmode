import { useEffect, useMemo, useState, useCallback } from "react";
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
  const [scenario, setScenario] = useState<ScenarioId>("base");
  
  const [leverState, setLeverState] = useState<LeverState>(() => {
    try { 
      return getInitialLeverState(); 
    } catch { 
      return { revenueGrowth: 20, operatingExpenses: 15, hiringRate: 10, wageIncrease: 5, burnRate: 25 }; 
    }
  });
  
  const [metricState, setMetricState] = useState<MetricState>(() => {
    try { 
      return getInitialMetricState("base", getInitialLeverState()); 
    } catch { 
      return { runway: 12, cash: 2, growth: 25, ebitda: 10, burn: 200, risk: 45, value: 10 }; 
    }
  });
  
  const [activeKPIIndex, setActiveKPIIndex] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRecord[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string>("");

  const currentScenario = useMemo(() => {
    return SCENARIOS?.find((s: ScenarioDefinition) => s.id === scenario) ?? { id: "base", label: "Base Case", color: "#22d3ee" };
  }, [scenario]);

  const dataPoints = useMemo(() => {
    try { 
      return metricsToDataPoints(metricState); 
    } catch { 
      return [0.5, 0.6, 0.7, 0.6, 0.5, 0.6, 0.5]; 
    }
  }, [metricState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCAL_SCENARIOS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ScenarioRecord[];
        if (Array.isArray(parsed)) setSavedScenarios(parsed);
      }
    } catch (err) { 
      console.warn("Failed to load scenarios", err); 
    }
  }, []);

  const persistSavedScenarios = useCallback((next: ScenarioRecord[]) => {
    setSavedScenarios(next);
    try { 
      window.localStorage.setItem(LOCAL_SCENARIOS_KEY, JSON.stringify(next)); 
    } catch (err) { 
      console.warn("Failed to persist scenarios", err); 
    }
  }, []);

  const handleScenarioChange = useCallback((nextScenario: ScenarioId) => {
    setScenario(nextScenario);
    try { 
      setMetricState(calculateMetrics(BASELINE_METRICS, leverState, nextScenario)); 
    } catch (err) { 
      console.warn("Failed to calculate metrics", err); 
    }
  }, [leverState]);

  const handleLeverChange = useCallback((leverId: LeverId, value: number) => {
    setLeverState((prev) => {
      const next: LeverState = { ...prev, [leverId]: value };
      try { 
        setMetricState(calculateMetrics(BASELINE_METRICS, next, scenario)); 
      } catch (err) { 
        console.warn("Failed to calculate metrics", err); 
      }
      return next;
    });
  }, [scenario]);

  const handleSaveScenario = useCallback(() => {
    const nameToUse = newScenarioName.trim() || `${currentScenario.label} – ${new Date().toLocaleString()}`;
    const record: ScenarioRecord = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      companyId: "local-demo-company",
      ownerUserId: "local-user",
      scenarioId: scenario,
      name: nameToUse,
      description: "Local snapshot",
      levers: { ...leverState },
      metricsSnapshot: { ...metricState },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    };
    persistSavedScenarios([...savedScenarios, record]);
    setNewScenarioName("");
    setSelectedSavedId(record.id);
  }, [newScenarioName, currentScenario.label, scenario, leverState, metricState, savedScenarios, persistSavedScenarios]);

  const handleLoadScenario = useCallback((id: string) => {
    const record = savedScenarios.find((s) => s.id === id);
    if (!record) return;
    setSelectedSavedId(record.id);
    setScenario(record.scenarioId);
    setLeverState(record.levers as LeverState);
    setMetricState(record.metricsSnapshot as MetricState);
    setActiveKPIIndex(null);
  }, [savedScenarios]);

  const safeMetrics = METRICS ?? [];
  const safeLevers = LEVERS ?? [];
  const safeScenarios = SCENARIOS ?? [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#070b12] text-white p-6 gap-5">
      
      {/* ROW 1: KPI Cards */}
      <div className="grid grid-cols-7 gap-3">
        {safeMetrics.map((metric: MetricDefinition, i: number) => (
          <KPICard
            key={metric.id}
            title={metric.label}
            value={`${Math.round(metricState?.[metric.id] ?? 0)}${metric.unit ? ` ${metric.unit}` : ""}`}
            index={i}
            activeIndex={activeKPIIndex}
            onActivate={setActiveKPIIndex}
            onDeactivate={() => setActiveKPIIndex(null)}
            onSelect={setActiveKPIIndex}
          />
        ))}
      </div>

      {/* ROW 2: Scenario Selector + Save/Load */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border min-w-[180px] transition-all"
            style={{ 
              background: "rgba(10,22,40,0.8)", 
              borderColor: (currentScenario.color ?? "#22d3ee") + "44",
              boxShadow: "0 0 20px " + (currentScenario.color ?? "#22d3ee") + "22"
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ 
                  backgroundColor: currentScenario.color ?? "#22d3ee",
                  boxShadow: "0 0 8px " + (currentScenario.color ?? "#22d3ee")
                }} 
              />
              <span className="text-white font-medium text-sm">{currentScenario.label ?? "Base Case"}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {dropdownOpen && (
            <div 
              className="absolute top-full left-0 w-full mt-2 rounded-xl border overflow-hidden z-50" 
              style={{ background: "rgba(10,22,40,0.95)", borderColor: "rgba(94,234,212,0.2)" }}
            >
              {safeScenarios.map((s: ScenarioDefinition) => (
                <button 
                  key={s.id} 
                  onClick={() => { handleScenarioChange(s.id); setDropdownOpen(false); }} 
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${scenario === s.id ? "bg-white/10" : ""}`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: "0 0 8px " + s.color }} />
                  <span className="text-white text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <input 
          type="text" 
          placeholder="Name this scenario (optional)" 
          className="px-3 py-2 rounded-lg bg-[#0f1b34] border border-[#1e2b45] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-64" 
          value={newScenarioName} 
          onChange={(e) => setNewScenarioName(e.target.value)} 
        />
        <button 
          onClick={handleSaveScenario} 
          className="px-4 py-2 rounded-lg bg-cyan-500 text-sm font-medium text-black hover:bg-cyan-400 transition-colors"
        >
          Save
        </button>
        <select 
          className="px-3 py-2 rounded-lg bg-[#0f1b34] border border-[#1e2b45] text-sm text-slate-200 min-w-[200px] cursor-pointer" 
          value={selectedSavedId} 
          onChange={(e) => { if (e.target.value) handleLoadScenario(e.target.value); }}
        >
          <option value="">Load saved scenario…</option>
          {savedScenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* ROW 3: Sliders (left) + Mountain (right) */}
      <div className="flex gap-5 flex-1 min-h-[400px]">
        
        {/* LEFT: Sliders */}
        <div className="w-72 flex-shrink-0 rounded-xl bg-[#0a1628]/80 border border-[#1a253a] p-5 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Levers</h3>
          <div className="flex flex-col gap-6 flex-1">
            {safeLevers.map((lever: LeverDefinition) => (
              <Slider 
                key={lever.id} 
                label={lever.label} 
                value={leverState?.[lever.id] ?? 0} 
                min={lever.min ?? 0} 
                max={lever.max ?? 100} 
                step={lever.step ?? 1} 
                onChange={(v) => handleLeverChange(lever.id, v)} 
              />
            ))}
          </div>
        </div>
        
        {/* RIGHT: Mountain */}
        <div className="flex-1 rounded-xl bg-[#0a1628] border border-[#1a253a] overflow-hidden">
          <MountainEngine 
            dataPoints={dataPoints} 
            activeKPIIndex={activeKPIIndex} 
            scenario={scenario} 
          />
        </div>
      </div>

      {/* ROW 4: AI Insights */}
      <div className="w-full">
        <AIInsightsPanel 
          scenario={scenario} 
          kpiValues={{ 
            runway: metricState?.runway ?? 0, 
            cash: metricState?.cash ?? 0, 
            growth: metricState?.growth ?? 0, 
            ebitda: metricState?.ebitda ?? 0, 
            burn: metricState?.burn ?? 0, 
            risk: metricState?.risk ?? 0, 
            value: metricState?.value ?? 0 
          }} 
          sliderValues={{ 
            revenueGrowth: leverState?.revenueGrowth ?? 0, 
            operatingExpenses: leverState?.operatingExpenses ?? 0, 
            hiringRate: leverState?.hiringRate ?? 0, 
            wageIncrease: leverState?.wageIncrease ?? 0, 
            burnRate: leverState?.burnRate ?? 0 
          }} 
        />
      </div>
    </div>
  );
}
