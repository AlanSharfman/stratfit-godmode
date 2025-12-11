import KPISparkline from "./KPISparkline";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  active: boolean;
  onClick: () => void;
  sparkValues: number[];
}

export default function KPICard({
  label,
  value,
  unit,
  active,
  onClick,
  sparkValues,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        "p-4 rounded-xl bg-[#0f1b34] border cursor-pointer",
        "transition-all duration-200 ease-out",
        active
          ? "border-[#00b4ff] -translate-y-2 scale-[1.03] kpi-glow"
          : "border-[#1e2b45] hover:border-[#00b4ff]/60 hover:-translate-y-1 hover:scale-[1.01]"
      ].join(" ")}
    >
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </div>
      <div className="mt-2">
        <KPISparkline values={sparkValues} />
      </div>
    </div>
  );
}