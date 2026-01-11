// src/ui/causalEvents.ts
// STRATFIT — Causal Highlight Events (UI-only)
// Rules:
// - No store changes, no engine changes.
// - Fired ONLY on explicit user actions (slider release / scenario switch / save/load).

export type CausalSource = "slider_release" | "scenario_switch" | "scenario_save" | "scenario_load" | "scenario_share";
export type CausalBandStyle = "solid" | "wash";

export type CausalEventDetail = {
  source: CausalSource;
  bandStyle: CausalBandStyle;
  /** CSS color string (e.g. rgba(...)) */
  color: string;
  /** KPI indices to pulse (KPIConsole order) */
  kpiIndices?: number[];
};

export const CAUSAL_EVENT_NAME = "stratfit:causal";

export function emitCausal(detail: CausalEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CausalEventDetail>(CAUSAL_EVENT_NAME, { detail }));
}

export function onCausal(handler: (detail: CausalEventDetail) => void) {
  if (typeof window === "undefined") return () => {};

  const listener = (e: Event) => {
    const ce = e as CustomEvent<CausalEventDetail>;
    if (!ce.detail) return;
    handler(ce.detail);
  };

  window.addEventListener(CAUSAL_EVENT_NAME, listener as EventListener);
  return () => window.removeEventListener(CAUSAL_EVENT_NAME, listener as EventListener);
}


