import { memo, useCallback, useRef } from "react";

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: SliderProps) {
  const rafRef = useRef<number | null>(null);

  // Throttle slider updates with requestAnimationFrame for 60fps
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        onChange(newValue);
        rafRef.current = null;
      });
    },
    [onChange]
  );

  return (
    <div className="flex flex-col p-4 bg-[#0f1b34] rounded-xl border border-[#1e2b45] transition-all hover:border-cyan-500/30">
      <div className="text-gray-300 text-sm mb-2 font-medium">{label}</div>

      <input
        type="range"
        className="w-full slider-thumb cursor-pointer"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />

      <div className="text-white text-center mt-1 font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}

export default memo(Slider);

