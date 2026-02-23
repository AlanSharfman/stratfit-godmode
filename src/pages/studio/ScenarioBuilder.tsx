import { useState } from "react";
import { useScenarioOverridesStore } from "@/state/scenarioOverridesStore";

export default function ScenarioBuilder() {
  const addScenario = useScenarioOverridesStore((s) => s.addScenario);
  const setActiveScenario = useScenarioOverridesStore((s) => s.setActiveScenario);

  const [growthRate, setGrowthRate] = useState(10);
  const [burnRate, setBurnRate] = useState(50000);

  const createScenario = () => {
    const id = crypto.randomUUID();
    addScenario({
      id,
      name: "Manual Scenario",
      overrides: {
        growthRate,
        burnRate,
      },
    });
    setActiveScenario(id);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Create Scenario</h2>

      <label>Growth %</label>
      <input
        type="number"
        value={growthRate}
        onChange={(e) => setGrowthRate(Number(e.target.value))}
      />

      <label>Burn</label>
      <input
        type="number"
        value={burnRate}
        onChange={(e) => setBurnRate(Number(e.target.value))}
      />

      <button onClick={createScenario}>Add Scenario</button>
    </div>
  );
}
