import { useInitiateStore } from "@/state/initiateStore";

export default function InitiatePanel() {
  const {
    companyName,
    timeHorizonMonths,
    baselineRevenue,
    baselineRunwayMonths,
    objective,
    setField,
  } = useInitiateStore();

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>Initiate</h2>

      <label>Company Name</label>
      <input
        value={companyName}
        onChange={(e) => setField("companyName", e.target.value)}
      />

      <label>Time Horizon (months)</label>
      <input
        type="number"
        value={timeHorizonMonths}
        onChange={(e) => setField("timeHorizonMonths", Number(e.target.value))}
      />

      <label>Baseline Revenue</label>
      <input
        type="number"
        value={baselineRevenue}
        onChange={(e) => setField("baselineRevenue", Number(e.target.value))}
      />

      <label>Runway Months</label>
      <input
        type="number"
        value={baselineRunwayMonths}
        onChange={(e) =>
          setField("baselineRunwayMonths", Number(e.target.value))
        }
      />

      <label>Objective</label>
      <textarea
        value={objective}
        onChange={(e) => setField("objective", e.target.value)}
      />
    </div>
  );
}
