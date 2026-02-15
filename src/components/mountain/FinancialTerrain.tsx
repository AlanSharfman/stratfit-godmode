import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFinancialTerrainFillMaterial, type RiskPoint } from "./materials/FinancialTerrainFillMaterial";

type Props = {
  width?: number;
  depth?: number;
  segments?: number;

  // Supply your own height field if you have it; otherwise this demo makes a soft "2-peak" hill
  heightField?: (x: number, z: number) => number;

  wireColor?: string;
  wireOpacity?: number;

  fillOpacity?: number;
  baseColor?: string;

  riskPoints?: RiskPoint[];
  riskEmissiveStrength?: number;

  position?: [number, number, number];

  // NEW: lets overlays share exact geometry instance
  onGeometryReady?: (g: THREE.BufferGeometry) => void;
};

export default function FinancialTerrain({
  width = 10,
  depth = 6,
  segments = 140,

  heightField,
  wireColor = "#37d7ea",
  wireOpacity = 0.95,

  fillOpacity = 0.18,
  baseColor = "#37d7ea",

  riskPoints = [],
  riskEmissiveStrength = 0.75,

  position = [0, 0, 0],

  onGeometryReady,
}: Props) {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, segments, segments);
    g.rotateX(-Math.PI / 2);

    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const y =
        heightField?.(x, z) ??
        // fallback demo: soft main hill + secondary ridge
        (0.9 * Math.exp(-((x + 0.5) ** 2) / 5.5 - (z ** 2) / 2.4) +
          0.55 * Math.exp(-((x - 3.0) ** 2) / 2.0 - ((z + 0.9) ** 2) / 1.8));

      pos.setY(i, y);
    }

    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [width, depth, segments, heightField]);

  useEffect(() => {
    onGeometryReady?.(geom);
  }, [geom, onGeometryReady]);

  const fillMat = useFinancialTerrainFillMaterial({
    riskPoints,
    fillOpacity,
    baseColor,
    riskColor: "#c83a3a",
    emissiveStrength: riskEmissiveStrength,
    fogLift: 0.07,
  });

  const wireMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(wireColor),
      wireframe: true,
      transparent: true,
      opacity: wireOpacity,
      depthWrite: false,
    });
  }, [wireColor, wireOpacity]);

  return (
    <group position={position}>
      {/* Pass 1: subtle filled surface */}
      <mesh geometry={geom} material={fillMat} />

      {/* Pass 2: wireframe overlay (what you already like) */}
      <mesh geometry={geom} material={wireMat} />
    </group>
  );
}
