import React from "react";
import Slider from "../ui/Slider";

type BaselineSliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  variant?: string;
  onChange: (v: number) => void;
  highlight?: boolean;
  highlightColor?: string | null;
};

export default function BaselineSlider({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  variant,
  onChange,
  highlight,
  highlightColor,
}: BaselineSliderProps) {
  const handleChange = (v: number) => {
    if (disabled) return;
    onChange(v);
  };

  return (
    <div className={variant ? `baseline-slider ${variant}` : "baseline-slider"} style={disabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        highlight={highlight}
        highlightColor={highlightColor ?? null}
      />
    </div>
  );
}
