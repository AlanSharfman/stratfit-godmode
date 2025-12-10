import KPISparkline from "./KPISparkline";

interface KPICardProps {
  label: string;
  value: number;
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
      className={`p-4 rounded-xl bg-[#0f1b34] border cursor-pointer transition-all
        ${active ? "border-[#00b4ff] shadow-lg shadow-[#00b4ff40]" : "border-[#1e2b45]"}`}
    >
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>

      <div className="mt-2">
        <KPISparkline values={sparkValues} />
      </div>
    </div>
  );
}
