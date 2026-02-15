import React from "react";
import { Line } from "@react-three/drei";

type Props = {
  contourLines: [number, number, number][][];
};

export default function StressContours({ contourLines }: Props) {
  return (
    <group>
      {contourLines.map((line, i) => (
        <Line
          key={i}
          points={line}
          color="#c83a3a"
          lineWidth={1}
          transparent
          opacity={0.45}
        />
      ))}
    </group>
  );
}
