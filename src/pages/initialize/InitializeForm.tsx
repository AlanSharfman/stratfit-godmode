import React, { useMemo, useState } from "react"

export type InitializeFormValues = {
  cash: number
  monthlyBurn: number
  revenue: number
  grossMargin: number
  growthRate: number
  churnRate: number
  headcount: number
  arpa: number
}

function toNumber(v: string): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function InitializeForm(props: { onSubmit?: (v: InitializeFormValues) => void }) {
  const [cash, setCash] = useState("100000")
  const [monthlyBurn, setMonthlyBurn] = useState("15000")
  const [revenue, setRevenue] = useState("20000")
  const [grossMargin, setGrossMargin] = useState("0.7")
  const [growthRate, setGrowthRate] = useState("0.02")
  const [churnRate, setChurnRate] = useState("0.03")
  const [headcount, setHeadcount] = useState("10")
  const [arpa, setArpa] = useState("2000")

  const values: InitializeFormValues = useMemo(
    () => ({
      cash: toNumber(cash),
      monthlyBurn: toNumber(monthlyBurn),
      revenue: toNumber(revenue),
      grossMargin: toNumber(grossMargin),
      growthRate: toNumber(growthRate),
      churnRate: toNumber(churnRate),
      headcount: toNumber(headcount),
      arpa: toNumber(arpa),
    }),
    [cash, monthlyBurn, revenue, grossMargin, growthRate, churnRate, headcount, arpa]
  )

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ margin: "0 0 16px" }}>Initiate</h1>

      <div style={{ display: "grid", gap: 12 }}>
        <label>
          Cash
          <input value={cash} onChange={(e) => setCash(e.target.value)} style={{ width: "100%" }} />
        </label>

        <label>
          Monthly Burn
          <input
            value={monthlyBurn}
            onChange={(e) => setMonthlyBurn(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Revenue
          <input
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Gross Margin (0-1)
          <input
            value={grossMargin}
            onChange={(e) => setGrossMargin(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Growth Rate (e.g. 0.02 = 2%/mo)
          <input
            value={growthRate}
            onChange={(e) => setGrowthRate(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Churn Rate (e.g. 0.03 = 3%/mo)
          <input
            value={churnRate}
            onChange={(e) => setChurnRate(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Headcount
          <input
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          ARPA (Avg Revenue Per Account)
          <input
            value={arpa}
            onChange={(e) => setArpa(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <button
          onClick={() => props.onSubmit?.(values)}
          style={{ padding: "10px 14px", cursor: "pointer" }}
        >
          Save &amp; Next
        </button>
      </div>
    </div>
  )
}
