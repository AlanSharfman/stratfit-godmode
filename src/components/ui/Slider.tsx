interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export default function Slider({ label, value, onChange }: SliderProps) {
  return (
    <div className="flex flex-col p-4 bg-[#0f1b34] rounded-xl border border-[#1e2b45]">
      <div className="text-gray-300 text-sm mb-2">{label}</div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />

      <div className="text-white text-center mt-1">{value}</div>
    </div>
  );
}
