// src/pages/valuation/ValuationPage.tsx
import React from "react"
import PageShell from "@/components/nav/PageShell"
import { ComingSoonModule } from "@/components/ui/ComingSoonModule"

export default function ValuationPage() {
  return (
    <PageShell>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <ComingSoonModule
            title="Valuation Engine"
            subtitle="Quantify how strategic decisions impact enterprise value."
            bullets={[
              "DCF simulation modelling",
              "Revenue multiple benchmarking",
              "Comparable company valuation",
              "Probabilistic valuation ranges (P10 / P50 / P90)",
            ]}
          />
        </div>
      </div>
    </PageShell>
  )
}
