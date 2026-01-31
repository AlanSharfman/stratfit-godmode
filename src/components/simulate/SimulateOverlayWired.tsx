// src/components/simulate/SimulateOverlayWired.tsx
// STRATFIT — Monte Carlo Simulation Overlay (Wired to Store)
// GOD MODE SIMULATE: Verdict Chamber (Founder-first, institutional)

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RefreshCw, Save, Check, Star, Download, X } from "lucide-react";
import { useSimulationStore } from "@/state/simulationStore";
import { useSavedSimulationsStore } from "@/state/savedSimulationsStore";
import { useScenarioStore, type LeverSnapshot } from "@/state/scenarioStore";
import { useLeverStore } from "@/state/leverStore";
import { useStrategicDeclarationStore } from "@/stores/strategicDeclarationStore";
import { compileStrategicDeclaration } from "@/logic/strategicCompiler";

import {
  type MonteCarloResult,
  type LeverState,
  type SimulationConfig,
  runSingleSimulation,
  processSimulationResults,
} from "@/logic/monteCarloEngine";
import { generateVerdict, type Verdict } from "@/logic/verdictGenerator";

// Sub-components (kept)
import VerdictPanel from "./VerdictPanel";
import ProbabilityDistribution from "./ProbabilityDistribution";
import ConfidenceFan from "./ConfidenceFan";
import ScenarioCards from "./ScenarioCards";
import SensitivityBars from "./SensitivityBars";
import SimulateNarrative from "./SimulateNarrative";

// Save/Load components
import LoadScenarioDropdown from "../simulation/LoadScenarioDropdown";

interface SimulateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  levers: LeverState;
}

