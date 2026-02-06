// src/pages/CinematicTest.tsx
// Test page - visit /cinematic to see the new mountain
// This doesn't change ANY existing code

import { useMemo } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";

export default function CinematicTest() {
  // Simple deterministic shape for a nice-looking preview.
  // (ScenarioMountain expects the parent to provide datapoints.)
  const dataPoints = useMemo(() => {
    const pts: number[] = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // A gentle ridge with a few harmonics for detail (0..100-ish).
      const v =
        35 +
        40 * Math.sin(t * Math.PI) +
        12 * Math.sin(t * Math.PI * 3) +
        6 * Math.sin(t * Math.PI * 9);
      pts.push(Math.max(0, Math.min(100, v)));
    }
    return pts;
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a1220",
        overflow: "hidden",
      }}
    >
      <ScenarioMountain scenario="base" dataPoints={dataPoints} />
    </div>
  );
}

