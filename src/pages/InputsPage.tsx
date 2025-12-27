// src/pages/InputsPage.tsx
// STRATFIT — Inputs Page
// ✅ RULE: No local state. Reads/writes ONLY via metricsStore.
// This guarantees sync with KPIs, Mountain, and AI.

import React from "react";
import { LEVERS, SCENARIOS, type LeverId, type ScenarioId } from "../dashboardConfig";
import { useMetricsStore } from "../state/metricsStore";
import Slider from "../components/ui/Slider";

export default function InputsPage() {
  const scenario = useMetricsStore((s) => s.scenario);
  const levers = useMetricsStore((s) => s.levers);
  const setScenario = useMetricsStore((s) => s.setScenario);
  const setLever = useMetricsStore((s) => s.setLever);
  const recompute = useMetricsStore((s) => s.recompute);

  const currentScenario = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0a0a1a] via-[#0f1a2a] to-[#0a0a1a] text-white">
      <div className="mx-auto w-full max-w-6xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-2">
            STRATFIT • GODMODE
          </div>
          <h1 className="text-3xl font-bold mb-2">Inputs & Levers</h1>
          <div className="text-sm text-white/70 leading-relaxed">
            Adjust levers and scenario. KPIs, Mountain, and AI update everywhere instantly.
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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

        {/* Levers Grid */}
        <div className="mb-8">
          <div className="text-[11px] tracking-[0.22em] uppercase text-white/45 mb-4">
            Levers • {currentScenario.label}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LEVERS.map((lever) => {
              const id = lever.id as LeverId;
              const value = levers[id];

              return (
                <div
                  key={id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-cyan-500/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">
                      {lever.label}
                    </div>
                    <div className="text-lg font-mono text-cyan-300 tabular-nums">
                      {value}
                    </div>
                  </div>

                  <Slider
                    label={lever.label}
                    value={value}
                    min={lever.min}
                    max={lever.max}
                    step={lever.step ?? 1}
                    onChange={(v: number) => {
                      setLever(id, v);
                      recompute();
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Footer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs text-white/60 leading-relaxed">
            <strong className="text-white/80">Single Source of Truth:</strong> All changes
            here instantly propagate to the Dashboard, KPI Console, Mountain Engine, and AI
            Insights. No manual sync required. No state desync possible.
          </div>
        </div>
      </div>
    </div>
  );
}
