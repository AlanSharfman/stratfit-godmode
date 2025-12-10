interface Props {
  scenario: string;
  onScenarioChange: (s: any) => void;
}

export default function ScenarioDock({ scenario, onScenarioChange }: Props) {
  const scenarios = ["base", "upside", "downside", "extreme"];

  return (
    <div className="flex gap-4">
      {scenarios.map((s) => (
        <button
          key={s}
          className={`
            px-4 py-2 rounded-lg text-sm capitalize
            ${scenario === s ? "bg-[#00b4ff] text-black" : "bg-[#1e2b45] text-gray-300"}
          `}
          onClick={() => onScenarioChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
