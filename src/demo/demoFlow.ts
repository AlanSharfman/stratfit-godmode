export type DemoStage =
  | "INTRO"
  | "POSITION"
  | "RUN_SIM"
  | "TERRAIN_REACTION"
  | "SIGNALS"
  | "EXEC_SUMMARY"
  | "END";

export interface DemoStep {
  stage: DemoStage;
  title: string;
  description: string;
  durationMs: number; // auto-advance
  runSimulation?: boolean; // trigger at this step
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stage: "INTRO",
    title: "STRATFIT",
    description: "A strategic simulation environment for decision-making.",
    durationMs: 2600,
  },
  {
    stage: "POSITION",
    title: "Current Position",
    description: "We begin with the company's baseline landscape.",
    durationMs: 3000,
  },
  {
    stage: "RUN_SIM",
    title: "Exploring a Scenario",
    description: "STRATFIT runs thousands of possible futures.",
    durationMs: 4200,
    runSimulation: true,
  },
  {
    stage: "TERRAIN_REACTION",
    title: "Terrain Response",
    description: "The landscape reshapes as probabilities evolve.",
    durationMs: 3200,
  },
  {
    stage: "SIGNALS",
    title: "Strategic Signals",
    description: "Forward-looking intelligence highlights emerging risks and opportunities.",
    durationMs: 3600,
  },
  {
    stage: "EXEC_SUMMARY",
    title: "Executive Insight",
    description: "A clear, board-ready interpretation of the outcome.",
    durationMs: 3600,
  },
  {
    stage: "END",
    title: "Decision Clarity",
    description: "STRATFIT reveals not just what may happen — but what to do next.",
    durationMs: 2400,
  },
];
