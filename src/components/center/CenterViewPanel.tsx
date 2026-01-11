import React, { useEffect, useMemo, useState } from "react";
import CenterViewSegmented, { CenterView } from "@/components/CenterViewSegmented";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import ScenarioDeltaSnapshot from "@/components/ScenarioDeltaSnapshot";
import { useScenario, useDataPoints, useScenarioStore } from "@/state/scenarioStore";
import { onCausal } from "@/ui/causalEvents";

import BriefingPanel from "@/components/briefing/BriefingPanel";
import {
  isBriefingSeen,
  setBriefingSeen,
} from "@/components/briefing/briefingStorage";

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

function viewToBriefingKey(view: CenterView): "terrain" | "variance" | "actuals" {
  if (view === "systemBrief") return "variance";
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

export default function CenterViewPanel(props: {
  scenarioControl?: React.ReactNode;
  tourControl?: React.ReactNode;
}) {
  const { scenarioControl, tourControl } = props;
  const [view, setView] = useState<CenterView>("terrain");
  const scenario = useScenario();
  const dataPoints = useDataPoints();
  const hoveredKpiIndex = useScenarioStore((s) => s.hoveredKpiIndex);

  // briefing controls
  const briefingKey = useMemo(() => viewToBriefingKey(view), [view]);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingNonce, setBriefingNonce] = useState(0);

  const [soundOn, setSoundOnState] = useState<boolean>(false); // Default value

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

    // If user turns sound on, we treat it as a “gesture” moment—retrigger the briefing typing nicely.
    if (next) openBriefing();
  };

  // CAUSAL HIGHLIGHT — Mountain band (Phase 1, UI-only)
  const [bandNonce, setBandNonce] = useState(0);
  const [bandStyle, setBandStyle] = useState<"solid" | "wash">("solid");
  const [bandColor, setBandColor] = useState("rgba(34,211,238,0.18)");

  useEffect(() => {
    const off = onCausal((detail) => {
      setBandStyle(detail.bandStyle);
      setBandColor(detail.color);
      setBandNonce((n) => n + 1);
    });
    return off;
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 overflow-hidden">
      {/* Command Bar — reduced left padding to align with KPI boxes */}
      <div className="relative shrink-0 pl-2 pr-4 pt-4 pb-3 border-b border-white/5 bg-gradient-to-b from-black/30 to-transparent">
        {scenarioControl || tourControl ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="justify-self-start">
              <CenterViewSegmented value={view} onChange={setView} />
            </div>
            <div className="justify-self-center">
              {scenarioControl ? <div className="min-w-[260px] scale-[1.08]">{scenarioControl}</div> : null}
            </div>
            <div className="justify-self-end flex items-center scale-[1.08]">
              {tourControl}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-start">
            <CenterViewSegmented value={view} onChange={setView} />
          </div>
        )}

        {/* IMPORTANT: Briefing must not steal mountain height (overlay only) */}
        <BriefingPanel
          className="absolute left-6 right-6 top-full z-20 mt-3"
          briefingKey={briefingKey}
          open={briefingOpen}
          soundEnabled={soundOn}
          onClose={() => setBriefingOpen(false)}
          onSeen={() => setBriefingSeen(briefingKey)}
          forceNonce={briefingNonce}
        />
      </div>

      {/* Center Stage */}
      {/* STRATFIT RULE:
          Mountain dominance locked at ~65% viewport height.
          Do not adjust without design sign-off. */}
      <div className="mountain-stage relative w-full flex-1 p-4" data-tour="mountain">
        {view === "terrain" && (
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-black shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.85)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]" />
            
            {/* Causal highlight band (no labels) — only after explicit user action */}
            {bandNonce > 0 ? (
              <div
                key={bandNonce}
                className={`sf-causal-band play ${bandStyle === "wash" ? "wash" : ""}`}
                style={{ ["--sf-causal" as string]: bandColor } as React.CSSProperties}
              />
            ) : null}

            <div className="relative h-full w-full">
              <ScenarioMountain 
                scenario={scenario} 
                dataPoints={dataPoints}
                activeKpiIndex={hoveredKpiIndex}
              />
            </div>
          </div>
        )}

        {view === "variance" && (
          <div className="h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-950/60 to-black/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
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
