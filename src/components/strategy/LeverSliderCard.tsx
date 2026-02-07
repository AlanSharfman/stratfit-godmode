import React from "react";

export function LeverSliderCard(props: {
  title: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  baselineValue?: number;
  showBaseline?: boolean;
  deltaText?: string;
}) {
  const {
    title,
    description,
    value,
    min = 0,
    max = 100,
    // Props below are intentionally accepted for next passes, but not used yet:
    // onChange, baselineValue, showBaseline, deltaText
  } = props;

  const raw = value;
  const clamped = Number.isFinite(raw) ? Math.max(min, Math.min(max, raw)) : raw;
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="text-[10px] font-extrabold tracking-[0.14em] text-white/55 uppercase">{title}</div>
      <div className="mt-2 text-[20px] font-black text-white tabular-nums">{Math.round(raw)}</div>
      <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300/70" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>

      {/* Kept off by default to preserve current visuals/spacing */}
      {description ? (
        <div className="mt-2 text-[11px] leading-[1.4] text-white/50">{description}</div>
      ) : null}

      {/* Reserved for PASS 7A2+ (baseline marker / delta UI) */}
      {props.showBaseline ? null : null}
    </div>
  );
}

export default LeverSliderCard;


