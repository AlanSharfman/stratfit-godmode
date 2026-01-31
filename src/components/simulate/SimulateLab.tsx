import React from "react";

import type { MonteCarloResult, SimulationConfig } from "@/logic/monteCarloEngine";
import type { Verdict } from "@/logic/verdictGenerator";

import VerdictPanel from "./components/VerdictPanel";
import ProbabilityDistribution from "./components/ProbabilityDistribution";
import SensitivityBars from "./components/SensitivityBars";
import Narrative from "./components/Narrative";

type Phase = "idle" | "running" | "complete";

type Props = {
  phase: Phase;
  progress: number;
  iterationCount: number;
  config: SimulationConfig;
  result: MonteCarloResult | null;
  verdict: Verdict | null;
  onRun: () => void;
  isRunning: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function SimulateLab({
  phase,
  progress,
  iterationCount,
  config,
  result,
  verdict,
  onRun,
  isRunning,
}: Props) {
  return (
    <div className="w-full h-full min-h-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">SIMULATE</div>
          <div className="text-slate-100 text-lg font-semibold">Decision Lab</div>
          <div className="text-slate-400 text-xs mt-1">
            {config.iterations.toLocaleString()} futures · {config.timeHorizonMonths} months
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800/70 bg-black/25 text-slate-200 hover:bg-black/35 disabled:opacity-60"
        >
          {isRunning ? "Running…" : "Run Simulation"}
        </button>
      </div>

      <div className="mt-6">
        {phase === "idle" && (
          <div className="rounded-2xl border border-slate-800/60 bg-black/20 p-6 text-slate-300">
            <div className="text-sm font-semibold">Ready.</div>
            <div className="text-xs text-slate-400 mt-1">
              Adjust levers, then run to generate a verdict + distributions + sensitivities.
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="rounded-2xl border border-slate-800/60 bg-black/20 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-slate-200 text-sm font-semibold">Running futures</div>
                <div className="text-slate-400 text-xs mt-1">
                  Stress-testing your strategy over {config.timeHorizonMonths} months.
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {iterationCount.toLocaleString()} / {config.iterations.toLocaleString()}
              </div>
            </div>

            <div className="mt-5 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                style={{ width: `${clamp(progress, 0, 100)}%` }}
              />
            </div>

            <div className="mt-3 text-[10px] tracking-[0.22em] uppercase text-slate-500">
              Evidence generation · {Math.round(clamp(progress, 0, 100))}%
            </div>
          </div>
        )}

        {phase === "complete" && result && verdict && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 rounded-2xl border border-slate-800/60 bg-black/20 p-5">
              <VerdictPanel verdict={verdict} result={result} />
            </div>

            <div className="xl:col-span-7 rounded-2xl border border-slate-800/60 bg-black/20 p-5">
              <ProbabilityDistribution
                histogram={result.arrHistogram}
                percentiles={result.arrPercentiles}
                stats={result.arrDistribution}
              />
            </div>

            <div className="xl:col-span-6 rounded-2xl border border-slate-800/60 bg-black/20 p-5">
              <SensitivityBars factors={result.sensitivityFactors} />
            </div>

            <div className="xl:col-span-6 rounded-2xl border border-slate-800/60 bg-black/20 p-5">
              <Narrative verdict={verdict} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


