import { runSimulation } from "@/simulation/runSimulation";

export default function KPIDeltaStrip({ baseline, scenario }: any) {
  const base = runSimulation(baseline);
  const scen = runSimulation(scenario);

  const delta = (a: number, b: number) => (b - a).toFixed(1);

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: 12,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        fontSize: 12,
      }}
    >
      <div>Revenue Δ: {delta(base.projectedRevenue, scen.projectedRevenue)}</div>
      <div>Runway Δ: {delta(base.runwayMonths, scen.runwayMonths)}</div>
      <div>Risk Δ: {delta(base.riskScore, scen.riskScore)}</div>
      <div>Valuation Δ: {delta(base.valuation, scen.valuation)}</div>
    </div>
  );
}
