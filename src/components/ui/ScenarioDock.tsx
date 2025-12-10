// ============================================================================
// STRATFIT — ScenarioDock v4.0 (Cinematic Neon Dock)
// ============================================================================

interface ScenarioDockProps {
  scenario: "base" | "upside" | "downside" | "extreme";
  onScenarioChange: (
    scenario: "base" | "upside" | "downside" | "extreme"
  ) => void;
}

const scenarios = [
  { key: "base", label: "Base" },
  { key: "upside", label: "Upside" },
  { key: "downside", label: "Downside" },
  { key: "extreme", label: "Extreme" },
] as const;

export default function ScenarioDock({
  scenario,
  onScenarioChange,
}: ScenarioDockProps) {
  return (
    <div className="w-full flex flex-col items-center gap-2 mt-1 mb-4">

      {/* Subtitle (premium clarity) */}
      <span className="text-xs text-gray-400 tracking-wide">
        Select Scenario Mode
      </span>

      {/* The dock */}
      <div
        className="
          flex gap-3 px-5 py-3 rounded-2xl
          bg-[#0d1524]/70 border border-[#1d2a3c]
          backdrop-blur-xl shadow-[0_0_25px_rgba(0,0,0,0.45)]
        "
      >
        {scenarios.map((s) => {
          const isActive = scenario === s.key;

          return (
            <button
              key={s.key}
              onClick={() => onScenarioChange(s.key)}
              className={`
                relative px-5 py-2 rounded-lg text-sm font-medium
                transition-all duration-300 border
                ${
                  isActive
                    ? `
                        text-cyan-300 border-cyan-400 bg-[#0f1c2e]
                        shadow-[0_0_18px_#22d3d3aa] scale-105
                      `
                    : `
                        text-gray-300 border-[#1e293b]
                        hover:text-cyan-300 hover:border-cyan-400/40
                        hover:scale-105
                      `
                }
              `}
            >
              {s.label}

              {/* Active underline pulse bar */}
              {isActive && (
                <div
                  className="
                    absolute left-1/2 -translate-x-1/2
                    bottom-0 w-10 h-[3px] rounded-full
                    bg-cyan-400 animate-pulse
                  "
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
