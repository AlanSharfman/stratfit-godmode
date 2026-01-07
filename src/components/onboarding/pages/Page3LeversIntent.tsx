import React, { useId, useMemo } from "react";
import type { OnboardingData, OnboardingPreset } from "../onboarding.types";
import TerrainDerivative from "../TerrainDerivative";
import { presetToTerrainParams } from "../terrainParams";

type Props = {
  value: OnboardingData;
  onUpdate: (next: OnboardingData) => void;
  onBack: () => void;
  onNext: () => void;
};

type Chip<T extends string> = {
  key: T;
  label: string;
  hint: string;
  accentRgb: string; // "r,g,b"
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SegmentGroup<T extends string>(props: {
  title: string;
  subtitle?: string;
  value: T;
  options: ReadonlyArray<Chip<T>>;
  onChange: (next: T) => void;
  name: string;
}) {
  const { title, subtitle, value, options, onChange, name } = props;

  return (
    <fieldset className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <legend className="px-2 text-[11px] font-extrabold tracking-[0.14em] uppercase text-white/55">
        {title}
      </legend>
      {subtitle ? (
        <div className="mt-1 px-2 text-[13px] text-white/60">{subtitle}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map((opt) => {
          const active = opt.key === value;
          const glow = `rgba(${opt.accentRgb}, ${active ? "0.26" : "0"})`;
          const ring = `rgba(${opt.accentRgb}, ${active ? "0.55" : "0.12"})`;

          return (
            <label
              key={opt.key}
              className={cx(
                "relative cursor-pointer rounded-2xl border px-4 py-4 transition-all",
                "bg-gradient-to-b from-slate-950/60 to-black/60",
                "hover:border-white/20",
                active ? "border-white/25" : "border-white/10"
              )}
              style={{
                boxShadow: active ? `0 0 0 1px ${ring}, 0 0 24px ${glow}` : undefined,
              }}
            >
              <input
                className="sr-only"
                type="radio"
                name={name}
                value={opt.key}
                checked={active}
                onChange={() => onChange(opt.key)}
              />

              <span
                aria-hidden="true"
                className={cx(
                  "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
                style={{
                  background: `radial-gradient(600px 220px at 20% 0%, rgba(${opt.accentRgb}, 0.18), transparent 55%)`,
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-extrabold text-white/90">
                    {opt.label}
                  </div>
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    aria-hidden="true"
                    style={{
                      background: `rgba(${opt.accentRgb}, 0.95)`,
                      boxShadow: active
                        ? `0 0 10px rgba(${opt.accentRgb}, 0.55)`
                        : `0 0 6px rgba(${opt.accentRgb}, 0.28)`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[12px] leading-snug text-white/60">
                  {opt.hint}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Page3LeversIntent({ value, onUpdate, onBack, onNext }: Props) {
  const headingId = useId();
  const descId = useId();

  const preset = value.preset;
  const canContinue = useMemo(() => true, []);
  const terrainParams = useMemo(() => presetToTerrainParams(preset), [preset]);

  const setPreset = (next: OnboardingPreset) => {
    onUpdate({ ...value, preset: next });
  };

  const growthOptions: ReadonlyArray<Chip<OnboardingPreset["growthPosture"]>> = [
    { key: "conservative", label: "Conservative", hint: "Protect runway. Fewer bets, higher certainty.", accentRgb: "94,234,212" },
    { key: "balanced", label: "Balanced", hint: "Maintain momentum with controlled burn.", accentRgb: "147,197,253" },
    { key: "aggressive", label: "Aggressive", hint: "Push growth. Accept volatility and drawdown risk.", accentRgb: "129,140,248" },
  ];

  const burnOptions: ReadonlyArray<Chip<OnboardingPreset["burnDiscipline"]>> = [
    { key: "tight", label: "Tight", hint: "Spend discipline. Extend runway under pressure.", accentRgb: "94,234,212" },
    { key: "normal", label: "Normal", hint: "Keep the machine steady. No heroics.", accentRgb: "147,197,253" },
    { key: "loose", label: "Loose", hint: "Invest into capability. Higher cash sensitivity.", accentRgb: "129,140,248" },
  ];

  const riskOptions: ReadonlyArray<Chip<OnboardingPreset["riskAppetite"]>> = [
    { key: "low", label: "Low", hint: "Bias to resilience. Avoid fragile trajectories.", accentRgb: "94,234,212" },
    { key: "medium", label: "Medium", hint: "Take measured risk when signal is strong.", accentRgb: "147,197,253" },
    { key: "high", label: "High", hint: "High variance. Trade stability for upside.", accentRgb: "129,140,248" },
  ];

  const speedOptions: ReadonlyArray<Chip<OnboardingPreset["executionBias"]>> = [
    { key: "certainty", label: "Certainty", hint: "De-risk first. Validate before scaling.", accentRgb: "94,234,212" },
    { key: "balanced", label: "Balanced", hint: "Move fast with guardrails and checks.", accentRgb: "147,197,253" },
    { key: "speed", label: "Speed", hint: "Ship and iterate. Accept rework.", accentRgb: "129,140,248" },
  ];

  return (
    <section aria-labelledby={headingId} aria-describedby={descId}>
      <div className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-white/55">
        Step 3 / 4
      </div>
      <h2 id={headingId} className="mt-2 text-[26px] font-black text-white/92">
        Levers & Intent
      </h2>
      <p id={descId} className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/60">
        This sets your default posture. It does not change the underlying engine yet — it only arms your starting stance.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* LEFT: terrain visual */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/85 to-black/90 shadow-[0_24px_70px_rgba(0,0,0,0.55)] lg:col-span-7">
          {/* Ambient cyan glow (no orange) */}
          <div
            className="pointer-events-none absolute -inset-24 blur-2xl"
            style={{
              background: "radial-gradient(closest-side, rgba(0,204,255,0.14), rgba(0,0,0,0) 70%)",
            }}
          />

          <TerrainDerivative
            className="h-[280px] sm:h-[360px] lg:h-[520px]"
            params={terrainParams}
            showGhostRidges
          />

          {/* Title overlay */}
          <div className="pointer-events-none absolute left-4 top-4">
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-white/55 uppercase">
              Define your terrain
            </div>
            <div className="mt-1 max-w-[28rem] text-[13px] font-semibold text-white/80">
              Shape assumptions. Watch the landscape respond.
            </div>
          </div>
        </div>

        {/* RIGHT: preset levers */}
        <div className="space-y-4 lg:col-span-5">
          <SegmentGroup
            title="Growth posture"
            subtitle="How hard you push growth relative to stability."
            value={preset.growthPosture}
            options={growthOptions}
            onChange={(next) => setPreset({ ...preset, growthPosture: next })}
            name="growthPosture"
          />
          <SegmentGroup
            title="Burn discipline"
            subtitle="How tight your spending stance is at the start."
            value={preset.burnDiscipline}
            options={burnOptions}
            onChange={(next) => setPreset({ ...preset, burnDiscipline: next })}
            name="burnDiscipline"
          />
          <SegmentGroup
            title="Risk appetite"
            subtitle="How much variance you accept in the trajectory."
            value={preset.riskAppetite}
            options={riskOptions}
            onChange={(next) => setPreset({ ...preset, riskAppetite: next })}
            name="riskAppetite"
          />
          <SegmentGroup
            title="Execution bias"
            subtitle="Speed vs certainty when operating the machine."
            value={preset.executionBias}
            options={speedOptions}
            onChange={(next) => setPreset({ ...preset, executionBias: next })}
            name="executionBias"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-extrabold text-white/85 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4ff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className={cx(
            "rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4ff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]",
            canContinue
              ? "border-cyan-300/50 bg-cyan-400/10 text-white/90 hover:border-cyan-200/60"
              : "border-white/10 bg-white/5 text-white/35"
          )}
        >
          Next
        </button>
      </div>
    </section>
  );
}

