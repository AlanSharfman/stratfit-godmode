// src/routes/ValuationRoute.tsx
// STRATFIT — Valuation Route (Phase V-2)
// Renders the V-2 Valuation Shell from pages/valuation.
// Previous components/valuation/ValuationPage.tsx preserved but no longer routed.

import ValuationPage from "@/pages/valuation/ValuationPage";
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import SimulationActivityMonitor from '@/components/system/SimulationActivityMonitor';
import ProDetailDrawer from '@/components/simulation/ProDetailDrawer';

export default function ValuationRoute() {
  return (
    <>
      <ValuationPage />
      {/* Telemetry overlays */}
      <SimulationTelemetryRibbon />
      <SimulationActivityMonitor />
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>
    </>
  );
}
