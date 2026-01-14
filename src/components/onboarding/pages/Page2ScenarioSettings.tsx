// src/components/onboarding/pages/Page2ScenarioSettings.tsx
// Page 2 — Scenario Settings (G-D MODE)
// Non-negotiables:
// - No orange anywhere
// - Validation: never allow zero enabled scenarios
// - Keyboard: Enter/Space toggles
// - Micro-interactions: glow + soft pulse (framer-motion)

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { HorizonMonths, ScenarioKey, ScenarioSettings, ViewMode } from "../onboarding.types";
import {
  DEFAULT_SCENARIO_SETTINGS,
  countEnabledScenarios,
  ensureAtLeastOneScenario,
} from "../onboarding.types";

type Props = {
  value?: ScenarioSettings;
  onUpdate: (next: ScenarioSettings) => void;
  onNext: () => void;
  onBack: () => void;
};

const HORIZONS: readonly HorizonMonths[] = [12, 24, 36, 48, 60] as const;

const SCENARIO_META: Readonly<
  Record<ScenarioKey, { label: string; hint: string; accent: "cyan" | "emerald" | "indigo" | "red" }>
> = {
  base: { label: "Base", hint: "Anchor scenario for comparisons.", accent: "cyan" },
  upside: { label: "Upside", hint: "Tailwinds + stronger execution.", accent: "emerald" },
  downside: { label: "Downside", hint: "Headwinds + conservative constraints.", accent: "indigo" },
  stress: { label: "Stress", hint: "Stress test. Rare regime shifts.", accent: "red" },
} as const;

function accentRGB(a: "cyan" | "emerald" | "indigo" | "red") {
  switch (a) {
    case "cyan":
      return "0,204,255";
    case "emerald":
      return "52,211,153";
    case "indigo":
      return "129,140,248";
    case "red":
      return "248,113,113";
    default:
      return "0,204,255";
  }
}

function onKeyActivate(e: React.KeyboardEvent, action: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
}

