import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_STEPS, type DemoStep } from "./demoFlow";
import { useSimulationStore } from "@/state/simulationStore";

/**
 * Demo Controller
 * - No global state
 * - Dispatch-only simulation trigger
 * - Deterministic step timing
 */
export function useDemoController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  const timerRef = useRef<number | null>(null);

  const step: DemoStep = useMemo(() => DEMO_STEPS[index], [index]);

  const runSimulation = useSimulationStore((s) => s.runSimulation);

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function next() {
    setIndex((i) => Math.min(i + 1, DEMO_STEPS.length - 1));
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function play() {
    setIsPlaying(true);
  }

  function pause() {
    setIsPlaying(false);
  }

  function reset() {
    setIsPlaying(false);
    setIndex(0);
  }

  // step side effects (controlled + deterministic)
  useEffect(() => {
    clearTimer();

    if (!isPlaying) return;

    if (step.runSimulation) {
      runSimulation({ horizonMonths: 24, iterations: 20000, inputs: { demo: true } });
    }

    timerRef.current = window.setTimeout(() => {
      if (index < DEMO_STEPS.length - 1) setIndex(index + 1);
      else setIsPlaying(false);
    }, step.durationMs);

    return clearTimer;
  }, [isPlaying, index]);

  return {
    step,
    index,
    total: DEMO_STEPS.length,
    isPlaying,
    play,
    pause,
    reset,
    next,
    prev,
  };
}
