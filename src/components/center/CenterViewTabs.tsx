

export type CenterView = "terrain" | "variance" | "actuals";

const TABS: { id: CenterView; label: string }[] = [
  { id: "terrain", label: "Terrain" },
  { id: "variance", label: "Variance" },
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
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-black/40 p-1 shadow-sm">
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              active
                ? "bg-white/10 text-white shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