type SimulationPhase = "idle" | "running" | "complete";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtMoneyShort(v: number) {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtPct0to1(p: number) {
  if (!Number.isFinite(p)) return "—";
  return `${Math.round(clamp(p, 0, 1) * 100)}%`;
}

function safe(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export default function SimulateOverlayWired({ isOpen, onClose, levers }: SimulateOverlayProps) {
  const [phase, setPhase] = useState<SimulationPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  // Stores
  const { setSimulationResult, startSimulation: storeStartSimulation } = useSimulationStore();

  // Strategic Declaration (if locked, it overrides levers/config via compiler)
  const buildPayload = useStrategicDeclarationStore((s) => s.buildPayload);
  const declarationLocked = useStrategicDeclarationStore((s) => s.locked);

  const saveSimulation = useSavedSimulationsStore((s) => s.saveSimulation);
  const setAsBaseline = useSavedSimulationsStore((s) => s.setAsBaseline);
  const savedSimulations = useSavedSimulationsStore((s) => s.simulations);

  const saveAsBaselineToScenario = useScenarioStore((s) => s.saveAsBaseline);
  const saveScenarioToStore = useScenarioStore((s) => s.saveScenario);
  const hasLegacyBaseline = useScenarioStore((s) => s.baseline !== null);

  const setLevers = useLeverStore((s) => s.setLevers);

  // Simulation config (locked defaults for MVP demo)
  const config: SimulationConfig = useMemo(
    () => ({
      iterations: 10000,
      timeHorizonMonths: 36,
      startingCash: 4000000,
      startingARR: 4800000,
      monthlyBurn: 47000,
    }),
    []
  );

  // If a Strategic Declaration is locked, compile it into engine levers + config.
  const compiled = useMemo(() => {
    if (!declarationLocked) return null;
    const payload = buildPayload();
    if (!payload) return null;
    try {
      return compileStrategicDeclaration(payload);
    } catch {
      return null;
    }
  }, [declarationLocked, buildPayload]);

  const simLevers: LeverState = compiled?.levers ?? levers;
  const simConfig: SimulationConfig = compiled?.config ?? config;

  // Baseline existence
  const hasBaseline = useMemo(() => {
    const savedBaseline = savedSimulations.find((s) => s.isBaseline);
    return !!savedBaseline || hasLegacyBaseline;
  }, [savedSimulations, hasLegacyBaseline]);

  // Convert levers to snapshot (this snapshot MUST match the levers used for the run)
  const leversAsSnapshot = useMemo(
    (): LeverSnapshot => ({
      demandStrength: simLevers.demandStrength,
      pricingPower: simLevers.pricingPower,
      expansionVelocity: simLevers.expansionVelocity,
      costDiscipline: simLevers.costDiscipline,
      hiringIntensity: simLevers.hiringIntensity,
      operatingDrag: simLevers.operatingDrag,
      marketVolatility: simLevers.marketVolatility,
      executionRisk: simLevers.executionRisk,
      fundingPressure: simLevers.fundingPressure,
    }),
    [simLevers]
  );

  // Run simulation with progress (institutional, no toy spinner UI)
  const runSimulation = useCallback(async () => {
    setPhase("running");
    setProgress(0);
    setIterationCount(0);
    setResult(null);
    setVerdict(null);
    storeStartSimulation();

    const startTime = performance.now();
    const CHUNK_SIZE = 500;
    const allSimulations: any[] = [];

    for (let i = 0; i < simConfig.iterations; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, simConfig.iterations);

      for (let j = i; j < chunkEnd; j++) {
        allSimulations.push(runSingleSimulation(j, simLevers, simConfig));
      }

      const currentProgress = (allSimulations.length / simConfig.iterations) * 100;
      setProgress(currentProgress);
      setIterationCount(allSimulations.length);

      // yield to UI
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const executionTimeMs = performance.now() - startTime;
    const simResult = processSimulationResults(allSimulations, simConfig, simLevers, executionTimeMs);
    const simVerdict = generateVerdict(simResult);

    setProgress(100);
    setResult(simResult);
    setVerdict(simVerdict);

    // Store in simulation store (snapshot must match the levers used for this run)
    setSimulationResult(simResult, simVerdict, simLevers);

    setTimeout(() => setPhase("complete"), 150);
  }, [simConfig, simLevers, setSimulationResult, storeStartSimulation]);

  // SAVE AS BASELINE
  const handleSaveAsBaseline = useCallback(() => {
    if (!result || !verdict) return;

    setSaveState("saving");

    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1) Save to savedSimulationsStore
    const saved = saveSimulation({
      name: `Baseline (${timestamp})`,
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: leversAsSnapshot,
      summary: {
        survivalRate: result.survivalRate,
        survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
        arrMedian: result.arrPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP90: result.arrPercentiles.p90,
        runwayMedian: result.runwayPercentiles.p50,
        runwayP10: result.runwayPercentiles.p10,
        runwayP90: result.runwayPercentiles.p90,
        cashMedian: result.cashPercentiles.p50,
        cashP10: result.cashPercentiles.p10,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating,
      },
      isBaseline: true,
    });

    if (saved?.id) setAsBaseline(saved.id);

    // 2) Also save to scenarioStore (enables COMPARE/RISK/DECISION)
    saveAsBaselineToScenario(`Baseline (${timestamp})`, leversAsSnapshot, {
      survivalRate: result.survivalRate,
      medianARR: result.arrPercentiles.p50,
      medianRunway: result.runwayPercentiles.p50,
      medianCash: result.cashPercentiles.p50,
      arrP10: result.arrPercentiles.p10,
      arrP50: result.arrPercentiles.p50,
      arrP90: result.arrPercentiles.p90,
      runwayP10: result.runwayPercentiles.p10,
      runwayP50: result.runwayPercentiles.p50,
      runwayP90: result.runwayPercentiles.p90,
      cashP10: result.cashPercentiles.p10,
      cashP50: result.cashPercentiles.p50,
      cashP90: result.cashPercentiles.p90,
      overallScore: verdict.overallScore,
      overallRating: verdict.overallRating as "CRITICAL" | "CAUTION" | "STABLE" | "STRONG" | "EXCEPTIONAL",
      monthlyARR: [],
      monthlyRunway: [],
      monthlySurvival: [],
      arrBands: result.arrConfidenceBands?.map((b) => ({ month: b.month, p10: b.p10, p50: b.p50, p90: b.p90 })) || [],
      leverSensitivity:
        result.sensitivityFactors?.map((f) => ({ lever: String(f.lever), label: f.label, impact: f.impact })) || [],
      simulatedAt: new Date(),
      iterations: simConfig.iterations,
      executionTimeMs: result.executionTimeMs,
    });

    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 250);
  }, [leversAsSnapshot, result, saveAsBaselineToScenario, saveSimulation, setAsBaseline, simConfig.iterations, verdict]);

  // SAVE NAMED SCENARIO
  const handleSaveScenario = useCallback(() => {
    if (!result || !verdict || !scenarioName.trim()) return;

    setSaveState("saving");

    saveSimulation({
      name: scenarioName.trim(),
      description: `Score: ${verdict.overallScore} | Survival: ${Math.round(result.survivalRate * 100)}%`,
      levers: leversAsSnapshot,
      summary: {
        survivalRate: result.survivalRate,
        survivalPercent: `${Math.round(result.survivalRate * 100)}%`,
        arrMedian: result.arrPercentiles.p50,
        arrP10: result.arrPercentiles.p10,
        arrP90: result.arrPercentiles.p90,
        runwayMedian: result.runwayPercentiles.p50,
        runwayP10: result.runwayPercentiles.p10,
        runwayP90: result.runwayPercentiles.p90,
        cashMedian: result.cashPercentiles.p50,
        cashP10: result.cashPercentiles.p10,
        cashP90: result.cashPercentiles.p90,
        overallScore: verdict.overallScore,
        overallRating: verdict.overallRating,
      },
      isBaseline: false,
    });

    saveScenarioToStore(scenarioName.trim(), leversAsSnapshot, {
      survivalRate: result.survivalRate,
      medianARR: result.arrPercentiles.p50,
      medianRunway: result.runwayPercentiles.p50,
      medianCash: result.cashPercentiles.p50,
      arrP10: result.arrPercentiles.p10,
      arrP50: result.arrPercentiles.p50,
      arrP90: result.arrPercentiles.p90,
      runwayP10: result.runwayPercentiles.p10,
      runwayP50: result.runwayPercentiles.p50,
      runwayP90: result.runwayPercentiles.p90,
      cashP10: result.cashPercentiles.p10,
      cashP50: result.cashPercentiles.p50,
      cashP90: result.cashPercentiles.p90,
      overallScore: verdict.overallScore,
      overallRating: verdict.overallRating as "CRITICAL" | "CAUTION" | "STABLE" | "STRONG" | "EXCEPTIONAL",
      monthlyARR: [],
      monthlyRunway: [],
      monthlySurvival: [],
      arrBands: result.arrConfidenceBands?.map((b) => ({ month: b.month, p10: b.p10, p50: b.p50, p90: b.p90 })) || [],
      leverSensitivity:
        result.sensitivityFactors?.map((f) => ({ lever: String(f.lever), label: f.label, impact: f.impact })) || [],
      simulatedAt: new Date(),
      iterations: simConfig.iterations,
      executionTimeMs: result.executionTimeMs,
    });

    setTimeout(() => {
      setSaveState("saved");
      setShowSaveModal(false);
      setScenarioName("");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 250);
  }, [leversAsSnapshot, result, saveScenarioToStore, saveSimulation, scenarioName, verdict, simConfig.iterations]);

  // Load scenario: apply levers and rerun
  const handleLoadScenario = useCallback(
    (scenario: any) => {
      if (scenario?.levers) setLevers(scenario.levers);
      setTimeout(() => runSimulation(), 120);
    },
    [runSimulation, setLevers]
  );

  // Evidence Pack (Founder-safe default: JSON with plain-English + raw stats)
  const handleDownloadEvidencePack = useCallback(() => {
    if (!result || !verdict) return;

    const pack = {
      product: "STRATFIT",
      type: "Evidence Pack",
      generatedAt: new Date().toISOString(),
      simulations: {
        iterations: simConfig.iterations,
        timeHorizonMonths: simConfig.timeHorizonMonths,
        executionTimeMs: result.executionTimeMs,
      },
      verdict: {
        headline: verdict.headline,
        founderSummary: verdict.summary,
        rating: verdict.overallRating,
        score: verdict.overallScore,
      },
      keyOutcomes: {
        survivalProbability: result.survivalRate,
        runwayMonths: {
          p10: result.runwayPercentiles.p10,
          p50: result.runwayPercentiles.p50,
          p90: result.runwayPercentiles.p90,
        },
        arr: {
          p10: result.arrPercentiles.p10,
          p50: result.arrPercentiles.p50,
          p90: result.arrPercentiles.p90,
        },
        cash: {
          p10: result.cashPercentiles.p10,
          p50: result.cashPercentiles.p50,
          p90: result.cashPercentiles.p90,
        },
      },
      drivers: (result.sensitivityFactors || []).map((f) => ({
        lever: String(f.lever),
        label: f.label,
        impact: f.impact,
        direction: (f as any).direction ?? null,
      })),
      levers: leversAsSnapshot,
      notes: {
        founder:
          "This pack is designed to be shareable. It includes a plain-language summary and the distribution evidence behind it.",
        technical: "Monte Carlo simulation results; distributions reflect model + uncertainty assumptions used in this run.",
      },
    };

    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STRATFIT_EvidencePack_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [leversAsSnapshot, result, simConfig.iterations, simConfig.timeHorizonMonths, verdict]);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && phase === "idle") runSimulation();
  }, [isOpen, phase, runSimulation]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setProgress(0);
      setIterationCount(0);
      setResult(null);
      setVerdict(null);
      setSaveState("idle");
      setShowSaveModal(false);
      setScenarioName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Derived hero numbers (founder-first)
  const survival = verdict && result ? fmtPct0to1(result.survivalRate) : "—";
  const runwayP50 = verdict && result ? `${Math.round(safe(result.runwayPercentiles.p50, 0))} mo` : "—";
  const arrP50 = verdict && result ? fmtMoneyShort(safe(result.arrPercentiles.p50, 0)) : "—";

  return (
    <div className="fixed inset-0 z-80 bg-black/60 backdrop-blur-sm">
      {/* Shell */}
      <div className="absolute inset-4 rounded-3xl border border-slate-800/60 bg-[#050b14] shadow-[0_18px_70px_rgba(0,0,0,0.75)] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">SIMULATE</div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            <div className="text-slate-200 text-sm font-semibold">Verdict Chamber</div>
          </div>

          <div className="flex items-center gap-2">
            {/* Load Scenario */}
            <div className="hidden md:block">
              <LoadScenarioDropdown onLoad={handleLoadScenario} showDelete={true} showSetBaseline={true} />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/70 bg-black/20 text-slate-200 hover:bg-black/30"
            >
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* Body: ONE SCROLL SURFACE */}
        <div className="h-[calc(100%-64px)] overflow-y-auto overflow-x-hidden sfCyanScroll">
          {/* RUNNING */}
          {phase === "running" && (
            <div className="px-6 py-8">
              <div className="rounded-2xl border border-slate-800/60 bg-black/25 p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="text-slate-200 text-sm font-semibold">Running 10,000 futures</div>
                    <div className="text-slate-400 text-xs mt-1">
                      Stress-testing your strategy over {simConfig.timeHorizonMonths} months.
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {iterationCount.toLocaleString()} / {simConfig.iterations.toLocaleString()}
                  </div>
                </div>

                <div className="mt-5 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                    style={{ width: `${clamp(progress, 0, 100)}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500">
                    Evidence generation in progress
                  </div>
                  <div className="text-xs text-slate-400 inline-flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    {Math.round(progress)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPLETE */}
          {phase === "complete" && result && verdict && (
            <div className="px-6 py-6">
              {/* Hero strip */}
              <div className="rounded-2xl border border-slate-800/60 bg-black/25 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Outcome</div>
                    <div className="text-slate-100 text-xl font-semibold mt-1">{verdict.headline}</div>
                    <div className="text-slate-400 text-xs mt-2">
                      Based on {simConfig.iterations.toLocaleString()} simulations over {simConfig.timeHorizonMonths} months.
                      {compiled ? " • Declaration-Driven" : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-slate-800/60 bg-black/20 px-4 py-3">
                      <div className="text-[10px] tracking-widest uppercase text-slate-500">Survival</div>
                      <div className="text-slate-100 font-semibold text-lg mt-1">{survival}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-black/20 px-4 py-3">
                      <div className="text-[10px] tracking-widest uppercase text-slate-500">Runway (median)</div>
                      <div className="text-slate-100 font-semibold text-lg mt-1">{runwayP50}</div>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-black/20 px-4 py-3">
                      <div className="text-[10px] tracking-widest uppercase text-slate-500">ARR (median)</div>
                      <div className="text-slate-100 font-semibold text-lg mt-1">{arrP50}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-xs text-slate-400">Founder view first. Institutional evidence is below.</div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadEvidencePack}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15"
                    >
                      <Download size={16} /> Download Evidence Pack
                    </button>

                    <button
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        saveState === "saved"
                          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
                          : "border-slate-800/70 bg-black/20 text-slate-200 hover:bg-black/30"
                      }`}
                      onClick={handleSaveAsBaseline}
                      disabled={saveState !== "idle"}
                    >
                      {saveState === "saved" ? (
                        <>
                          <Check size={16} /> Saved
                        </>
                      ) : saveState === "saving" ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <Star size={16} /> {hasBaseline ? "Update Baseline" : "Set as Baseline"}
                        </>
                      )}
                    </button>

                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/70 bg-black/20 text-slate-200 hover:bg-black/30"
                      onClick={() => setShowSaveModal(true)}
                      disabled={saveState !== "idle"}
                    >
                      <Save size={16} /> Save Scenario
                    </button>

                    <button
                      onClick={runSimulation}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/70 bg-black/20 text-slate-200 hover:bg-black/30"
                    >
                      <RefreshCw size={16} /> Re-run
                    </button>
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div className="mt-5 rounded-2xl border border-slate-800/60 bg-black/25 p-5">
                <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Verdict</div>
                <div className="mt-3">
                  <VerdictPanel verdict={verdict as any} result={result as any} />
                </div>
              </div>

              {/* Evidence */}
              <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-4">
                <div className="rounded-2xl border border-slate-800/60 bg-black/25 p-5">
                  <div>
                    <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Evidence</div>
                    <div className="text-slate-200 text-sm font-semibold mt-1">Outcome distribution</div>
                    <div className="text-slate-400 text-xs mt-1">Not a single forecast — a range of futures.</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-800/60 bg-black/20 p-4">
                      <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">ARR Distribution</div>
                      <ProbabilityDistribution
                        histogram={result.arrHistogram}
                        percentiles={result.arrPercentiles}
                        stats={result.arrDistribution}
                      />
                    </div>

                    <div className="rounded-xl border border-slate-800/60 bg-black/20 p-4">
                      <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">Confidence Bands</div>
                      <ConfidenceFan data={result.arrConfidenceBands} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800/60 bg-black/25 p-5">
                  <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Drivers</div>
                  <div className="text-slate-200 text-sm font-semibold mt-1">What moved the outcome</div>

                  <div className="mt-4 rounded-xl border border-slate-800/60 bg-black/20 p-4">
                    <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">Sensitivity</div>
                    <SensitivityBars factors={result.sensitivityFactors} />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-800/60 bg-black/20 p-4">
                    <div className="text-[10px] tracking-widest uppercase text-slate-500 mb-2">Founder narrative</div>
                    <SimulateNarrative verdict={verdict} />
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              <div className="mt-5 rounded-2xl border border-slate-800/60 bg-black/25 p-5">
                <div className="text-[10px] tracking-[0.22em] uppercase text-slate-400">Scenarios</div>
                <div className="text-slate-200 text-sm font-semibold mt-1">Best / median / worst case</div>
                <div className="text-slate-400 text-xs mt-1">Founder-ready story cards.</div>

                <div className="mt-4">
                  <ScenarioCards
                    bestCase={result.bestCase}
                    worstCase={result.worstCase}
                    medianCase={result.medianCase}
                    verdict={verdict}
                  />
                </div>
              </div>

              {!hasBaseline && (
                <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-cyan-100 text-sm flex items-start gap-2">
                  <Star size={16} className="mt-0.5" />
                  <div>
                    <div className="font-semibold">Set a baseline</div>
                    <div className="text-cyan-100/80 text-xs mt-1">
                      Baseline unlocks Compare, Risk, and Decision — and makes the demo feel real.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-90 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/70 bg-[#050b14] shadow-[0_18px_70px_rgba(0,0,0,0.75)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="text-slate-100 font-semibold">Save Scenario</div>
              <div className="text-slate-400 text-xs mt-1">Name this scenario for later comparison.</div>
            </div>

            <div className="p-5">
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-800/70 bg-black/25 text-slate-100 outline-none focus:border-cyan-500/30"
                placeholder="e.g., Aggressive Growth, Conservative..."
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveScenario()}
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="px-3 py-2 rounded-xl border border-slate-800/70 bg-black/20 text-slate-200 hover:bg-black/30"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15 disabled:opacity-40"
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim()}
                >
                  <Save size={16} className="inline mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
