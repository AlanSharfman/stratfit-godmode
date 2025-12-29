import React from "react";

export type CenterView = "terrain" | "variance" | "systemBrief" | "actuals";

type Props = {
  value: CenterView;
  onChange: (m: CenterView) => void;
  className?: string;
};

const tabs: { key: CenterView; label: string }[] = [
  { key: "terrain", label: "Terrain" },
  { key: "variance", label: "Variances" },
  { key: "actuals", label: "Actuals" },
];

function TabIcon({ k }: { k: CenterView }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (k === "terrain") {
    // stacked layers
    return (
      <svg {...common}>
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="M2 12l10 5 10-5" />
        <path d="M2 17l10 5 10-5" />
      </svg>
    );
  }

  if (k === "variance") {
    // pulse/variance line
    return (
      <svg {...common}>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    );
  }

  // actuals: bar chart
  return (
    <svg {...common}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </svg>
  );
}

export default function CenterViewSegmented({ value, onChange, className }: Props) {
  return (
    <div className={className ?? ""}>
      <div
        className="
          inline-flex h-11 items-center rounded-2xl
          border border-white/10
          bg-gradient-to-b from-black/35 to-black/75
          px-1.5 gap-1.5
          shadow-[0_10px_26px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.05)]
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
                "h-9 rounded-xl px-4 text-[15px] font-semibold tracking-[0.01em] transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-0",
                active
                  ? "text-white border border-white/12 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_28px_rgba(0,0,0,0.38)]"
                  : "text-white/60 hover:text-white/85 hover:bg-white/[0.03] border border-transparent",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">
                <TabIcon k={t.key} />
                <span>{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
