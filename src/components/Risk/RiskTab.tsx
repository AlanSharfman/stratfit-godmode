// src/components/Risk/RiskTab.tsx
// STRATFIT — Risk Intelligence Tab (God Mode)
// Now renders the Monte Carlo–derived RiskPanel as primary view.
// RiskEngine consumes ONLY simulationStore.fullResult — no legacy stores.

import { RiskPanel } from "@/components/risk/RiskPanel";

export default function RiskTab() {
  return <RiskPanel />;
}
