import React from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** If provided, enables "Don't show again" via localStorage */
  storageKey?: string;
};

const DEFAULT_STORAGE_KEY = "stratfit.hideTerrainGuide";

export default function TerrainGuidePage({ storageKey = DEFAULT_STORAGE_KEY }: Props) {
  const nav = useNavigate();

  function markDontShowAgain() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
  }

  return (
    <div className="min-h-screen w-full bg-[#070A0F] text-white">
      {/* subtle vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.07)_0%,rgba(0,0,0,0.0)_35%,rgba(0,0,0,0.75)_75%,rgba(0,0,0,0.92)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.65),rgba(0,0,0,0.85))]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Frame */}
        <div className="rounded-3xl border border-cyan-400/15 bg-white/[0.03] shadow-[0_30px_90px_rgba(0,0,0,0.65)] overflow-hidden">
          <div className="p-10">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-cyan-300">
                Understanding the Terrain
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-white/70">
                The Mountain is STRATFIT&apos;s future-state simulator. <br />
                It shows where today&apos;s decisions lead — not where you&apos;ve been.
              </p>
            </div>

            {/* 4 cards */}
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoCard
                icon="⛰️"
                title="What It Is"
                body="A continuous projection of your business trajectory across 24 months. Height, slope, and edges reveal outcome quality, momentum, and risk."
              />
              <InfoCard
                icon="🎯"
                title="What It Does"
                body="Translates second-order consequences into visceral feedback. Numbers don't tell stories — terrain does."
              />
              <InfoCard
                icon="⚙️"
                title="How It Works"
                body="As you adjust sliders (left), the terrain deforms in real-time, showing compounding effects invisible in spreadsheets."
              />
              <InfoCard
                icon="🤖"
                title="What It Doesn't Do"
                body="The Mountain doesn't judge, advise, or decide. That's the AI panel's job (right). Mountain = Evidence. AI = Judgment."
              />
            </div>

            {/* Core principle slab */}
            <div className="mt-8 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-6 py-5">
              <div className="text-xs font-semibold tracking-widest text-cyan-200/80">
                CORE PRINCIPLE
              </div>
              <div className="mt-2 text-lg text-white/90">
                The Mountain shows what happens if you keep going.
                <br />
                The AI tells you whether you should.
              </div>
            </div>

            {/* Reading the terrain */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-cyan-300">Reading the Terrain</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Pill label="Height" desc="Outcome quality" />
                <Pill label="Slope" desc="Momentum or decay" />
                <Pill label="Cliffs" desc="Failure modes" />
                <Pill label="Peaks" desc="Opportunities" />
                <Pill label="Plateaus" desc="Stagnation" />
                <Pill label="Jagged edges" desc="Volatility" />
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => nav("/")}
                  className="rounded-xl bg-cyan-400 px-7 py-3 text-sm font-semibold text-black shadow-[0_12px_35px_rgba(34,211,238,0.25)] hover:bg-cyan-300 active:translate-y-[1px]"
                >
                  Got It — Start Exploring
                </button>

                <button
                  onClick={() => nav("/tour")}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-7 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.09] active:translate-y-[1px]"
                >
                  Take the Interactive Tour
                </button>
              </div>

              <button
                onClick={() => {
                  markDontShowAgain();
                  nav("/");
                }}
                className="mt-1 text-xs text-white/40 hover:text-white/60"
              >
                Don't show this again
              </button>
            </div>
          </div>

          {/* subtle bottom fade */}
          <div className="h-10 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.55))]" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-lg">
          {icon}
        </div>
        <div className="text-lg font-semibold text-cyan-300">{title}</div>
      </div>
      <div className="mt-4 text-sm leading-relaxed text-white/70">{body}</div>
    </div>
  );
}

function Pill({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-sm font-semibold text-cyan-200">{label}</div>
      <div className="text-xs text-white/55">= {desc}</div>
    </div>
  );
}
