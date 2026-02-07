import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LeverConfig, StudioBaselineModel, StudioScenarioModel } from "@/strategicStudio/types";
import { useStrategicStudioStore } from "@/state/strategicStudioStore";
import TitaniumPanel from "./TitaniumPanel";
import LeverSliderRow from "./LeverSliderRow";

type Timer = ReturnType<typeof setTimeout>;

function fmtMoney(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function fmtPct(v01: number): string {
  const pct = v01 * 100;
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

function parseMoney(raw: string): number | null {
  const s = raw.replace(/[$,\s]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parsePct(raw: string): number | null {
  const s = raw.replace(/[%\s]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

function parseIntLike(raw: string): number | null {
  const s = raw.replace(/[,\s]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function defaultsBounds(baseline: LeverConfig) {
  return {
    cashMax: Math.max(2_000_000, baseline.cashOnHand * 3),
    burnMax: Math.max(100_000, baseline.monthlyNetBurn * 3),
    arrMax: Math.max(1_000_000, baseline.currentARR * 4),
  };
}

export function ScenarioControlsPanel(props: { baseline: StudioBaselineModel; scenario: StudioScenarioModel }) {
  const { baseline, scenario } = props;

  const { updateScenarioLever, resetScenarioToBaseline, undoLastChange } = useStrategicStudioStore((s) => ({
    updateScenarioLever: s.updateScenarioLever,
    resetScenarioToBaseline: s.resetScenarioToBaseline,
    undoLastChange: s.undoLastChange,
  }));

  const [open, setOpen] = useState<Record<string, boolean>>({
    revenue: true,
    retention: true,
    costs: true,
    funding: true,
    strategy: true,
  });

  // Local draft state for smooth slider updates; commit debounced into the store.
  const [draft, setDraft] = useState<LeverConfig>(() => ({ ...scenario.leverConfig }));
  const commitTimer = useRef<Timer | null>(null);

  useEffect(() => {
    setDraft({ ...scenario.leverConfig });
  }, [scenario.id, scenario.updatedAtISO]);

  const bounds = useMemo(() => defaultsBounds(baseline.leverConfig), [baseline.leverConfig]);

  const scheduleCommit = (key: keyof LeverConfig, v: number) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => updateScenarioLever(scenario.id as any, key, v), 150);
  };

  const commitNow = (key: keyof LeverConfig, v: number) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    updateScenarioLever(scenario.id as any, key, v);
  };

  const setLever = (key: keyof LeverConfig, v: number, commit: "debounce" | "now" = "debounce") => {
    setDraft((prev) => ({ ...prev, [key]: v }));
    if (commit === "now") commitNow(key, v);
    else scheduleCommit(key, v);
  };

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  const headerRight = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-[34px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
        onClick={() => undoLastChange(scenario.id as any)}
        title="Undo last lever change (single-step)"
      >
        Undo
      </button>
      <button
        type="button"
        className="h-[34px] rounded-xl border border-white/10 bg-white/6 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition hover:bg-white/9 active:translate-y-px"
        onClick={() => resetScenarioToBaseline(scenario.id as any)}
        title="Reset this scenario back to baseline lever defaults"
      >
        Reset to Baseline
      </button>
    </div>
  );

  return (
    <TitaniumPanel kicker="Scenario controls" title={scenario.name} rightSlot={headerRight}>
      <div className="text-[12px] text-white/60">
        Baseline is locked. Adjust levers below to draft a scenario. Changes are tracked but not saved until you click
        <span className="text-cyan-100/90 font-extrabold"> Save Scenario</span>.
      </div>

      {/* MODULE: Revenue & Growth */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20">
        <button
          type="button"
          className="w-full px-4 py-3 text-left"
          onClick={() => toggle("revenue")}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/65 uppercase">Revenue & Growth</div>
            <div className="text-[11px] text-white/45">{open.revenue ? "Hide" : "Show"}</div>
          </div>
        </button>
        {open.revenue ? (
          <div className="px-4 pb-4 grid grid-cols-1 gap-3">
            <LeverSliderRow
              label="Current ARR"
              description="Annual recurring revenue baseline for the trajectory."
              value={draft.currentARR}
              baselineValue={baseline.leverConfig.currentARR}
              min={0}
              max={bounds.arrMax}
              step={50_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("currentARR", v)}
              onCommit={() => commitNow("currentARR", draft.currentARR)}
            />
            <LeverSliderRow
              label="Monthly growth rate"
              description="Compounded monthly ARR growth assumption."
              value={draft.monthlyGrowthRate}
              baselineValue={baseline.leverConfig.monthlyGrowthRate}
              min={0}
              max={0.3}
              step={0.0025}
              format={fmtPct}
              parse={parsePct}
              onChange={(v) => setLever("monthlyGrowthRate", v)}
              onCommit={() => commitNow("monthlyGrowthRate", draft.monthlyGrowthRate)}
            />
          </div>
        ) : null}
      </div>

      {/* MODULE: Retention & Churn */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
        <button type="button" className="w-full px-4 py-3 text-left" onClick={() => toggle("retention")}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/65 uppercase">Retention & Churn</div>
            <div className="text-[11px] text-white/45">{open.retention ? "Hide" : "Show"}</div>
          </div>
        </button>
        {open.retention ? (
          <div className="px-4 pb-4 grid grid-cols-1 gap-3">
            <LeverSliderRow
              label="Monthly churn rate"
              description="Customer revenue attrition per month."
              value={draft.monthlyChurnRate}
              baselineValue={baseline.leverConfig.monthlyChurnRate}
              min={0}
              max={0.2}
              step={0.0025}
              format={fmtPct}
              parse={parsePct}
              onChange={(v) => setLever("monthlyChurnRate", v)}
              onCommit={() => commitNow("monthlyChurnRate", draft.monthlyChurnRate)}
            />
            <LeverSliderRow
              label="Net revenue retention"
              description="Expansion minus contraction; 100% means flat existing cohort."
              value={draft.netRevenueRetention}
              baselineValue={baseline.leverConfig.netRevenueRetention}
              min={0.6}
              max={1.5}
              step={0.005}
              format={(v) => `${Math.round(v * 100)}%`}
              parse={(raw) => {
                const p = parsePct(raw);
                return p == null ? null : p;
              }}
              onChange={(v) => setLever("netRevenueRetention", v)}
              onCommit={() => commitNow("netRevenueRetention", draft.netRevenueRetention)}
            />
          </div>
        ) : null}
      </div>

      {/* MODULE: Cost Structure */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
        <button type="button" className="w-full px-4 py-3 text-left" onClick={() => toggle("costs")}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/65 uppercase">Cost Structure</div>
            <div className="text-[11px] text-white/45">{open.costs ? "Hide" : "Show"}</div>
          </div>
        </button>
        {open.costs ? (
          <div className="px-4 pb-4 grid grid-cols-1 gap-3">
            <LeverSliderRow
              label="Headcount"
              description="Total employees (used for revenue/employee + cost approximation)."
              value={draft.headcount}
              baselineValue={baseline.leverConfig.headcount}
              min={0}
              max={500}
              step={1}
              format={(v) => `${Math.round(v)}`}
              parse={parseIntLike}
              onChange={(v) => setLever("headcount", v, "now")}
              onCommit={() => commitNow("headcount", draft.headcount)}
            />
            <LeverSliderRow
              label="Avg fully loaded cost (annual)"
              description="Blended salary + benefits + overhead per employee."
              value={draft.avgFullyLoadedCost}
              baselineValue={baseline.leverConfig.avgFullyLoadedCost}
              min={80_000}
              max={350_000}
              step={5_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("avgFullyLoadedCost", v)}
              onCommit={() => commitNow("avgFullyLoadedCost", draft.avgFullyLoadedCost)}
            />
            <LeverSliderRow
              label="Sales & Marketing spend (monthly)"
              description="Variable + fixed go-to-market cost line."
              value={draft.salesMarketingSpendMonthly}
              baselineValue={baseline.leverConfig.salesMarketingSpendMonthly}
              min={0}
              max={Math.max(50_000, bounds.burnMax)}
              step={5_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("salesMarketingSpendMonthly", v)}
              onCommit={() => commitNow("salesMarketingSpendMonthly", draft.salesMarketingSpendMonthly)}
            />
            <LeverSliderRow
              label="R&D spend (monthly)"
              description="Product + engineering spend line."
              value={draft.rdSpendMonthly}
              baselineValue={baseline.leverConfig.rdSpendMonthly}
              min={0}
              max={Math.max(50_000, bounds.burnMax)}
              step={5_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("rdSpendMonthly", v)}
              onCommit={() => commitNow("rdSpendMonthly", draft.rdSpendMonthly)}
            />
            <LeverSliderRow
              label="Operating Costs (G&A) (monthly)"
              description="General & administrative spend line."
              value={draft.operatingCostsMonthly}
              baselineValue={baseline.leverConfig.operatingCostsMonthly}
              min={0}
              max={Math.max(50_000, bounds.burnMax)}
              step={5_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("operatingCostsMonthly", v)}
              onCommit={() => commitNow("operatingCostsMonthly", draft.operatingCostsMonthly)}
            />
          </div>
        ) : null}
      </div>

      {/* MODULE: Funding & Runway */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
        <button type="button" className="w-full px-4 py-3 text-left" onClick={() => toggle("funding")}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/65 uppercase">Funding & Runway</div>
            <div className="text-[11px] text-white/45">{open.funding ? "Hide" : "Show"}</div>
          </div>
        </button>
        {open.funding ? (
          <div className="px-4 pb-4 grid grid-cols-1 gap-3">
            <LeverSliderRow
              label="Cash on hand"
              description="Available cash. Runway is derived from this and net burn."
              value={draft.cashOnHand}
              baselineValue={baseline.leverConfig.cashOnHand}
              min={0}
              max={bounds.cashMax}
              step={50_000}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("cashOnHand", v)}
              onCommit={() => commitNow("cashOnHand", draft.cashOnHand)}
            />
            <LeverSliderRow
              label="Monthly net burn"
              description="Net cash burn per month (positive)."
              value={draft.monthlyNetBurn}
              baselineValue={baseline.leverConfig.monthlyNetBurn}
              min={0}
              max={bounds.burnMax}
              step={2_500}
              format={fmtMoney}
              parse={parseMoney}
              onChange={(v) => setLever("monthlyNetBurn", v)}
              onCommit={() => commitNow("monthlyNetBurn", draft.monthlyNetBurn)}
            />
          </div>
        ) : null}
      </div>

      {/* MODULE: Strategic Moves (stub for now; structure is here) */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20">
        <button type="button" className="w-full px-4 py-3 text-left" onClick={() => toggle("strategy")}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/65 uppercase">Strategic Moves</div>
            <div className="text-[11px] text-white/45">{open.strategy ? "Hide" : "Show"}</div>
          </div>
        </button>
        {open.strategy ? (
          <div className="px-4 pb-4">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-[12px] text-white/65">
              Strategic moves module is scaffolded. Next pass: add toggles (launch/expansion/hiring plan) and connect to
              the simulation adapter.
            </div>
          </div>
        ) : null}
      </div>
    </TitaniumPanel>
  );
}

export default ScenarioControlsPanel;


