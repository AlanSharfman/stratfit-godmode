import { useScenarioStore } from "@/state/scenarioStore";

export default function CompareToggle() {
  const comparisonMode = useScenarioStore((s) => s.comparisonMode);
  const setComparisonMode = useScenarioStore((s) => s.setComparisonMode);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs opacity-70">Compare</span>

      <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
        <button
          className={`px-3 py-1.5 text-xs rounded-md transition ${
            comparisonMode === "single" ? "bg-white/10" : "opacity-70 hover:opacity-100"
          }`}
          onClick={() => setComparisonMode("single")}
        >
          Off
        </button>

        <button
          className={`px-3 py-1.5 text-xs rounded-md transition ${
            comparisonMode === "base_vs_active" ? "bg-white/10" : "opacity-70 hover:opacity-100"
          }`}
          onClick={() => setComparisonMode("base_vs_active")}
        >
          Base ↔ Active
        </button>
      </div>
    </div>
  );
}