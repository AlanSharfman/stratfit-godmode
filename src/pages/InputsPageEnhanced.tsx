// src/pages/InputsPageEnhanced.tsx
// STRATFIT — Enhanced Inputs Page with Baseline vs Override Diff
// ✅ Deterministic, Read-Only (except store actions)

import React, { useState } from "react";
import { LEVERS, SCENARIOS, type LeverId, type ScenarioId } from "../dashboardConfig";
import { useMetricsStore } from "../state/metricsStore";
import { getInitialLeverState } from "../logic/metricsModel";
import Slider from "../components/ui/Slider";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function InputsPageEnhanced() {
  const scenario = useMetricsStore((s) => s.scenario);
  const levers = useMetricsStore((s) => s.levers);
  const setScenario = useMetricsStore((s) => s.setScenario);
  const replaceLevers = useMetricsStore((s) => s.replaceLevers);
  const recompute = useMetricsStore((s) => s.recompute);

  const baselineLevers = getInitialLeverState();
  const currentScenario = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0];

  // Local edit buffer (commit only on Apply)
  const [editBuffer, setEditBuffer] = useState<Record<LeverId, number>>(levers);
  const [isDirty, setIsDirty] = useState(false);

  const handleLeverChange = (id: LeverId, value: number) => {
    setEditBuffer((prev) => ({ ...prev, [id]: value }));
    setIsDirty(true);
  };

  const handleApply = () => {
    replaceLevers(editBuffer);
    recompute();
    setIsDirty(false);
  };

  const handleReset = () => {
    setEditBuffer(levers);
    setIsDirty(false);
  };

  const calculateDiff = (id: LeverId) => {
    const baseline = baselineLevers[id];
    const current = editBuffer[id];
    const diff = current - baseline;
    const pct = baseline !== 0 ? (diff / baseline) * 100 : 0;
    return { diff, pct, isIncrease: diff > 0, isDecrease: diff < 0 };
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a1a] via-[#0f1a2a] to-[#0a0a1a] text-white">
      <div className="mx-auto w-full max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-2">
            STRATFIT • GODMODE • INPUTS
          </div>
          <h1 className="text-3xl font-bold mb-2">Baseline vs Override Comparison</h1>
          <div className="text-sm text-white/70 leading-relaxed">
            Enterprise-grade diff view. Baseline is immutable. Scenario overrides are staged and committed explicitly.
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">
            Active Scenario
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map((s) => {
              const isActive = s.id === scenario;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setScenario(s.id as ScenarioId);
                    recompute();
                    setEditBuffer(levers);
                    setIsDirty(false);
                  }}
                  className="group relative overflow-hidden rounded-xl border p-4 transition-all duration-200"
                  style={{
                    borderColor: isActive ? `${s.color}88` : "rgba(255,255,255,0.1)",
                    backgroundColor: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    boxShadow: isActive ? `0 0 20px ${s.color}33` : "none",
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full transition-shadow"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: isActive ? `0 0 12px ${s.color}` : `0 0 6px ${s.color}66`,
                      }}
                    />
                    <div className="text-sm font-semibold text-white">
                      {s.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Baseline vs Override Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] tracking-[0.22em] uppercase text-white/45">
              Levers • {currentScenario.label}
            </div>
            <div className="flex gap-2">
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.03] text-sm text-white/70 hover:text-white transition-all"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleApply}
                disabled={!isDirty}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isDirty
                    ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isDirty ? "Apply Changes" : "No Changes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {LEVERS.map((lever) => {
              const id = lever.id as LeverId;
              const baseline = baselineLevers[id];
              const current = editBuffer[id];
              const { diff, pct, isIncrease, isDecrease } = calculateDiff(id);

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-cyan-500/30"
                >
                  {/* Header with diff indicator */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">
                        {lever.label}
                      </div>
                      <div className="text-xs text-white/50">units</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isIncrease && (
                        <div className="flex items-center gap-1 text-green-400">
                          <ArrowUp className="w-4 h-4" />
                          <span className="text-sm font-mono">+{pct.toFixed(1)}%</span>
                        </div>
                      )}
                      {isDecrease && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <ArrowDown className="w-4 h-4" />
                          <span className="text-sm font-mono">{pct.toFixed(1)}%</span>
                        </div>
                      )}
                      {!isIncrease && !isDecrease && (
                        <div className="flex items-center gap-1 text-white/40">
                          <Minus className="w-4 h-4" />
                          <span className="text-sm font-mono">Unchanged</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baseline vs Current comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                        Baseline
                      </div>
                      <div className="text-lg font-mono text-white/70 tabular-nums">
                        {baseline}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                        Override
                      </div>
                      <div
                        className={`text-lg font-mono tabular-nums ${
                          isIncrease
                            ? "text-green-400"
                            : isDecrease
                            ? "text-amber-400"
                            : "text-cyan-300"
                        }`}
                      >
                        {current}
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <Slider
                    label=""
                    value={current}
                    min={lever.min}
                    max={lever.max}
                    step={lever.step ?? 1}
                    onChange={(v: number) => handleLeverChange(id, v)}
                  />

                  {/* Visual diff bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isIncrease
                          ? "bg-green-400"
                          : isDecrease
                          ? "bg-amber-400"
                          : "bg-white/30"
                      }`}
                      style={{
                        width: `${Math.abs(pct)}%`,
                        marginLeft: isDecrease ? "0" : "50%",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Footer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs text-white/60 leading-relaxed">
            <strong className="text-white/80">CFO / Investor-Grade Clarity:</strong> Baseline
            represents your default operating model. Overrides are staged in this editor and
            committed only when you click "Apply Changes". No silent mutations. No ambiguity.
            All changes propagate deterministically to Dashboard, KPIs, Mountain, and AI.
          </div>
        </div>
      </div>
    </div>
  );
}
