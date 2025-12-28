// src/logic/buildScenarioDelta.ts
// STRATFIT — Canonical Scenario Delta Builder
// Step 7.2/7.5: Pure delta builder + DEV-only immutability guardrails
//
// HARD RULES:
// - Pure (no hooks, no side effects, no rendering)
// - Deterministic: same inputs => same output
// - Computed once upstream; consumers must never re-derive
// - DEV: deep-frozen to prevent mutation
// - PROD: zero freeze overhead

export type KPIAtom =
  | number
  | { value: number; display?: string }
  | { current?: number; value?: number; display?: string }
  | null
  | undefined;

export type EngineResultLike = {
  kpis?: Record<string, KPIAtom>;
} | null;

export type ScenarioDelta = {
  scenarioId: string;
  kpiDelta: Record<string, { from: number; to: number; delta: number }>;
  timestamp: number;
};

const DEV =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env !== "undefined" &&
  !!import.meta.env.DEV;

function toNumber(v: KPIAtom): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "object") {
    const anyV = v as any;
    if (typeof anyV.value === "number" && Number.isFinite(anyV.value)) return anyV.value;
    if (typeof anyV.current === "number" && Number.isFinite(anyV.current)) return anyV.current;
  }

  return null;
}

function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  Object.freeze(obj);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = obj;

  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return obj;
}

/**
 * Canonical builder.
 * NOTE: returns null until BOTH prev + next exist for the active scenario.
 */
export function buildScenarioDelta(
  prev: EngineResultLike,
  next: EngineResultLike,
  scenarioId: string
): ScenarioDelta | null {
  const prevKpis = prev?.kpis ?? null;
  const nextKpis = next?.kpis ?? null;

  if (!prevKpis || !nextKpis) return null;

  const keys = new Set<string>([
    ...Object.keys(prevKpis),
    ...Object.keys(nextKpis),
  ]);

  const kpiDelta: ScenarioDelta["kpiDelta"] = {};

  for (const key of keys) {
    const from = toNumber(prevKpis[key]);
    const to = toNumber(nextKpis[key]);

    if (from === null || to === null) continue;

    const d = to - from;
    // Prevent noise spam: keep true zeros out of the delta map.
    if (d === 0) continue;

    kpiDelta[key] = { from, to, delta: d };
  }

  const out: ScenarioDelta = {
    scenarioId,
    kpiDelta,
    timestamp: Date.now(),
  };

  return DEV ? deepFreeze(out) : out;
}
