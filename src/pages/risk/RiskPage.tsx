// src/pages/risk/RiskPage.tsx
import React from "react"
import PageShell from "@/components/nav/PageShell"
import { ComingSoonModule } from "@/components/ui/ComingSoonModule"

export default function RiskPage() {
  return (
    <PageShell>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <ComingSoonModule
            title="Risk Intelligence"
            subtitle="Advanced probabilistic risk analysis powered by STRATFIT simulation."
            bullets={[
              "Survival probability modelling",
              "Runway collapse detection",
              "Liquidity risk forecasting",
              "Volatility exposure analysis",
            ]}
          />
        </div>
      </div>
    </PageShell>
  )
}
