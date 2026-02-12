import { SimulateOverlay } from "@/components/simulate";
import type { LeverState } from "@/logic/calculateMetrics";
import { useNavigate } from "react-router-dom";

interface SimulateOverlayRouteProps {
  levers: LeverState;
}

export default function SimulateOverlayRoute({ levers }: SimulateOverlayRouteProps) {
  const navigate = useNavigate();

  return (
    <SimulateOverlay
      isOpen
      onClose={() => navigate("/studio")}
      levers={levers}
    />
  );
}
