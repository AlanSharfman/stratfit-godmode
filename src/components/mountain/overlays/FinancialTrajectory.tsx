import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type Vec3 = [number, number, number];

type Props = {
  points: Vec3[];
  color?: string;
  radius?: number;
  opacity?: number;
  flow?: boolean;
};

export default function FinancialTrajectory({
  points,
  color = "#6FE7FF",
  radius = 0.04,
  opacity = 0.85,
  flow = true,
}: Props) {
  return null;
}
