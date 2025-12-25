

export type CenterView = "terrain" | "variance" | "actuals";

interface Props {
  value: CenterView;
  onChange: (v: CenterView) => void;
}

const TAB: Array<{ id: CenterView; label: string }> = [
  { id: "terrain", label: "Terrain" },
  { id: "variance", label: "Variance" },
  { id: "actuals", label: "Actuals" },
];

export default function CenterViewTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
      {TAB.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition select-none ${
                  active
                    ? "bg-white/10 text-white shadow-sm"
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
