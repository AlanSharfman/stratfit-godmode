// src/components/compare/MetricCard.tsx
// STRATFIT — Metric Card Component

import React from "react";

type Tone = "cyan" | "gold" | "emerald" | "red" | "slate";

const toneMap: Record<Tone, { ring: string; text: string }> = {
  cyan: { ring: "ring-cyan-500/25", text: "text-cyan-300" },
  gold: { ring: "ring-amber-500/25", text: "text-amber-300" },
  emerald: { ring: "ring-emerald-500/25", text: "text-emerald-300" },
  red: { ring: "ring-red-500/25", text: "text-red-300" },
  slate: { ring: "ring-slate-500/25", text: "text-slate-200" },
};

export function MetricCard({
  title,
  value,
  sub,
  tone = "slate",
}: {
  title: string;
  value: string;
  sub: string;
  tone?: Tone;
}) {
  const t = toneMap[tone];

  return (
    <div className={`col-span-3 bg-[#070f1a] border border-slate-800/60 rounded-xl px-4 py-3 ring-1 ${t.ring}`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
        {title}
      </div>
      <div className={`mt-2 text-[22px] font-semibold tracking-tight ${t.text}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] text-slate-500 font-mono">
        {sub}
      </div>
    </div>
  );
}

