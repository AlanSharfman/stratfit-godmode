import React, { useEffect, useMemo } from "react";
import { useNarrativeStore } from "@/state/narrativeStore";
import { useKPIStore } from "@/state/kpiSelector";
import { useObjectiveLensStore } from "@/state/objectiveLensStore";
import { orderKPIs } from "@/state/lensSelectors";
import KPIBlock from "@/overlays/KPIBlock";
import Sparkline from "@/overlays/Sparkline";

export default function NarrativeOverlayHost() {
  const hovered = useNarrativeStore((s) => s.hovered);
  const selected = useNarrativeStore((s) => s.selected);
  const clearSelected = useNarrativeStore((s) => s.clearSelected);

  const kpi = useKPIStore((s) => s.primary);

  const lens = useObjectiveLensStore((s) => s.lens);
  const setLens = useObjectiveLensStore((s) => s.setLens);
  const ordered = orderKPIs(lens, kpi);

  const active = selected ?? hovered;

  // ESC clears locked selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelected]);

  return (
    <>
      <HoverTooltip hovered={hovered} />
      <NarrativeRail
        active={active}
        selected={selected}
        kpi={kpi}
        lens={lens}
        setLens={setLens}
        ordered={ordered}
      />
    </>
  );
}

function HoverTooltip({ hovered }: { hovered: any }) {
  if (!hovered) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 18,
        top: 84,
        zIndex: 980,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(5, 10, 14, 0.78)",
        border: "1px solid rgba(34, 211, 238, 0.22)",
        backdropFilter: "blur(10px)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "rgba(234, 251, 255, 0.92)",
        width: 280,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 0.6, opacity: 0.75 }}>HOVER</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
        {hovered.label ?? hovered.id}
      </div>
      <div style={{ fontSize: 12, opacity: 0.78, marginTop: 4 }}>
        {hovered.type}
        {hovered.kind ? ` · ${hovered.kind}` : ""}
        {typeof hovered.t === "number" ? ` · t=${hovered.t.toFixed(2)}` : ""}
      </div>
    </div>
  );
}

function NarrativeRail({
  active,
  selected,
  kpi,
  lens,
  setLens,
  ordered,
}: {
  active: any;
  selected: any;
  kpi: { arr: number; runway: number; risk: number; value: number };
  lens: string;
  setLens: (l: any) => void;
  ordered: Array<{ label: string; value: number; unit?: string }>;
}) {
  const title = active?.label ?? "Position";
  const sub = active
    ? `${active.type}${active.kind ? ` · ${active.kind}` : ""}`
    : "Ground truth terrain + trajectory";

  const blocks = useMemo(() => {
    if (!active) {
      return [
        {
          k: "What you’re seeing",
          v: "Baseline terrain, P50 trajectory, probability envelope, value beacons, and strategic markers.",
        },
        { k: "Controls", v: "Hover = preview. Click = lock. ESC = clear." },
      ];
    }
    return [
      {
        k: "Signal",
        v: active.kind
          ? String(active.kind).toUpperCase()
          : String(active.type).toUpperCase(),
      },
      {
        k: "Interpretation",
        v:
          active.type === "beacon"
            ? "Value beacon: a milestone/destination along the trajectory."
            : active.type === "marker"
            ? "Strategic marker: diagnostic signal anchored to the timeline."
            : "Selected object.",
      },
      {
        k: "Lock state",
        v: selected ? "LOCKED (press ESC to clear)" : "PREVIEW (click to lock)",
      },
    ];
  }, [active, selected]);

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        top: 72,
        width: 360,
        zIndex: 970,
        borderRadius: 16,
        background: "rgba(6, 12, 18, 0.72)",
        border: selected
          ? "1px solid rgba(34, 211, 238, 0.28)"
          : "1px solid rgba(148, 163, 184, 0.16)",
        backdropFilter: "blur(12px)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "rgba(234, 251, 255, 0.92)",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          padding: 14,
          borderBottom: "1px solid rgba(148, 163, 184, 0.10)",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.72, letterSpacing: 0.6 }}>
          NARRATIVE
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.74, marginTop: 6 }}>{sub}</div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: 12 }}>
        {["survival", "value", "liquidity"].map((l) => (
          <button
            key={l}
            onClick={() => setLens(l as any)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border:
                lens === l
                  ? "1px solid rgba(34,211,238,0.6)"
                  : "1px solid rgba(34,211,238,0.15)",
              background:
                lens === l ? "rgba(8,20,28,0.8)" : "rgba(2,6,12,0.45)",
              color: "#e6fbff",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: 14, display: "flex", gap: 8 }}>
        {ordered.map((k, i) => (
          <KPIBlock
            key={i}
            label={k.label}
            value={k.value.toFixed(1)}
            unit={k.unit}
          />
        ))}
      </div>

      <div style={{ padding: "0 14px 12px 14px" }}>
        <Sparkline data={[10, 12, 11, 14, 16, 18, 17]} />
      </div>

      <div
        style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}
      >
        {blocks.map((b: any) => (
          <div
            key={b.k}
            style={{
              padding: 12,
              borderRadius: 12,
              background: "rgba(2, 6, 12, 0.55)",
              border: "1px solid rgba(34, 211, 238, 0.10)",
            }}
          >
            <div style={{ fontSize: 11, opacity: 0.72, letterSpacing: 0.5 }}>
              {b.k}
            </div>
            <div
              style={{
                fontSize: 13,
                marginTop: 6,
                lineHeight: 1.35,
                opacity: 0.88,
              }}
            >
              {b.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
