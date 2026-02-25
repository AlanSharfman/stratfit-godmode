export interface NarrationLine {
  stage: string;
  text: string;
}

export const DEMO_NARRATION: NarrationLine[] = [
  { stage: "INTRO", text: "STRATFIT is a strategic simulation environment designed to support high-stakes decision making." },
  { stage: "POSITION", text: "We begin by visualising the organisation's current position across key performance dimensions." },
  { stage: "RUN_SIM", text: "The platform simulates thousands of possible futures to understand risk and opportunity." },
  { stage: "TERRAIN_REACTION", text: "As probabilities evolve, the terrain dynamically reshapes to reflect emerging outcomes." },
  { stage: "SIGNALS", text: "Forward-looking signals highlight where attention should be focused." },
  { stage: "EXEC_SUMMARY", text: "The system translates complex simulation outputs into clear executive insights." },
  { stage: "END", text: "STRATFIT delivers clarity on where the organisation stands and what strategic moves matter most." },
];
