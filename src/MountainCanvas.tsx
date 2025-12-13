import { memo } from "react";
import MountainEngine from "./components/engine/MountainEngine";

type ScenarioId = "base" | "upside" | "downside" | "extreme";

interface MountainCanvasProps {
  dataPoints: number[];
  activeKPIIndex: number | null;
  scenario: ScenarioId;
}

// This wrapper NEVER re-renders unless props actually change
const MountainCanvas = memo(
  function MountainCanvas({ dataPoints, activeKPIIndex, scenario }: MountainCanvasProps) {
    return (
      <div className="w-full h-full">
        <MountainEngine
          dataPoints={dataPoints}
          activeKPIIndex={activeKPIIndex}
          scenario={scenario}
        />
      </div>
    );
  },
  // Custom comparison - only re-render if these specific values change
  (prev, next) => {
    return (
      prev.scenario === next.scenario &&
      prev.activeKPIIndex === next.activeKPIIndex &&
      prev.dataPoints.length === next.dataPoints.length &&
      prev.dataPoints.every((v, i) => Math.abs(v - next.dataPoints[i]) < 0.001)
    );
  }
);

export default MountainCanvas;