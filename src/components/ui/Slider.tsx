interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export default function Slider({ label, value, onChange }: SliderProps) {
  return (
    <div className="flex flex-col p-4 rounded-xl border border-[#1e2b45] bg-[#0b1020]/95 backdrop-blur-xl">
      <div className="text-gray-300 text-sm mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-cyan-300 font-medium">{value}</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="stratfit-slider"
      />
    </div>
  );
}
