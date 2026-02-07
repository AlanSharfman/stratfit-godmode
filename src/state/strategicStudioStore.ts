import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScenarioId } from "@/state/scenarioStore";
import { hasBaseline, loadBaseline } from "@/onboard/baseline";
import type { LeverConfig, StudioBaselineModel, StudioScenarioModel, StudioScenarioTag } from "@/strategicStudio/types";

const STORAGE_KEY = "stratfit.strategicStudio.v1";

type StudioScenarioSlot = Exclude<ScenarioId, "base">; // upside|downside|stress

function nowISO(): string {
  return new Date().toISOString();
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function normalizeLeverConfig(x: Partial<LeverConfig> | null | undefined): LeverConfig {
  const o = x ?? {};
  return {
    cashOnHand: Math.max(0, Number(o.cashOnHand ?? 0)),
    monthlyNetBurn: Math.max(0, Number(o.monthlyNetBurn ?? 0)),
    currentARR: Math.max(0, Number(o.currentARR ?? 0)),
    monthlyGrowthRate: clamp(Number(o.monthlyGrowthRate ?? 0.02), 0, 1),
    monthlyChurnRate: clamp(Number(o.monthlyChurnRate ?? 0.03), 0, 1),
    netRevenueRetention: clamp(Number(o.netRevenueRetention ?? 1.0), 0, 2),
    headcount: Math.max(0, Math.round(Number(o.headcount ?? 0))),
    avgFullyLoadedCost: Math.max(0, Number(o.avgFullyLoadedCost ?? 180_000)),
    salesMarketingSpendMonthly: Math.max(0, Number(o.salesMarketingSpendMonthly ?? 0)),
    rdSpendMonthly: Math.max(0, Number(o.rdSpendMonthly ?? 0)),
    operatingCostsMonthly: Math.max(0, Number(o.operatingCostsMonthly ?? 0)),
  };
}

function baselineLeverDefaults(): LeverConfig {
  const b = loadBaseline();
  const cash = b?.financial?.cashOnHand ?? 4_000_000;
  const burn = b?.financial?.monthlyBurn ?? 47_000;
  const arr = b?.financial?.arr ?? 4_800_000;
  const growthPct = b?.financial?.growthRatePct ?? 8;
  const churnPct = b?.operating?.churnPct ?? 5;
  const headcount = b?.financial?.headcount ?? 20;
  const payrollMonthly = b?.financial?.payroll ?? 0;

  // Best-effort: infer a reasonable fully-loaded annual cost from payroll when possible.
  const avgFullyLoadedCost =
    headcount > 0 && payrollMonthly > 0 ? (payrollMonthly * 12) / headcount : 180_000;

  // Best-effort: infer NRR from churn (kept simple and explainable).
  const nrrPct = clamp(100 - churnPct, 0, 200);

  return normalizeLeverConfig({
    cashOnHand: cash,
    monthlyNetBurn: burn,
    currentARR: arr,
    monthlyGrowthRate: clamp(growthPct / 100 / 12, 0, 1), // conservative: treat as annual % -> monthly ratio
    monthlyChurnRate: clamp(churnPct / 100, 0, 1),
    netRevenueRetention: clamp(nrrPct / 100, 0, 2),
    headcount,
    avgFullyLoadedCost,
    salesMarketingSpendMonthly: 0,
    rdSpendMonthly: 0,
    operatingCostsMonthly: 0,
  });
}

function defaultScenario(id: StudioScenarioSlot, baseline: LeverConfig): StudioScenarioModel {
  const createdAtISO = nowISO();
  const name = id === "upside" ? "Upside" : id === "downside" ? "Downside" : "Stress";
  return {
    id,
    name,
    createdAtISO,
    updatedAtISO: createdAtISO,
    tags: [],
    status: "draft",
    hasUnsavedChanges: false,
    leverConfig: { ...baseline },
    savedLeverConfig: undefined,
  };
}

type StoreState = {
  baseline: StudioBaselineModel | null;
  scenarios: Record<StudioScenarioSlot, StudioScenarioModel>;
  activeScenarioId: StudioScenarioSlot;
  activeTagFilter: StudioScenarioTag | null;

  hydrateFromBaselineIfNeeded: () => void;
  selectScenario: (id: StudioScenarioSlot) => void;
  createScenarioFromBaseline: () => { ok: true; id: StudioScenarioSlot } | { ok: false; reason: string };
  duplicateScenario: (fromId: StudioScenarioSlot) => { ok: true; id: StudioScenarioSlot } | { ok: false; reason: string };
  renameScenario: (id: StudioScenarioSlot, name: string) => void;
  deleteScenario: (id: StudioScenarioSlot) => void;
  setScenarioTags: (id: StudioScenarioSlot, tags: StudioScenarioTag[]) => void;
  setScenarioNotes: (id: StudioScenarioSlot, notes: string) => void;
  setActiveTagFilter: (tag: StudioScenarioTag | null) => void;

  updateScenarioLever: (id: StudioScenarioSlot, key: keyof LeverConfig, value: number) => void;
  resetScenarioToBaseline: (id: StudioScenarioSlot) => void;
  undoLastChange: (id: StudioScenarioSlot) => void;
  saveScenario: (id: StudioScenarioSlot) => void;

  // single-step undo
  _undoBuffer: Partial<Record<StudioScenarioSlot, LeverConfig | null>>;
};

const SLOTS: StudioScenarioSlot[] = ["upside", "downside", "stress"];

export const useStrategicStudioStore = create<StoreState>()(
  persist(
    (set, get) => ({
      baseline: null,
      scenarios: {
        upside: defaultScenario("upside", baselineLeverDefaults()),
        downside: defaultScenario("downside", baselineLeverDefaults()),
        stress: defaultScenario("stress", baselineLeverDefaults()),
      },
      activeScenarioId: "upside",
      activeTagFilter: null,
      _undoBuffer: {},

      hydrateFromBaselineIfNeeded: () => {
        if (!hasBaseline()) return;
        const baseline = baselineLeverDefaults();
        const existing = get().baseline;
        if (existing) return;
        set({
          baseline: { id: "base", name: "Baseline", leverConfig: baseline },
          scenarios: {
            upside: defaultScenario("upside", baseline),
            downside: defaultScenario("downside", baseline),
            stress: defaultScenario("stress", baseline),
          },
        });
      },

      selectScenario: (id) => set({ activeScenarioId: id }),

      createScenarioFromBaseline: () => {
        const b = get().baseline?.leverConfig ?? baselineLeverDefaults();
        const scenarios = get().scenarios;
        // Find a slot that is effectively "empty" (never modified/saved) if possible.
        const candidate = SLOTS.find((sid) => {
          const s = scenarios[sid];
          return s.status === "draft" && !s.hasUnsavedChanges && !s.savedLeverConfig;
        });
        if (!candidate) return { ok: false, reason: "All scenario slots are already in use." };
        set((state) => ({
          scenarios: { ...state.scenarios, [candidate]: defaultScenario(candidate, b) },
          activeScenarioId: candidate,
        }));
        return { ok: true, id: candidate };
      },

      duplicateScenario: (fromId) => {
        const scenarios = get().scenarios;
        const src = scenarios[fromId];
        const target = SLOTS.find((sid) => sid !== fromId && scenarios[sid].status === "draft" && !scenarios[sid].savedLeverConfig);
        if (!target) return { ok: false, reason: "No empty scenario slot is available for duplication." };
        const createdAtISO = nowISO();
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [target]: {
              ...src,
              id: target,
              name: `${src.name} Copy`,
              createdAtISO,
              updatedAtISO: createdAtISO,
              status: "draft",
              hasUnsavedChanges: true,
              savedLeverConfig: undefined,
            },
          },
          activeScenarioId: target,
        }));
        return { ok: true, id: target };
      },

      renameScenario: (id, name) =>
        set((state) => ({
          scenarios: { ...state.scenarios, [id]: { ...state.scenarios[id], name: name.trim() || state.scenarios[id].name, updatedAtISO: nowISO() } },
        })),

      deleteScenario: (id) => {
        const baseline = get().baseline?.leverConfig ?? baselineLeverDefaults();
        set((state) => ({
          scenarios: { ...state.scenarios, [id]: defaultScenario(id, baseline) },
          _undoBuffer: { ...state._undoBuffer, [id]: null },
        }));
      },

      setScenarioTags: (id, tags) =>
        set((state) => ({
          scenarios: { ...state.scenarios, [id]: { ...state.scenarios[id], tags: [...new Set(tags.map((t) => t.trim()).filter(Boolean))], updatedAtISO: nowISO() } },
        })),

      setScenarioNotes: (id, notes) =>
        set((state) => ({
          scenarios: { ...state.scenarios, [id]: { ...state.scenarios[id], notes, updatedAtISO: nowISO() } },
        })),

      setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),

      updateScenarioLever: (id, key, value) => {
        set((state) => {
          const prev = state.scenarios[id];
          const nextLevers = normalizeLeverConfig({ ...prev.leverConfig, [key]: value });
          return {
            scenarios: {
              ...state.scenarios,
              [id]: {
                ...prev,
                leverConfig: nextLevers,
                updatedAtISO: nowISO(),
                hasUnsavedChanges: true,
                status: prev.status,
              },
            },
            _undoBuffer: { ...state._undoBuffer, [id]: prev.leverConfig },
          };
        });
      },

      resetScenarioToBaseline: (id) => {
        const baseline = get().baseline?.leverConfig ?? baselineLeverDefaults();
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [id]: {
              ...state.scenarios[id],
              leverConfig: { ...baseline },
              updatedAtISO: nowISO(),
              hasUnsavedChanges: true,
            },
          },
          _undoBuffer: { ...state._undoBuffer, [id]: state.scenarios[id].leverConfig },
        }));
      },

      undoLastChange: (id) => {
        const buf = get()._undoBuffer[id];
        if (!buf) return;
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [id]: { ...state.scenarios[id], leverConfig: buf, updatedAtISO: nowISO(), hasUnsavedChanges: true },
          },
          _undoBuffer: { ...state._undoBuffer, [id]: null },
        }));
      },

      saveScenario: (id) => {
        set((state) => ({
          scenarios: {
            ...state.scenarios,
            [id]: {
              ...state.scenarios[id],
              status: "saved",
              hasUnsavedChanges: false,
              savedLeverConfig: { ...state.scenarios[id].leverConfig },
              updatedAtISO: nowISO(),
            },
          },
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      merge: (persistedState, currentState) => {
        const parsed = persistedState as Partial<StoreState> | undefined;
        if (!parsed) return currentState;

        // Defensive: avoid crashes if storage is corrupted / mismatched.
        const baseline = parsed.baseline && typeof parsed.baseline === "object" ? (parsed.baseline as StudioBaselineModel) : null;
        const activeScenarioId = (parsed.activeScenarioId as StudioScenarioSlot) || currentState.activeScenarioId;
        const activeTagFilter =
          typeof parsed.activeTagFilter === "string" ? (parsed.activeTagFilter as StudioScenarioTag) : null;

        const scenariosRaw = (parsed.scenarios as any) ?? null;
        const scenarios = SLOTS.reduce((acc, sid) => {
          const s = scenariosRaw && typeof scenariosRaw === "object" ? scenariosRaw[sid] : null;
          if (!s || typeof s !== "object") {
            acc[sid] = currentState.scenarios[sid];
            return acc;
          }
          const so = s as Partial<StudioScenarioModel>;
          acc[sid] = {
            ...currentState.scenarios[sid],
            ...so,
            id: sid,
            tags: Array.isArray(so.tags) ? (so.tags.filter((t) => typeof t === "string") as string[]) : [],
            leverConfig: normalizeLeverConfig(so.leverConfig as any),
            savedLeverConfig: so.savedLeverConfig ? normalizeLeverConfig(so.savedLeverConfig as any) : undefined,
            status: so.status === "saved" ? "saved" : "draft",
            hasUnsavedChanges: !!so.hasUnsavedChanges,
          };
          return acc;
        }, {} as Record<StudioScenarioSlot, StudioScenarioModel>);

        return {
          ...currentState,
          baseline,
          scenarios,
          activeScenarioId: SLOTS.includes(activeScenarioId) ? activeScenarioId : currentState.activeScenarioId,
          activeTagFilter,
          _undoBuffer: {},
        };
      },
      partialize: (state) => ({
        baseline: state.baseline,
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
        activeTagFilter: state.activeTagFilter,
      }),
    }
  )
);

export function getActiveStudioScenarioId(): StudioScenarioSlot {
  return useStrategicStudioStore.getState().activeScenarioId;
}


