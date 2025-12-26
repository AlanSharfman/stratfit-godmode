

export type CenterView = "terrain" | "variance" | "systemBrief" | "actuals";

const TABS: { id: CenterView; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "variance", label: "Variances" },
  { id: "systemBrief", label: "System Brief" },
  { id: "actuals", label: "Actuals" },
];

export default function CenterViewTabs({
  value,
  onChange,
}: {
  value: CenterView;
  onChange: (v: CenterView) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700/80 bg-slate-900/60 p-1.5 shadow-lg backdrop-blur-sm">
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`
              relative px-5 py-2.5 text-sm font-semibold rounded-lg 
              transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                active
                  ? "bg-gradient-to-b from-cyan-500/90 to-cyan-600/90 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50 hover:shadow-md active:scale-95"
              }
            `}
          >
            {t.label}
            {active && (
              <div className="absolute inset-0 rounded-lg border-2 border-cyan-400/50 pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}
