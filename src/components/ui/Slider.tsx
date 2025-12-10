// src/components/ui/Slider.tsx

import { useState } from "react";

interface SliderProps {
  label: string;
  value?: number;
  onChange?: (val: number) => void;
}

export default function Slider({ label, value = 50, onChange }: SliderProps) {
  const [hover, setHover] = useState(false);

  return (
    <div className="flex flex-col w-full">
      {/* Label Row */}
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-300">{label}</span>
        <span className="text-xs text-cyan-300">{value}%</span>
      </div>

      {/* Slider Container */}
      <div
        className="relative w-full"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* VALUE BUBBLE */}
        <div
          className={`
            absolute -top-6 px-2 py-1 rounded-md text-xs bg-[#0d1828] border border-cyan-400
            transition-all duration-300 pointer-events-none
            ${hover ? "opacity-100 scale-100" : "opacity-0 scale-75"}
          `}
          style={{ left: `calc(${value}% - 12px)` }}
        >
          {value}%
        </div>

        {/* SLIDER INPUT */}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="
            w-full appearance-none h-2 rounded-md 
            bg-[#162032] 
            cursor-pointer
          "
          style={{
            background: `linear-gradient(to right, #22d3d3 ${value}%, #162032 ${value}%)`,
          }}
        />

        {/* CUSTOM HANDLE */}
        <style>
          {`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #22d3d3;
              box-shadow: 0 0 10px #22d3d3aa;
              cursor: pointer;
              transition: transform 0.15s ease;
            }

            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.25);
              box-shadow: 0 0 15px #5eead4;
            }

            input[type="range"]::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #22d3d3;
              box-shadow: 0 0 10px #22d3d3aa;
              cursor: pointer;
            }
          `}
        </style>
      </div>
    </div>
  );
}
