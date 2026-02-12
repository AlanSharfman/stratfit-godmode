import CompareView from '@/components/compare/CompareView';
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import SimulationActivityMonitor from '@/components/system/SimulationActivityMonitor';

export default function CompareRoute() {
  return (
    <>
      <CompareView />
      {/* Telemetry overlays */}
      <SimulationTelemetryRibbon />
      <SimulationActivityMonitor />
    </>
  );
}
