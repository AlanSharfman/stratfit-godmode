import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

type Props = {
  enabled: boolean;
  // Provide a bounding box for where the cloud should live (around terrain)
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  };
  // 0..1 confidence (1 = tight/clear, 0 = foggy/uncertain)
  confidence: number;
  // 0..1 overall risk (adds subtle red specks only when high)
  risk: number;
  count?: number;          // recommended 4500–9000 (adaptive later)
  opacity?: number;        // recommended 0.25–0.45
  proof?: boolean;         // proof mode: undeniably visible
};

export default function ProbabilisticEnvelopeParticles({
  enabled,
  bounds,
  confidence,
  risk,
  count: countProp = 6500,
  opacity: opacityProp = 0.34,
  proof = false,
}: Props) {
  return null;
}