export default function Page2ScenarioSettings({ value, onUpdate, onNext, onBack }: Props) {
  const settings = value ?? DEFAULT_SCENARIO_SETTINGS;

  const enabledCount = useMemo(() => countEnabledScenarios(settings.scenarios), [settings.scenarios]);

  const [error, setError] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState<string>("");
  const blockedKeyRef = useRef<ScenarioKey | null>(null);

  const setHorizon = useCallback(
    (h: HorizonMonths) => {
      setError(null);
      onUpdate({ ...settings, horizon: h });
      setPulseKey(`h-${h}-${Date.now()}`);
    },
    [onUpdate, settings]
  );

  const setViewMode = useCallback(
    (vm: ViewMode) => {
      setError(null);
      onUpdate({ ...settings, viewMode: vm });
      setPulseKey(`vm-${vm}-${Date.now()}`);
    },
    [onUpdate, settings]
  );

  const toggleScenario = useCallback(
    (key: ScenarioKey) => {
      const next = { ...settings.scenarios, [key]: !settings.scenarios[key] };

      if (countEnabledScenarios(next) === 0) {
        blockedKeyRef.current = key;
        setError("At least one scenario must remain enabled.");
        setPulseKey(`block-${key}-${Date.now()}`);
        return;
      }

      blockedKeyRef.current = null;
      setError(null);
      onUpdate({ ...settings, scenarios: ensureAtLeastOneScenario(next) });
      setPulseKey(`sc-${key}-${Date.now()}`);
    },
    [onUpdate, settings]
  );

  const handleNext = useCallback(() => {
    if (enabledCount === 0) {
      setError("At least one scenario must be enabled to continue.");
      setPulseKey(`err-${Date.now()}`);
      return;
    }
    setError(null);
    onNext();
  }, [enabledCount, onNext]);

  return (
    <motion.section
      aria-label="Scenario settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-b from-slate-950/90 to-black/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
    >
      {/* Ambient cyan glow (no orange) */}
      <div
        className="pointer-events-none absolute -inset-24 blur-2xl"
        style={{
          background: "radial-gradient(closest-side, rgba(0,204,255,0.14), rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
        Onboarding • Scenario Settings
      </div>
      <div className="mt-1 text-[22px] font-black tracking-[-0.02em] text-white/90">
        Set the scenario frame.
      </div>
      <div className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/65">
        Choose a horizon, enable scenarios, and set your view mode. You can change these later.
      </div>

      {/* Horizon */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
              Horizon
            </div>
            <div className="mt-1 text-[12px] text-white/60">Select your planning window.</div>
          </div>

          <div role="group" aria-label="Horizon selector" className="flex flex-wrap gap-2">
            {HORIZONS.map((h) => {
              const active = settings.horizon === h;
              return (
                <motion.button
                  key={h}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setHorizon(h)}
                  onKeyDown={(e) => onKeyActivate(e, () => setHorizon(h))}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  className={[
                    "rounded-xl px-3 py-2 text-[13px] font-extrabold tracking-[0.02em] outline-none",
                    "border transition",
                    active
                      ? "border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_0_0_1px_rgba(0,204,255,0.14)_inset,0_10px_28px_rgba(0,0,0,0.35)]"
                      : "border-white/10 bg-white/5 text-white/85 hover:border-white/20",
                    "focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0",
                  ].join(" ")}
                >
                  {h}m
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
              Scenarios
            </div>
            <div className="mt-1 text-[12px] text-white/60">
              Enable the set you want by default. At least one must stay on.
            </div>
          </div>

          <div role="group" aria-label="Scenario toggles" className="flex flex-wrap gap-2">
            {(Object.keys(SCENARIO_META) as ScenarioKey[]).map((k) => {
              const meta = SCENARIO_META[k];
              const active = settings.scenarios[k];
              const rgb = accentRGB(meta.accent);
              const blocked = blockedKeyRef.current === k && pulseKey.startsWith("block-");

              return (
                <motion.button
                  key={k}
                  type="button"
                  role="switch"
                  aria-checked={active}
                  aria-label={`${meta.label} scenario`}
                  onClick={() => toggleScenario(k)}
                  onKeyDown={(e) => onKeyActivate(e, () => toggleScenario(k))}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  animate={blocked ? { x: [0, -3, 3, -2, 2, 0] } : undefined}
                  transition={{ duration: blocked ? 0.28 : 0.18 }}
                  className={[
                    "min-w-[170px] rounded-xl border px-3 py-2 text-left outline-none transition",
                    active ? "text-white" : "text-white/85",
                    "focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0",
                  ].join(" ")}
                  style={{
                    background: active ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.04)",
                    borderColor: active ? `rgba(${rgb},0.44)` : "rgba(255,255,255,0.10)",
                    boxShadow: active
                      ? `0 0 0 1px rgba(${rgb},0.12) inset, 0 14px 34px rgba(0,0,0,0.40)`
                      : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold">{meta.label}</div>
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: active ? `rgba(${rgb},0.90)` : "rgba(255,255,255,0.18)",
                        boxShadow: active ? `0 0 18px rgba(${rgb},0.45)` : "none",
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[12px] leading-snug text-white/60">{meta.hint}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px] text-white/55">
          <div>
            Enabled: <span className="font-extrabold text-white/85">{enabledCount}</span>
          </div>
          <div>
            Extreme defaults to <span className="font-extrabold text-white/85">OFF</span>
          </div>
        </div>
      </div>

      {/* View Mode */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.14em] text-white/55 uppercase">
              View Mode
            </div>
            <div className="mt-1 text-[12px] text-white/60">Controls default emphasis and language.</div>
          </div>

          <div role="group" aria-label="View mode selector" className="flex flex-wrap gap-2">
            {([
              {
                key: "operator",
                label: "Operator",
                hint: "Operate the machine. Levers, capacity, execution.",
                rgb: "0,204,255",
              },
              {
                key: "investor",
                label: "Investor",
                hint: "Evaluate outcomes. Risk, resilience, trajectory.",
                rgb: "129,140,248",
              },
            ] as const).map((vm) => {
              const active = settings.viewMode === vm.key;
              return (
                <motion.button
                  key={vm.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setViewMode(vm.key)}
                  onKeyDown={(e) => onKeyActivate(e, () => setViewMode(vm.key))}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  className={[
                    "min-w-[220px] rounded-xl border px-3 py-2 text-left outline-none transition",
                    "focus-visible:ring-2 focus-visible:ring-cyan-300/40 focus-visible:ring-offset-0",
                  ].join(" ")}
                  style={{
                    background: active ? `rgba(${vm.rgb},0.12)` : "rgba(255,255,255,0.04)",
                    borderColor: active ? `rgba(${vm.rgb},0.44)` : "rgba(255,255,255,0.10)",
                    boxShadow: active
                      ? `0 0 0 1px rgba(${vm.rgb},0.12) inset, 0 14px 34px rgba(0,0,0,0.40)`
                      : "none",
                    color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.85)",
                  }}
                >
                  <div className="font-extrabold">{vm.label}</div>
                  <div className="mt-1 text-[12px] leading-snug text-white/60">{vm.hint}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <motion.div
          key={pulseKey}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-3 rounded-xl border border-red-300/35 bg-red-400/10 px-3 py-2 text-[13px] font-extrabold text-white/85"
        >
          {error}
        </motion.div>
      ) : null}

      {/* Nav */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          onKeyDown={(e) => onKeyActivate(e, onBack)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-extrabold tracking-[0.02em] text-white/85 outline-none hover:border-white/20 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        >
          Back
        </motion.button>

        <motion.button
          type="button"
          onClick={handleNext}
          onKeyDown={(e) => onKeyActivate(e, handleNext)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          className="rounded-xl border border-cyan-300/50 bg-cyan-400/10 px-4 py-2 text-[13px] font-extrabold tracking-[0.02em] text-white/90 outline-none hover:border-cyan-200/60 focus-visible:ring-2 focus-visible:ring-cyan-300/40 shadow-[0_16px_40px_rgba(0,0,0,0.40),0_0_0_1px_rgba(0,204,255,0.10)_inset]"
        >
          Next
        </motion.button>
      </div>
    </motion.section>
  );
}
