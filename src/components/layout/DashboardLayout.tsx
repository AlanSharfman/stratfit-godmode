import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import MountainEngine from "../engine/MountainEngine";
import Slider from "../ui/Slider";
import AIInsightsPanel from "../ui/AIInsightsPanel";
import KPIConsole from "../KPIConsole";
import OnboardingTourV2 from "../OnboardingTourV2";

import { METRICS, LEVERS, SCENARIOS } from "../../dashboardConfig";
import type { ScenarioId, LeverId } from "../../dashboardConfig";

import { useMetricsStore } from "../../state/metricsStore";
import { useUIStore } from "../../state/uiStore";

import { ChevronDown, Sparkles, Layers, Activity, BarChart3 } from "lucide-react";

const EASE_LUX = "cubic-bezier(0.22,1,0.36,1)";

type TabId = "terrain" | "variances" | "actuals";

const TAB_DEFS: Array<{ id: TabId; label: string; Icon: React.ComponentType<any> }> = [
  { id: "terrain", label: "Terrain", Icon: Layers },
  { id: "variances", label: "Variances", Icon: Activity },
  { id: "actuals", label: "Actuals", Icon: BarChart3 },
];

const LOCAL_SCENARIOS_KEY = "stratfit_local_scenarios_v1";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function EmptyStateCard(props: { title: string; body: string; hint?: string; rightTag?: string }) {
  const { title, body, hint, rightTag } = props;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/55">{title}</div>
          <div className="mt-2 text-sm text-white/80 leading-relaxed whitespace-pre-line">
            {body}
          </div>
          {hint ? <div className="mt-3 text-xs text-white/55 leading-relaxed">{hint}</div> : null}
        </div>
        {rightTag ? (
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] tracking-[0.16em] uppercase text-white/60">
            {rightTag}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  // ---------------------------------------------------------------------------
  // SINGLE SOURCE OF TRUTH - Store only (✅ Use shallow for batch reads)
  // ---------------------------------------------------------------------------
  const { scenario, levers, metrics, dataPoints, focusedMetric, comparisonMode, comparisonData } = useMetricsStore(
    useShallow((s) => ({
      scenario: s.scenario,
      levers: s.levers,
      metrics: s.metrics,
      dataPoints: s.dataPoints,
      focusedMetric: s.focusedMetric,
      comparisonMode: s.comparisonMode,
      comparisonData: s.comparisonData,
    }))
  );

  const setScenario = useMetricsStore((s) => s.setScenario);
  const setLever = useMetricsStore((s) => s.setLever);
  const replaceLevers = useMetricsStore((s) => s.replaceLevers);
  const recompute = useMetricsStore((s) => s.recompute);
  const toggleComparisonMode = useMetricsStore((s) => s.toggleComparisonMode);

  // Active KPI selection from UI store
  const activeMetricId = useUIStore((s) => s.activeMetricId);
  
  // STEP 3: Use focusedMetric for Mountain interaction (hover/click)
  const activeKPIIndex = focusedMetric ? METRICS.findIndex((m) => m.id === focusedMetric) : null;

  // UI state only
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("terrain");

  // Local save/load
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [selectedSavedId, setSelectedSavedId] = useState<string>("");

  const currentScenario = useMemo(() => {
    return (SCENARIOS as any[]).find((s) => s.id === scenario) ?? (SCENARIOS as any[])[0];
  }, [scenario]);

  // ---------------------------------------------------------------------------
  // Boot: load saved scenarios
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_SCENARIOS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedScenarios(parsed);
    } catch {
      // ignore
    }
  }, []);

  const persistSavedScenarios = useCallback((next: any[]) => {
    setSavedScenarios(next);
    try {
      window.localStorage.setItem(LOCAL_SCENARIOS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers - Store only
  // ---------------------------------------------------------------------------
  const handleScenarioChange = useCallback(
    (nextScenario: ScenarioId) => {
      setScenario(nextScenario);
      recompute();
    },
    [setScenario, recompute]
  );

  const handleLeverChange = useCallback(
    (leverId: LeverId, value: number) => {
      setLever(leverId, value);
      recompute();
    },
    [setLever, recompute]
  );

  const handleSaveScenario = useCallback(() => {
    const trimmedName = newScenarioName.trim();
    const nameToUse = trimmedName || `${currentScenario?.label ?? "Scenario"} – ${new Date().toLocaleString()}`;

    const record = {
      id: `scn_${Date.now()}`,
      scenarioId: scenario,
      name: nameToUse,
      levers: { ...levers },
      metricsSnapshot: { ...metrics },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = [...savedScenarios, record];
    persistSavedScenarios(next);
    setNewScenarioName("");
    setSelectedSavedId(record.id);
  }, [currentScenario, levers, metrics, newScenarioName, persistSavedScenarios, savedScenarios, scenario]);

  const handleLoadScenario = useCallback(
    (id: string) => {
      const record = savedScenarios.find((s) => s.id === id);
      if (!record) return;

      setSelectedSavedId(record.id);
      setScenario(record.scenarioId as ScenarioId);
      replaceLevers(record.levers);
      recompute();
    },
    [savedScenarios, setScenario, replaceLevers, recompute]
  );

  // ---------------------------------------------------------------------------
  // Tabs keyboard support
  // ---------------------------------------------------------------------------
  const onTabsKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = TAB_DEFS.findIndex((t) => t.id === activeTab);
      if (idx < 0) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveTab(TAB_DEFS[(idx + 1) % TAB_DEFS.length].id);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveTab(TAB_DEFS[(idx - 1 + TAB_DEFS.length) % TAB_DEFS.length].id);
      }
    },
    [activeTab]
  );

  return (
    <div className="relative flex flex-col w-full h-full p-6 gap-5">
      {/* Tour overlay */}
      {showTour && <OnboardingTourV2 onComplete={() => setShowTour(false)} />}

      {/* Take the Tour button */}
      {!showTour && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setShowTour(true)}
            className={cx(
              "flex items-center gap-2",
              "px-4 py-2 rounded-xl",
              "bg-gradient-to-r from-cyan-300 to-teal-200",
              "text-[13px] font-semibold text-black",
              "shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30",
              "transition-all duration-200"
            )}
            style={{ transitionTimingFunction: EASE_LUX }}
          >
            <Sparkles className="w-4 h-4" />
            Take the Tour
          </button>
        </div>
      )}

      {/* Top row: KPI console + Scenario block */}
      <div className="flex items-end justify-between gap-6">
        <div data-tour="kpis" className="flex-1">
          <KPIConsole />
        </div>

        <div data-tour="scenario" className="flex flex-col gap-3 w-[340px]">
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/45">Scenario</div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all"
              style={{
                background: "rgba(10, 22, 40, 0.72)",
                borderColor: (currentScenario?.color ?? "#7dd3fc") + "44",
                boxShadow: "0 0 18px " + (currentScenario?.color ?? "#7dd3fc") + "1A",
                transitionTimingFunction: EASE_LUX,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: currentScenario?.color ?? "#7dd3fc",
                    boxShadow: "0 0 10px " + (currentScenario?.color ?? "#7dd3fc") + "66",
                  }}
                />
                <span className="text-white text-sm font-medium">{currentScenario?.label ?? "Base"}</span>
              </div>

              <ChevronDown
                className={cx("w-4 h-4 text-slate-300 transition-transform", dropdownOpen && "rotate-180")}
                style={{ transitionTimingFunction: EASE_LUX }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute top-full left-0 w-full mt-2 rounded-2xl border overflow-hidden z-50"
                style={{
                  background: "rgba(10, 22, 40, 0.92)",
                  borderColor: "rgba(255,255,255,0.10)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
                }}
              >
                {(SCENARIOS as any[]).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleScenarioChange(s.id as ScenarioId);
                      setDropdownOpen(false);
                    }}
                    className={cx(
                      "w-full flex items-center gap-3 px-4 py-3",
                      "hover:bg-white/5 transition-colors",
                      scenario === s.id && "bg-white/7"
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: "0 0 10px " + s.color + "55",
                      }}
                    />
                    <span className="text-white text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phase 3: Comparison Mode Toggle */}
          <button
            onClick={() => {
              toggleComparisonMode();
              if (!comparisonMode) recompute(); // Trigger computation when enabling
            }}
            className={cx(
              "w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all",
              comparisonMode
                ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-300"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.05]"
            )}
            style={{ transitionTimingFunction: EASE_LUX }}
          >
            {comparisonMode ? "✓ Compare Mode" : "Compare Scenarios"}
          </button>

          <div data-tour="save" className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Name this scenario (optional)"
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-300/50"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
            />
            <button
              onClick={handleSaveScenario}
              className="px-3 py-2 rounded-xl bg-cyan-300 text-xs font-semibold text-black hover:bg-cyan-200 transition-colors"
              style={{ transitionTimingFunction: EASE_LUX }}
            >
              Save
            </button>
          </div>

          <select
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-200"
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

      {/* Tabs bar */}
      <div className="flex items-center justify-between" data-tour="tabs">
        <div
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1"
          role="tablist"
          aria-label="Center view"
          tabIndex={0}
          onKeyDown={onTabsKeyDown}
        >
          {TAB_DEFS.map(({ id, label, Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(id)}
                className={cx(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  active ? "text-white" : "text-white/65 hover:text-white/85"
                )}
                style={{
                  transitionTimingFunction: EASE_LUX,
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
                  boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.10)" : "none",
                }}
              >
                <Icon className={cx("w-4 h-4", active ? "opacity-100" : "opacity-75")} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] tracking-[0.22em] uppercase text-white/45">
          Executive cockpit • stable build
        </div>
      </div>

      {/* Center: Mountain + AI / placeholders */}
      <div className="grid grid-cols-[1fr_420px] gap-6 h-[480px]">
        <div className="h-full">
          {activeTab === "terrain" ? (
            <div
              data-tour="mountain"
              className="h-full rounded-2xl bg-[#0a1628] border border-white/10 overflow-hidden"
              style={{ boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}
            >
              <MountainEngine
                dataPoints={dataPoints}
                activeKPIIndex={activeKPIIndex}
                scenario={scenario}
                comparisonMode={comparisonMode}
                comparisonData={comparisonData}
              />
            </div>
          ) : activeTab === "variances" ? (
            <div className="h-full flex flex-col gap-4">
              <EmptyStateCard
                title="Variances"
                rightTag="MVP Next"
                body={"This view will show how each lever move changes outcomes vs Base — with waterfall deltas and sensitivity."}
                hint={"For now, use Terrain to see real-time impact. Next rollout: variance decomposition + per-lever contribution."}
              />
              <EmptyStateCard
                title="What you’ll see here"
                body={"• Delta waterfall (Runway, Cash, Risk, Value)\n• Biggest drivers ranked\n• AI explanation: “why it moved”"}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4">
              <EmptyStateCard
                title="Actuals"
                rightTag="Coming Soon"
                body={"Actuals will connect to your accounting/ERP feeds and compare Real vs Plan in the cockpit."}
                hint={"Next rollout: data connectors + baseline plan import + variance alerts."}
              />
              <EmptyStateCard
                title="Coming Soon"
                body={"• Strategic Management layer\n• Cascading strategy & scorecards\n• Vertical expansions\n• Notebook/video outputs"}
              />
            </div>
          )}
        </div>

        <div data-tour="ai" className="h-full">
          {/* AI Insights Panel - locked height container */}
          <div className="h-[480px] overflow-hidden">
            <AIInsightsPanel />
          </div>
        </div>
      </div>

      {/* Sliders deck */}
      <div data-tour="sliders" className="grid grid-cols-5 gap-4">
        {(LEVERS as any[]).map((lever) => (
          <Slider
            key={lever.id}
            label={lever.label}
            value={levers[lever.id as LeverId]}
            min={lever.min}
            max={lever.max}
            step={lever.step}
            onChange={(v: number) => handleLeverChange(lever.id as LeverId, v)}
          />
        ))}
      </div>
    </div>
  );
}
