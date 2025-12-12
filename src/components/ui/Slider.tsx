interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: SliderProps) {
  return (
    <div className="flex flex-col p-4 bg-[#0f1b34] rounded-xl border border-[#1e2b45]">
      <div className="text-gray-300 text-sm mb-2">{label}</div>

      <input
        type="range"
        className="w-full slider-thumb"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <div className="text-white text-center mt-1">{value}</div>
    </div>
  );
}

