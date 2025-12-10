import KPISparkline from "./KPISparkline";

interface KPICardProps {
  label: string;
  value: number | string;
  active: boolean;
  onClick: () => void;
  sparkValues: number[];
}

export default function KPICard({
  label,
  value,
  active,
  onClick,
  sparkValues,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer p-4 rounded-xl border transition-all duration-300
        ${active ? "border-[#22d3d3] bg-[#0f1b2d]" : "border-[#1e293b] bg-[#0b1624]"}
        hover:border-[#22d3d3]/60
      `}
    >
      <div className="text-sm text-gray-300">{label}</div>

      <div
        className={`
          text-2xl font-semibold mt-1
          ${active ? "text-[#22d3d3]" : "text-white"}
        `}
      >
        {value}
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <KPISparkline
          values={sparkValues}
          active={active}
          color={active ? "#22d3d3" : "#475569"}
        />
      </div>
    </div>
  );
}

