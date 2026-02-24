import React, { useMemo } from "react";
import { computeDivergence, type SimulationSnapshot } from "@/logic/divergence/computeDivergence";

function fmtPp(n: number) {
  const s = n > 0 ? "+" : "";
  return `${s}${n}pp`;
}
function fmtMonths(n: number) {
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}m`;
}
function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  const s = n > 0 ? "+" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${s}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${s}$${(abs / 1_000).toFixed(0)}K`;
  return `${s}$${Math.round(abs)}`;
}
function fmtPct(n: number) {
  const s = n > 0 ? "+" : "";
  return `${s}${n}%`;
}

export default function DivergencePanel(props: {
  baselineName: string;
  scenarioName: string;
  baseline: SimulationSnapshot | null;
  scenario: SimulationSnapshot | null;
}) {
  const div = useMemo(() => {
    if (!props.baseline || !props.scenario) return null;
    return computeDivergence(props.baseline, props.scenario);
  }, [props.baseline, props.scenario]);

  if (!props.baseline || !props.scenario) {
    return (
      <div style={{
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Divergence</div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Pin a baseline and select a scenario with a simulation snapshot.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 12,
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.28)",
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Divergence</div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>
          {props.baselineName} → {props.scenarioName}
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
        Rating: {div!.ratingFrom} → {div!.ratingTo} ({div!.scoreDelta > 0 ? "+" : ""}{div!.scoreDelta})
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Metric label="Survival" value={fmtPp(div!.survivalDeltaPp)} />
        <Metric label="Runway (P50)" value={fmtMonths(div!.runwayDeltaMonths)} />
        <Metric label="ARR (P50)" value={fmtMoney(div!.arrDeltaP50)} />
        <Metric label="Cash (P50)" value={fmtMoney(div!.cashDeltaP50)} />
        <Metric label="ARR uncertainty" value={fmtPct(div!.arrSpreadDeltaPct)} />
        <Metric label="Runway uncertainty" value={fmtPct(div!.runwaySpreadDeltaPct)} />
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {div!.topPositive.length > 0 && (
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            • Positive drivers: {div!.topPositive.join(", ")}
          </div>
        )}
        {div!.topNegative.length > 0 && (
          <div style={{ fontSize: 12, opacity: 0.78 }}>
            • Risk drivers: {div!.topNegative.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div style={{
      padding: 10,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.04)",
    }}>
      <div style={{ fontSize: 11, opacity: 0.65 }}>{props.label}</div>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>{props.value}</div>
    </div>
  );
}
