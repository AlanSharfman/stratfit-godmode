export interface DemoCue {
  stage: string;
  cameraMode?: "wide" | "focus" | "signal";
  highlightPanel?: string;
}

export const DEMO_CUES: DemoCue[] = [
  { stage: "INTRO", cameraMode: "wide" },
  { stage: "POSITION", highlightPanel: "position" },
  { stage: "RUN_SIM", highlightPanel: "controls" },
  { stage: "TERRAIN_REACTION", cameraMode: "focus" },
  { stage: "SIGNALS", highlightPanel: "signals" },
  { stage: "EXEC_SUMMARY", highlightPanel: "summary" },
];
