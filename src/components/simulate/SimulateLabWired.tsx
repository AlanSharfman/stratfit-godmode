import React, { useCallback, useMemo, useState } from "react";

import { useSimulationStore } from "@/state/simulationStore";
import { useLeverStore } from "@/state/leverStore";

import {
  processSimulationResults,
  runSingleSimulation,
  type LeverState,
  type MonteCarloResult,
  type SimulationConfig,
} from "@/logic/monteCarloEngine";
import { generateVerdict, type Verdict } from "@/logic/verdictGenerator";

import SimulateLab from "./SimulateLab";

type Phase = "idle" | "running" | "complete";

export default function SimulateLabWired() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const setSimulationResult = useSimulationStore((s) => s.setSimulationResult);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const isRunning = useSimulationStore((s) => s.isSimulating);

  const levers = useLeverStore((s) => s.levers) as unknown as LeverState;

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

  const runSimulation = useCallback(async () => {
    setPhase("running");
    setProgress(0);
    setIterationCount(0);
    setResult(null);
    setVerdict(null);
    startSimulation();

    const startTime = performance.now();
    const CHUNK_SIZE = 500;
    const allSimulations: any[] = [];

    for (let i = 0; i < config.iterations; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, config.iterations);

      for (let j = i; j < chunkEnd; j++) {
        allSimulations.push(runSingleSimulation(j, levers, config));
      }

      const currentProgress = (allSimulations.length / config.iterations) * 100;
      setProgress(currentProgress);
      setIterationCount(allSimulations.length);

      // yield to UI
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const executionTimeMs = performance.now() - startTime;
    const simResult = processSimulationResults(allSimulations, config, levers, executionTimeMs);
    const simVerdict = generateVerdict(simResult);

    setProgress(100);
    setResult(simResult);
    setVerdict(simVerdict);

    setSimulationResult(simResult, simVerdict, levers);

    setPhase("complete");
  }, [config, levers, setSimulationResult, startSimulation]);

  return (
    <SimulateLab
      phase={phase}
      progress={progress}
      iterationCount={iterationCount}
      config={config}
      result={result}
      verdict={verdict}
      onRun={runSimulation}
      isRunning={isRunning || phase === "running"}
    />
  );
}


