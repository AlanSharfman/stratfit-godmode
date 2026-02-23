import { useNavigate } from "react-router-dom";
import { useBaselineStore } from "@/state/baselineStore";
import { BaselineInputs } from "./initialize.types";
import { useState } from "react";

const defaultInputs: BaselineInputs = {
  revenue: 1000000,
  growthRate: 20,
  grossMargin: 60,
  burnRate: 50000,
  cash: 600000,
  runwayMonths: 12,
  debt: 0,

  hiringPlan: 5,
  pricingChange: 0,
  marketingIntensity: 50,
  capexPlan: 20000,
  costDiscipline: 50,

  timeHorizonMonths: 24,
  riskProfile: "balanced",
};

export default function InitializeForm() {
  const navigate = useNavigate();
  const setBaselineInputs = useBaselineStore((s) => s.setBaselineInputs);
  const [form, setForm] = useState<BaselineInputs>(defaultInputs);

  const update = (key: keyof BaselineInputs, value: any) =>
    setForm({ ...form, [key]: value });

  const submit = () => {
    setBaselineInputs(form);
    navigate("/position");
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h3>Financial Health</h3>

      <input
        type="number"
        value={form.revenue}
        onChange={(e) => update("revenue", Number(e.target.value))}
        placeholder="Revenue"
      />
      <input
        type="number"
        value={form.growthRate}
        onChange={(e) => update("growthRate", Number(e.target.value))}
        placeholder="Growth %"
      />
      <input
        type="number"
        value={form.grossMargin}
        onChange={(e) => update("grossMargin", Number(e.target.value))}
        placeholder="Gross Margin %"
      />
      <input
        type="number"
        value={form.burnRate}
        onChange={(e) => update("burnRate", Number(e.target.value))}
        placeholder="Monthly Burn"
      />
      <input
        type="number"
        value={form.cash}
        onChange={(e) => update("cash", Number(e.target.value))}
        placeholder="Cash"
      />
      <input
        type="number"
        value={form.debt}
        onChange={(e) => update("debt", Number(e.target.value))}
        placeholder="Debt"
      />

      <h3>Strategy Levers</h3>

      <input
        type="number"
        value={form.hiringPlan}
        onChange={(e) => update("hiringPlan", Number(e.target.value))}
        placeholder="Hiring Plan"
      />
      <input
        type="number"
        value={form.pricingChange}
        onChange={(e) => update("pricingChange", Number(e.target.value))}
        placeholder="Pricing %"
      />
      <input
        type="number"
        value={form.marketingIntensity}
        onChange={(e) => update("marketingIntensity", Number(e.target.value))}
        placeholder="Marketing Intensity"
      />
      <input
        type="number"
        value={form.capexPlan}
        onChange={(e) => update("capexPlan", Number(e.target.value))}
        placeholder="Capex"
      />
      <input
        type="number"
        value={form.costDiscipline}
        onChange={(e) => update("costDiscipline", Number(e.target.value))}
        placeholder="Cost Discipline"
      />

      <h3>Time & Risk</h3>

      <input
        type="number"
        value={form.timeHorizonMonths}
        onChange={(e) => update("timeHorizonMonths", Number(e.target.value))}
        placeholder="Time Horizon"
      />

      <select
        value={form.riskProfile}
        onChange={(e) => update("riskProfile", e.target.value)}
      >
        <option value="conservative">Conservative</option>
        <option value="balanced">Balanced</option>
        <option value="aggressive">Aggressive</option>
      </select>

      <button onClick={submit} style={{ marginTop: 12 }}>
        Build Landscape
      </button>
    </div>
  );
}
