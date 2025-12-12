import { useId } from "react";

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  highlighted?: boolean;
}

export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  highlighted = false,
}: SliderProps) {
  const id = useId();

  return (
    <div
      className={[
        "rounded-2xl border px-5 py-4 bg-[#0b1426]/70 backdrop-blur-md transition-all",
        highlighted
          ? "border-cyan-300/40 shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_0_28px_rgba(34,211,238,0.14)]"
          : "border-white/8",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-white/80">
          {label}
        </label>
        <div className="text-sm text-white/70 tabular-nums">{value}</div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-cyan-300"
      />
    </div>
  );
}
