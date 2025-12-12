import KPISparkline from "./KPISparkline";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  active: boolean;
  onClick: () => void;
  sparkValues: number[];
}

export default function KPICard({
  label,
  value,
  unit,
  active,
  onClick,
  sparkValues,
}: KPICardProps) {
  const accent = active ? "#22d3ee" : "rgba(148, 163, 184, 0.8)";

  return (
    <div
      onClick={onClick}
      className={[
        "relative cursor-pointer overflow-hidden group",
        "rounded-xl border px-4 py-3",
        "bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-800/95",
        "transition-transform duration-200 ease-out",
        active
          ? "border-cyan-400 ring-2 ring-cyan-400/70 -translate-y-2 scale-[1.06] kpi-glow"
          : "border-slate-600/70 hover:border-cyan-400/70 hover:-translate-y-1 hover:scale-[1.03]",
      ].join(" ")}
      style={{
        boxShadow: active
          ? "0 0 32px rgba(34,211,238,0.7)"
          : "0 10px 30px rgba(15,23,42,0.9)",
      }}
    >
      {/* subtle top glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col gap-2">
        {/* header row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-slate-200">
            {label}
          </span>
          <span
            className="px-2 py-[2px] rounded-full text-[10px]"
            style={{
              border: `1px solid ${accent}66`,
              color: accent,
              backgroundColor: "rgba(15,23,42,0.9)",
            }}
          >
            Metric
          </span>
        </div>

        {/* main value */}
        <div className="flex items-baseline gap-1">
          <span
            className={
              "font-semibold leading-tight" +
              (active ? " text-cyan-100 text-[24px]" : " text-slate-100 text-[22px]")
            }
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs text-slate-400 mt-[3px]">{unit}</span>
          )}
        </div>

        {/* sparkline */}
        <div className="mt-1">
          <KPISparkline values={sparkValues} />
        </div>

        {/* footer */}
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400/90">
          <span>Last 6–7 periods</span>
          <span className="flex items-center gap-1" style={{ color: accent }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span>Linked</span>
          </span>
        </div>
      </div>
    </div>
  );
}
