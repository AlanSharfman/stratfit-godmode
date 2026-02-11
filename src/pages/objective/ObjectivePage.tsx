import { useState } from 'react'
import { useScenarioStore } from '@/state/scenarioStore'

export default function ObjectivePage() {
  const setObjective = useScenarioStore((s) => s.setObjective)

  const [targetARR, setTargetARR] = useState(20000000)
  const [timeHorizonMonths, setTimeHorizonMonths] = useState(24)
  const [marginTarget, setMarginTarget] = useState(0.65)

  const handleSubmit = () => {
    setObjective({
      targetARR,
      timeHorizonMonths,
      marginTarget,
      riskPosture: 'balanced',
      raiseStrategy: 'single',
      hiringIntent: 'moderate'
    })
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Declare Strategic Objective</h2>

      <div>
        <label>Target ARR</label>
        <input
          type="number"
          value={targetARR}
          onChange={(e) => setTargetARR(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Time Horizon (months)</label>
        <input
          type="number"
          value={timeHorizonMonths}
          onChange={(e) => setTimeHorizonMonths(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Target Gross Margin</label>
        <input
          type="number"
          step="0.01"
          value={marginTarget}
          onChange={(e) => setMarginTarget(Number(e.target.value))}
        />
      </div>

      <button onClick={handleSubmit}>
        Compute Structural Requirements
      </button>
    </div>
  )
}


