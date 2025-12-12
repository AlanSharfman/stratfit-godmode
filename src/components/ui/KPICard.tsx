import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  sparkline?: ReactNode;
  index: number;
  activeIndex: number | null;
  onActivate: (idx: number) => void;   // hover/click
  onDeactivate: () => void;            // mouse leave
  onSelect?: (idx: number) => void;    // optional click “lock”
}

export default function KPICard({
  title,
  value,
  sub,
  sparkline,
  index,
  activeIndex,
  onActivate,
  onDeactivate,
  onSelect,
}: KPICardProps) {
  const isActive = activeIndex === index;

  return (
    <button
      type="button"
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={onDeactivate}
      onFocus={() => onActivate(index)}
      onBlur={onDeactivate}
      onClick={() => (onSelect ? onSelect(index) : onActivate(index))}
      className={[
        "text-left rounded-2xl border transition-all duration-200",
        "bg-[#0b1426]/70 backdrop-blur-md",
        "px-5 py-4",
        isActive
          ? "border-cyan-300/45 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_32px_rgba(34,211,238,0.18)] translate-y-[-2px]"
          : "border-white/8 hover:border-white/14 hover:shadow-[0_0_24px_rgba(34,211,238,0.08)]",
      ].join(" ")}
    >
      <div className="text-xs tracking-widest text-white/70">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-white/60">{sub}</div> : null}
      {sparkline ? <div className="mt-3">{sparkline}</div> : null}
    </button>
  );
}
