import React from "react";

export function BaselineRequiredModal({
  onGoToOnboarding,
}: {
  onGoToOnboarding: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-[0_20px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_0%,rgba(34,211,238,0.18),transparent_60%)]" />

        <div className="relative p-5">
          <div className="text-[11px] font-extrabold tracking-[0.18em] text-white/60">BASELINE REQUIRED</div>
          <div className="mt-2 text-[18px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            Baseline not initialised
          </div>
          <div className="mt-2 text-[12px] leading-[1.5] text-white/70">
            Complete onboarding to generate the baseline truth layer.
          </div>

          <div className="mt-4 flex items-center justify-end gap-10">
            <div className="text-[11px] text-white/50">
              Missing: <span className="text-cyan-200/90">stratfit.baseline.v1</span>
            </div>

            <button
              type="button"
              className="h-[44px] rounded-xl border border-cyan-300/30 bg-gradient-to-b from-cyan-400/20 to-sky-400/12 px-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-cyan-50 shadow-[0_10px_30px_rgba(34,211,238,0.18)] transition hover:from-cyan-400/26 hover:to-sky-400/16 active:translate-y-[1px]"
              onClick={onGoToOnboarding}
              title="Go to onboarding to create a baseline"
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BaselineRequiredModal;


