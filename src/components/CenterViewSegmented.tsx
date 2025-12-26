import React from "react";

export type CenterView = "terrain" | "variance" | "systemBrief" | "actuals";

type Props = {
  value: CenterView;
  onChange: (m: CenterView) => void;
  className?: string;
};

const tabs: { key: CenterView; label: string }[] = [
  { key: "terrain", label: "TERRAIN" },
  { key: "variance", label: "VARIANCES" },
  { key: "actuals", label: "ACTUALS" },
];

export default function CenterViewSegmented({ value, onChange, className }: Props) {
  return (
    <div className={className ?? ""}>
      <div
        className="
          inline-flex h-11 items-center rounded-2xl
          border border-slate-700/60
          bg-gradient-to-b from-slate-950/80 to-slate-950/95
          px-1.5 gap-1
          shadow-[0_2px_12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(100,116,139,0.15)]
          backdrop-blur-xl
        "
      >
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={[
                "h-8 rounded-xl px-5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-150",
                active
                  ? "text-cyan-300 border border-cyan-400/60 bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 shadow-[0_0_16px_rgba(34,211,238,0.25),inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
