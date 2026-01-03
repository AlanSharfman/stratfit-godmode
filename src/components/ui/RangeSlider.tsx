import React from "react";

type RangeSliderProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  "aria-label"?: string;
};

export default function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ...rest
}: RangeSliderProps) {
  return (
    // Key: overflow-visible + px gutters so thumb never disappears
    <div className="w-full overflow-visible px-2">
      <input
        type="range"
        className={[
          "w-full appearance-none bg-transparent",
          "focus:outline-none focus-visible:outline-none",
          // Track
          "[&::-webkit-slider-runnable-track]:h-1.5",
          "[&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-white/10",
          "[&::-webkit-slider-runnable-track]:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          // Thumb
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-cyan-300/90",
          "[&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(34,211,238,0.12),0_6px_18px_rgba(0,0,0,0.55)]",
          "[&::-webkit-slider-thumb]:-mt-[5px]", // centers thumb on 1.5px track
          disabled ? "opacity-50" : "",
        ].join(" ")}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        {...rest}
      />
    </div>
  );
}
