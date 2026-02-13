import React, { useMemo } from "react";
import FinancialTrajectory from "./FinancialTrajectory";

type Vec3 = [number, number, number];

type Props = {
  basePath: Vec3[];
  spread: number;
  count: number;
};

export default function FinancialTrajectoryFan({
  basePath,
  spread = 0.3,
  count = 12,
}: Props) {
  const paths = useMemo(() => {
    if (!basePath || basePath.length < 2) return [] as Vec3[][];

    const out: Vec3[][] = [];
    for (let i = 0; i < count; i++) {
      const jitter = (Math.random() - 0.5) * spread;

      const p = basePath.map(([x, y, z]) => [
        x + jitter * (z * 0.2),
        y + jitter * 0.15,
        z,
      ]) as Vec3[];

      out.push(p);
    }
    return out;
  }, [basePath, spread, count]);

  return (
    <group>
      {paths.map((p, i) => (
        <FinancialTrajectory
          key={i}
          points={p}
          color="#7C7CFF"
          radius={0.018}
          opacity={0.18}
          flow={false}
        />
      ))}
    </group>
  );
}
