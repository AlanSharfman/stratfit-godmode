import React, { useMemo, useState } from "react";
import type { BaselineV1 } from "@/onboard/baseline";
import { setCompareSelection } from "@/compare/selection";
import { useScenarioStore } from "@/state/scenarioStore";
import { useStrategicStudioStore } from "@/state/strategicStudioStore";
import TitaniumPanel from "./TitaniumPanel";
import ConfirmModal from "./ConfirmModal";

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function slotLabel(id: string): string {
  if (id === "upside") return "UPSIDE";
  if (id === "downside") return "DOWNSIDE";
  if (id === "stress") return "STRESS";
  return id.toUpperCase();
}

export function ScenarioListPanel(props: { baselineTruth: BaselineV1 | null }) {
  const { baselineTruth } = props;
  const [confirmDeleteId, setConfirmDeleteId] = useState<"upside" | "downside" | "stress" | null>(null);

  const {
    scenarios,
    activeScenarioId,
    activeTagFilter,
    selectScenario,
    createScenarioFromBaseline,
    duplicateScenario,
    renameScenario,
    deleteScenario,
    setScenarioTags,
    setScenarioNotes,
    setActiveTagFilter,
  } = useStrategicStudioStore((s) => ({
    scenarios: s.scenarios,
    activeScenarioId: s.activeScenarioId,
    activeTagFilter: s.activeTagFilter,
    selectScenario: s.selectScenario,
    createScenarioFromBaseline: s.createScenarioFromBaseline,
    duplicateScenario: s.duplicateScenario,
    renameScenario: s.renameScenario,
    deleteScenario: s.deleteScenario,
    setScenarioTags: s.setScenarioTags,
    setScenarioNotes: s.setScenarioNotes,
    setActiveTagFilter: s.setActiveTagFilter,
  }));

  const setScenarioInApp = useScenarioStore((s) => s.setScenario);

  const active = scenarios[activeScenarioId];
  const allTags = useMemo(() => {
    const tags = Object.values(scenarios).flatMap((s) => s.tags ?? []);
    return uniq(tags).sort((a, b) => a.localeCompare(b));
  }, [scenarios]);

  const visible = useMemo(() => {
    const list = Object.values(scenarios);
    if (!activeTagFilter) return list;
    return list.filter((s) => (s.tags ?? []).includes(activeTagFilter));
  }, [scenarios, activeTagFilter]);

  const onPickScenario = (id: "upside" | "downside" | "stress") => {
    selectScenario(id);
    // Keep Compare-compatible selection in the global store.
    setScenarioInApp(id);
  };

  const viewInCompare = () => {
    setCompareSelection({ baseline: true, scenarioIds: [activeScenarioId] });
    window.location.assign("/?view=compare");
  };

  return (
    <div className="flex flex-col gap-3">
      <TitaniumPanel
        kicker="Strategic Studio"
        title="Scenario Builder"
        rightSlot={
          <button
            type="button"
            className="h-[34px] rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/15 active:translate-y-px"
            onClick={viewInCompare}
            title="Open Compare with Baseline + selected scenario"
          >
            View in Compare
          </button>
        }
      >
        <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Baseline (truth layer)</div>
          <div className="mt-2 text-[12px] text-white/80 font-extrabold">
            {baselineTruth?.company?.legalName ? baselineTruth.company.legalName : "Baseline"}
          </div>
          <div className="mt-1 text-[11px] text-white/55">
            Immutable. Scenarios are drafted from this baseline.
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Scenarios</div>
          <div className="mt-2 flex flex-col gap-2">
            {visible.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onPickScenario(s.id as any)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  s.id === activeScenarioId
                    ? "border-cyan-300/30 bg-cyan-400/10"
                    : "border-white/10 bg-black/20 hover:bg-black/28"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[12px] font-black text-white/90">{s.name}</div>
                  <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
                    {slotLabel(s.id)}
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
                  <span>{s.status === "saved" ? "Saved" : "Draft"}</span>
                  {s.hasUnsavedChanges ? <span className="text-white/45">• Unsaved changes</span> : null}
                </div>
                {s.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-extrabold tracking-[0.10em] text-white/60 uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="h-[40px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
            onClick={() => {
              const res = createScenarioFromBaseline();
              if (!res.ok) window.alert(res.reason);
            }}
            title="Create a new scenario (one of the 3 studio slots)"
          >
            New Scenario
          </button>
          <button
            type="button"
            className="h-[40px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
            onClick={() => {
              const res = duplicateScenario(activeScenarioId);
              if (!res.ok) window.alert(res.reason);
            }}
            title="Duplicate active scenario into an empty slot"
          >
            Duplicate
          </button>
          <button
            type="button"
            className="h-[40px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
            onClick={() => {
              const next = window.prompt("Scenario name:", active.name);
              if (next != null) renameScenario(activeScenarioId, next);
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="h-[40px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
            onClick={() => setConfirmDeleteId(activeScenarioId)}
            title="Delete (reset) the active scenario"
          >
            Delete
          </button>
        </div>

        <div className="mt-3">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Tags</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-[10px] font-extrabold tracking-[0.12em] uppercase transition ${
                !activeTagFilter ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/7"
              }`}
              onClick={() => setActiveTagFilter(null)}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`rounded-full border px-3 py-1 text-[10px] font-extrabold tracking-[0.12em] uppercase transition ${
                  activeTagFilter === t
                    ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/7"
                }`}
                onClick={() => setActiveTagFilter(activeTagFilter === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              className="h-[38px] flex-1 rounded-xl border border-white/10 bg-black/25 px-3 text-[12px] font-extrabold text-white/85 outline-none"
              placeholder="Add tag…"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const el = e.target as HTMLInputElement;
                const tag = el.value.trim();
                if (!tag) return;
                setScenarioTags(activeScenarioId, [...(active.tags ?? []), tag]);
                el.value = "";
              }}
            />
            <button
              type="button"
              className="h-[38px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
              onClick={() => {
                setScenarioTags(activeScenarioId, []);
                setActiveTagFilter(null);
              }}
              title="Clear tags"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">Scenario Notes</div>
          <textarea
            className="mt-2 min-h-[88px] w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-[12px] text-white/80 outline-none placeholder:text-white/35"
            placeholder="Optional: key assumptions, constraints, narrative…"
            value={active.notes ?? ""}
            onChange={(e) => setScenarioNotes(activeScenarioId, e.target.value)}
          />
        </div>
      </TitaniumPanel>

      <ConfirmModal
        isOpen={confirmDeleteId != null}
        kicker="Delete scenario"
        title="Delete this scenario?"
        body="This resets the scenario back to baseline defaults. Baseline remains untouched."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteScenario(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}

export default ScenarioListPanel;


