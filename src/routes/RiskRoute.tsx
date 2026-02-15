import RiskPage from "@/components/Risk/RiskPage";
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import SimulationActivityMonitor from '@/components/system/SimulationActivityMonitor';
import ProDetailDrawer from '@/components/simulation/ProDetailDrawer';

export default function RiskRoute() {
  return (
    <>
      <RiskPage />
      {/* Telemetry overlays */}
      <SimulationTelemetryRibbon />
      <SimulationActivityMonitor />
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>
    </>
  );
}
