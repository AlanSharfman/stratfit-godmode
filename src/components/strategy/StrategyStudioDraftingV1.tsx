import React, { useEffect, useMemo, useRef, useState } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { hasBaseline, loadBaseline } from "@/onboard/baseline";
import type { ScenarioDraftLeversV1, ScenarioDraftV1 } from "@/strategy/scenarioDraft";
import {
  getActiveScenarioId,
  loadScenario,
  saveScenario,
  setActiveScenarioId,
} from "@/strategy/scenarioDraft";

type Timer = ReturnType<typeof setTimeout>;

function nowISO(): string {
  return new Date().toISOString();
}

function genId(): string {
  return `scn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function toDraftLevers(levers: Record<string, number> | null | undefined): ScenarioDraftLeversV1 {
  const v = levers ?? {};
  const n = (k: keyof ScenarioDraftLeversV1, fallback = 50) => {
    const raw = v[k as string];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
  };
  return {
    demandStrength: n("demandStrength"),
    pricingPower: n("pricingPower"),
    expansionVelocity: n("expansionVelocity"),
    costDiscipline: n("costDiscipline"),
    hiringIntensity: n("hiringIntensity"),
    operatingDrag: n("operatingDrag"),
    marketVolatility: n("marketVolatility"),
    executionRisk: n("executionRisk"),
    fundingPressure: n("fundingPressure"),
  };
}

export function StrategyStudioDraftingV1() {
  const currentLevers = useScenarioStore((s) => s.currentLevers);

  const [draft, setDraft] = useState<ScenarioDraftV1 | null>(null);
  const [savedPulse, setSavedPulse] = useState(false);
  const pulseTimerRef = useRef<Timer | null>(null);
  const saveTimerRef = useRef<Timer | null>(null);

  const baselineVersion = useMemo(() => loadBaseline()?.version ?? 1, []);

  useEffect(() => {
    // Strategy Studio requires baseline. If missing, redirect immediately.
    if (!hasBaseline()) {
      window.location.assign("/onboard");
      return;
    }

    const activeId = getActiveScenarioId();
    const existing = activeId ? loadScenario(activeId) : null;
    if (existing) {
      setDraft(existing);
      return;
    }

    // No active scenario yet — create one seeded from current levers (baseline defaults).
    const id = genId();
    const createdAtISO = nowISO();
    const initial: ScenarioDraftV1 = {
      id,
      name: "Scenario 1",
      createdAtISO,
      updatedAtISO: createdAtISO,
      derivedFromBaselineVersion: baselineVersion,
      levers: toDraftLevers(currentLevers),
    };
    saveScenario(initial);
    setActiveScenarioId(id);
    setDraft(initial);
  }, []);

  // When levers move, update draft + autosave (debounced 400ms)
  useEffect(() => {
    if (!draft) return;
    if (!currentLevers) return;

    const next: ScenarioDraftV1 = {
      ...draft,
      updatedAtISO: nowISO(),
      levers: toDraftLevers(currentLevers),
    };
    setDraft(next);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveScenario(next);
      setActiveScenarioId(next.id);

      setSavedPulse(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setSavedPulse(false), 1500);
    }, 400);
  }, [currentLevers]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  if (!draft) {
    return (
      <div className="h-full w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-white/70">
        Preparing Strategy Studio…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-auto rounded-3xl border border-white/10 bg-linear-to-br from-slate-950/55 to-black/75 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_0%,rgba(34,211,238,0.12),transparent_60%)]" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.18em] text-white/55">STRATEGY STUDIO</div>
            <div className="mt-2 text-[18px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {draft.name}
            </div>
            <div className="mt-1 text-[12px] text-white/60">
              Editing a scenario draft (baseline remains immutable).
            </div>
          </div>

          <div
            className={`h-[32px] rounded-full border px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] transition ${
              savedPulse
                ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-50"
                : "border-white/10 bg-white/5 text-white/55"
            }`}
            style={{
              transitionTimingFunction: "ease-out",
              transitionDuration: "220ms",
              transform: `translateY(${savedPulse ? 0 : 6}px)`,
              opacity: savedPulse ? 1 : 0.85,
            }}
          >
            Scenario saved
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {(
            [
              ["Demand Strength", draft.levers.demandStrength],
              ["Pricing Power", draft.levers.pricingPower],
              ["Expansion Velocity", draft.levers.expansionVelocity],
              ["Cost Discipline", draft.levers.costDiscipline],
              ["Hiring Intensity", draft.levers.hiringIntensity],
              ["Operating Drag", draft.levers.operatingDrag],
              ["Market Volatility", draft.levers.marketVolatility],
              ["Execution Risk", draft.levers.executionRisk],
              ["Funding Pressure", draft.levers.fundingPressure],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">{label}</div>
              <div className="mt-2 text-[20px] font-black text-white tabular-nums">{Math.round(value)}</div>
              <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300/70"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-[11px] text-white/45">
          Draft ID: <span className="text-white/60">{draft.id}</span> · Baseline v
          <span className="text-white/60">{draft.derivedFromBaselineVersion}</span>
        </div>
      </div>
    </div>
  );
}

export default StrategyStudioDraftingV1;


