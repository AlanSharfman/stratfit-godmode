import { useEffect, useMemo, useState } from "react";
import CenterViewTabs, { CenterView } from "./CenterViewTabs";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";

import BriefingPanel from "@/components/briefing/BriefingPanel";
import {
  getSoundEnabled,
  isBriefingSeen,
  setBriefingSeen,
  setSoundEnabled,
  type BriefingKey,
} from "@/components/briefing/briefingStorage";

function viewToBriefingKey(view: CenterView): BriefingKey {
  return view;
}

function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.9"
      />
      <path
        d="M12 10.6v6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 7.6h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerIcon({
  on,
  className = "",
}: {
  on: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {on ? (
        <>
          <path
            d="M15.5 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M17.8 6.2a8 8 0 0 1 0 11.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.65"
          />
        </>
      ) : (
        <path
          d="M16.5 9.5 20 13m0-3.5-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}
    </svg>
  );
}

import { useScenario, useDataPoints } from "@/state/scenarioStore";

export default function CenterViewPanel() {
  const [view, setView] = useState<CenterView>("terrain");
  const scenario = useScenario();
  const dataPoints = useDataPoints();

  // briefing controls
  const briefingKey = useMemo(() => viewToBriefingKey(view), [view]);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingNonce, setBriefingNonce] = useState(0);

  const [soundOn, setSoundOnState] = useState<boolean>(() => getSoundEnabled());

  // Auto-open briefing first time per view (per user), without sound unless user enabled it.
  useEffect(() => {
    const seen = isBriefingSeen(briefingKey);
    if (!seen) {
      setBriefingOpen(true);
      setBriefingNonce((n) => n + 1);
    } else {
      setBriefingOpen(false);
    }
  }, [briefingKey]);

  const openBriefing = () => {
    setBriefingOpen(true);
    setBriefingNonce((n) => n + 1);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);

    // If user turns sound on, we treat it as a “gesture” moment—retrigger the briefing typing nicely.
    if (next) openBriefing();
  };

  return (
    <div className="relative h-full w-full rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-hidden">
      {/* Header Strip */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between gap-3">
          <CenterViewTabs value={view} onChange={setView} />

          {/* Controls (small, premium, no clutter) */}
          <div className="flex items-center gap-2">
            <button
              onMouseEnter={openBriefing} // ⓘ hover re-trigger
              onClick={() => (briefingOpen ? setBriefingOpen(false) : openBriefing())}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition"
              title="Briefing"
              aria-label="Briefing"
            >
              <InfoIcon className="text-white/70" />
              <span className="hidden sm:inline">Brief</span>
            </button>

            <button
              onClick={toggleSound}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition"
              title={soundOn ? "Typing sound: On" : "Typing sound: Off"}
              aria-label="Toggle typing sound"
            >
              <SpeakerIcon on={soundOn} className="text-white/70" />
              <span className="hidden sm:inline">{soundOn ? "Sound" : "Silent"}</span>
            </button>
          </div>
        </div>

        {/* Briefing Panel (green box requirement) */}
        <BriefingPanel
          briefingKey={briefingKey}
          open={briefingOpen}
          soundEnabled={soundOn}
          onClose={() => setBriefingOpen(false)}
          onSeen={() => setBriefingSeen(briefingKey)}
          forceNonce={briefingNonce}
        />
      </div>

      {/* Content Area */}
      <div className="relative h-[calc(100%-52px)] w-full">
        {view === "terrain" && (
          <div className="absolute inset-0">
            <ScenarioMountain scenario={scenario} dataPoints={dataPoints} />
          </div>
        )}

        {view === "variance" && (
          <div className="h-full w-full overflow-auto px-4 py-4">
            <ScenarioDeltaSnapshot />
          </div>
        )}

        {view === "actuals" && (
          <div className="h-full w-full overflow-auto px-4 py-4">
            <div className="h-full w-full rounded-lg border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold text-white">
                Actuals vs Scenario
              </div>
              <div className="mt-1 text-xs text-white/50">
                Connect Actuals to unlock variance tracking, alerts, and commentary.
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Revenue", "ARR", "Burn", "Cash", "Runway", "Risk Score"].map((m) => (
                  <div
                    key={m}
                    className="rounded-md border border-white/10 bg-black/30 p-3"
                  >
                    <div className="text-[11px] text-white/50">{m}</div>
                    <div className="mt-2 text-sm text-white/70">—</div>
                    <div className="mt-1 text-[11px] text-white/35">Actuals pending</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] text-white/50">Commentary</div>
                <div className="mt-2 text-sm text-white/60">
                  Placeholder: once actuals are connected, we’ll generate CFO-grade narrative
                  explaining variance drivers.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
