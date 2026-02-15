import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

type Props = {
  points: THREE.Vector3[];
  risk: number[]; // same length as points (0-1)
};

/**
 * Maps risk value (0-1) to a color.
 * Low risk: emerald green
 * Medium risk: soft blue
 * High risk: coral red
 */
function riskColor(r: number): string {
  if (r < 0.3) return "#34D399"; // emerald
  if (r < 0.6) return "#60A5FA"; // blue
  return "#F87171"; // red
}

/**
 * RiskColoredLine renders a path with segments colored by risk level.
 * Each segment between consecutive points is colored based on the risk value.
 *
 * Premium styling: smooth gradients between risk zones with subtle line width.
 */
export default function RiskColoredLine({ points, risk }: Props) {
  const segments = useMemo(() => {
    const segs: { pts: THREE.Vector3[]; color: string }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      segs.push({
        pts: [points[i], points[i + 1]],
        color: riskColor(risk[i] ?? 0.5),
      });
    }

    return segs;
  }, [points, risk]);

  return (
    <>
      {segments.map((s, i) => (
        <Line key={i} points={s.pts} color={s.color} lineWidth={2} />
      ))}
    </>
  );
}
