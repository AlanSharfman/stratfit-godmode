// src/components/command/CommandBriefingPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Briefing Panel
//
// Renders the structured briefing sections with timestamps,
// auto-advance support, probability badges, legend, and audio controls.
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import type { BriefingSection, CommandBriefing } from "../../core/command/generateCommandBriefing";
import BriefingAudioControls from "./BriefingAudioControls";

interface CommandBriefingPanelProps {
  briefing: CommandBriefing;
  /** Currently active director beat index (from useDirectorMode) */
  activeBeatIdx?: number;
  /** Is the director playing? */
  isDirectorPlaying?: boolean;
}

// ── Badge: inline probability call-out ──
function ProbBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/30 mr-1">
      {label}
    </span>
  );
}

// ── Section component ──
function SectionBlock({
  section,
  isActive,
  onClick,
}: {
  section: BriefingSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  const formatTimestamp = (t: number) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Highlight probability/terrain terms inline
  const renderLine = (line: string, idx: number) => {
    const probRegex = /(P10|P50|P90|P\d{1,2}|probability|dispersion|robustness|likelihood)/gi;
    const parts = line.split(probRegex);
    return (
      <p key={idx} className="text-sm leading-relaxed text-slate-200 mt-1.5">
        {parts.map((part, pi) =>
          probRegex.test(part) ? (
            <ProbBadge key={pi} label={part} />
          ) : (
            <span key={pi}>{part}</span>
          ),
        )}
      </p>
    );
  };

  return (
    <div
      ref={sectionRef}
      onClick={onClick}
      className={`group relative px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ${
        isActive
          ? "bg-cyan-900/20 border border-cyan-700/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
          : "bg-transparent border border-transparent hover:bg-slate-800/40 hover:border-slate-700/30"
      }`}
    >
      {/* Timestamp + Title */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-[10px] font-mono tabular-nums text-cyan-600/70 tracking-wider">
          {formatTimestamp(section.t)}
        </span>
        <h4
          className={`text-xs font-semibold uppercase tracking-widest ${
            isActive ? "text-cyan-400" : "text-slate-400"
          }`}
        >
          {section.title}
        </h4>
      </div>

      {/* Lines */}
      <div className={`${isActive ? "max-h-[400px] opacity-100" : "max-h-[60px] opacity-70"} overflow-hidden transition-all duration-400`}>
        {section.lines.map((line, i) => renderLine(line, i))}
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-500 rounded-full" />
      )}
    </div>
  );
}

// ── Legend strip ──
function BriefingLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800/60">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-cyan-500 rounded-full inline-block" /> Path trajectory
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-400/40 inline-block" /> Milestone orb
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-2 bg-cyan-800/40 border border-cyan-600/30 rounded inline-block" /> Robustness envelope
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-400/40 inline-block" /> Risk hotspot
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-amber-500/60 rounded-full inline-block" /> Baseline reference
      </span>
    </div>
  );
}

// ── Main panel ──
export default function CommandBriefingPanel({
  briefing,
  activeBeatIdx = 0,
  isDirectorPlaying = false,
}: CommandBriefingPanelProps) {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // 8 beats → 8 sections: 1:1 mapping
  useEffect(() => {
    if (!isDirectorPlaying) return;
    const sectionCount = briefing.sections.length;
    const mapped = Math.min(activeBeatIdx, sectionCount - 1);
    setActiveSectionIdx(mapped);
  }, [activeBeatIdx, isDirectorPlaying, briefing.sections.length]);

  const handleSectionClick = useCallback((idx: number) => {
    setActiveSectionIdx(idx);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
          Intelligence Briefing
        </h3>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {briefing.durationSec}s documentary analysis • {briefing.sections.length} sections
        </p>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {briefing.sections.map((section: BriefingSection, idx: number) => (
          <SectionBlock
            key={idx}
            section={section}
            isActive={idx === activeSectionIdx}
            onClick={() => handleSectionClick(idx)}
          />
        ))}
      </div>

      {/* Legend */}
      <BriefingLegend />

      {/* Audio controls */}
      <div className="px-2 py-2 border-t border-slate-800/60">
        <BriefingAudioControls
          text={briefing.plainText}
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onEnd={() => setAudioPlaying(false)}
        />
      </div>

      {/* Provenance footer */}
      <div className="px-4 py-1.5 text-[9px] text-slate-600 border-t border-slate-900/40 select-none">
        Model-derived indicators only — not investment advice.
        {audioPlaying && <span className="ml-2 text-cyan-600/50 animate-pulse">● Audio active</span>}
      </div>
    </div>
  );
}
