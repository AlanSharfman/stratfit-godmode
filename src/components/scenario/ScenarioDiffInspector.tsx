import React, { useMemo } from "react";

export type LeverSnapshot = Record<string, number>;

type Props = {
  baselineName?: string;
  scenarioName?: string;
  baseline: LeverSnapshot | null | undefined;
  scenario: LeverSnapshot | null | undefined;
};

type DiffRow = {
  key: string;
  label: string;
  base: number;
  next: number;
  delta: number;
  direction: "up" | "down" | "flat";
};

const LEVER_LABELS: Record<string, string> = {
  demandStrength: "Demand Strength",
  pricingPower: "Pricing Power",
  expansionVelocity: "Expansion Velocity",
  costDiscipline: "Cost Discipline",
  hiringIntensity: "Hiring Intensity",
  operatingDrag: "Operating Drag",
  marketVolatility: "Market Volatility",
  executionRisk: "Execution Risk",
  fundingPressure: "Funding Pressure",
};

function labelFor(key: string) {
  return LEVER_LABELS[key] ?? key;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  // levers are typically 0–100
  return `${Math.round(n)}`;
}

export default function ScenarioDiffInspector(props: Props) {
  const { baseline, scenario, baselineName = "Baseline", scenarioName = "Scenario" } = props;

  const rows = useMemo<DiffRow[]>(() => {
    if (!baseline || !scenario) return [];

    // Union keys so extra levers are not silently dropped.
    const keys = Array.from(new Set([...Object.keys(baseline), ...Object.keys(scenario)]));

    const out: DiffRow[] = keys
      .filter((k) => typeof baseline[k] === "number" && typeof scenario[k] === "number")
      .map((k) => {
        const base = baseline[k] ?? 0;
        const next = scenario[k] ?? 0;
        const delta = next - base;
        const direction: DiffRow["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
        return { key: k, label: labelFor(k), base, next, delta, direction };
      })
      // Order by absolute delta (most meaningful first)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return out;
  }, [baseline, scenario]);

  const isReady = !!baseline && !!scenario;

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(10px)",
      }}
      aria-label="Scenario diff inspector"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Scenario Diff</div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>{baselineName} → {scenarioName}</div>
      </div>

      {!isReady && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Select a baseline and a scenario to compare.
        </div>
      )}

      {isReady && rows.length === 0 && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          No comparable lever fields found.
        </div>
      )}

      {isReady && rows.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <Row key={r.key} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ row }: { row: DiffRow }) {
  const sign = row.delta > 0 ? "+" : row.delta < 0 ? "−" : "";
  const abs = Math.abs(row.delta);

  // Simple intensity bar (0–100 lever scale assumption; safe clamp)
  const barPct = clamp(abs, 0, 100);

  const deltaTone =
    row.direction === "up"
      ? "rgba(0,224,255,0.70)"      // cyan (neutral/active)
      : row.direction === "down"
      ? "rgba(255,80,80,0.70)"      // red (risk / down)
      : "rgba(255,255,255,0.25)";   // flat

  return (
    <div
      style={{
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{row.label}</div>

        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <div style={{ fontSize: 12, opacity: 0.65 }}>
            {fmt(row.base)} → {fmt(row.next)}
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.95,
              padding: "3px 8px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.20)",
            }}
          >
            {sign}{abs.toFixed(0)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, height: 8, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
        <div style={{ width: `${barPct}%`, height: "100%", background: deltaTone }} />
      </div>
    </div>
  );
}
