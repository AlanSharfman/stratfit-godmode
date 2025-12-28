// src/logic/buildScenarioDelta.ts
// STRATFIT — Canonical Scenario Delta Builder (Pure)
// Step 7.2: single deterministic delta object per scenario change.
// Constraints:
// - No hooks
// - No rendering
// - No side effects
// - Deterministic math only
// - Minimal surface area

export type KPIChange = Readonly<{
    from: number;
    to: number;
    delta: number;
  }>;
  
  export type ScenarioDelta = Readonly<{
    scenarioId: string;
    kpiDelta: Readonly<Record<string, KPIChange>>;
  }>;
  
  // Minimal structural type: works with engineResults[scenarioId] shapes where
  // kpis[key] may be a number OR an object containing { value: number }.
  export type ScenarioLike = Readonly<{
    kpis?: Readonly<Record<string, unknown>>;
  }>;
  
  function toNumber(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  
    if (v && typeof v === "object") {
      const maybe = v as { value?: unknown };
      if (typeof maybe.value === "number" && Number.isFinite(maybe.value)) {
        return maybe.value;
      }
    }
  
    return null;
  }
  
  function deepFreezeDelta(delta: { scenarioId: string; kpiDelta: Record<string, KPIChange> }): ScenarioDelta {
    // Freeze leaf objects first (stable, deterministic).
    for (const k of Object.keys(delta.kpiDelta)) {
      Object.freeze(delta.kpiDelta[k]);
    }
    Object.freeze(delta.kpiDelta);
    return Object.freeze(delta) as ScenarioDelta;
  }
  
  /**
   * buildScenarioDelta
   * Input: prevScenario, nextScenario (engine result-like objects)
   * Output: ScenarioDelta (frozen) or null if missing/no comparable KPI moves
   */
  export function buildScenarioDelta(
    prevScenario: ScenarioLike | null | undefined,
    nextScenario: ScenarioLike | null | undefined,
    scenarioId: string
  ): ScenarioDelta | null {
    const prevKpis = prevScenario?.kpis;
    const nextKpis = nextScenario?.kpis;
  
    if (!prevKpis || !nextKpis) return null;
  
    const keys = new Set<string>([
      ...Object.keys(prevKpis),
      ...Object.keys(nextKpis),
    ]);
  
    const kpiDelta: Record<string, KPIChange> = {};
  
    for (const key of keys) {
      const fromRaw = prevKpis[key];
      const toRaw = nextKpis[key];
  
      const from = toNumber(fromRaw);
      const to = toNumber(toRaw);
  
      if (from === null || to === null) continue;
      if (from === to) continue;
  
      kpiDelta[key] = {
        from,
        to,
        delta: to - from,
      };
    }
  
    if (Object.keys(kpiDelta).length === 0) return null;
  
    return deepFreezeDelta({
      scenarioId,
      kpiDelta,
    });
  }
  
