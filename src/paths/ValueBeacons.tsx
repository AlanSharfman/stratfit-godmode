import React, { useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import type { HeightSampler } from "@/terrain/corridorTopology";
import { useNarrativeStore } from "@/state/narrativeStore";

type Beacon = { id: string; t: number; label: string };

export default function ValueBeacons({
  curve,
  getHeightAt,
  beacons,
  lift = 0.35,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  getHeightAt: HeightSampler;
  beacons?: Beacon[];
  lift?: number;
}) {
  const items = useMemo<Beacon[]>(
    () =>
      beacons ?? [
        { id: "m1", t: 0.15, label: "M1" },
        { id: "m2", t: 0.38, label: "M2" },
        { id: "m3", t: 0.62, label: "M3" },
        { id: "m4", t: 0.86, label: "M4" },
      ],
    [beacons]
  );

  const [hoverId, setHoverId] = useState<string | null>(null);
  const onOver = useCallback((id: string) => setHoverId(id), []);
  const onOut = useCallback(() => setHoverId(null), []);

  const setHovered = useNarrativeStore((s) => s.setHovered);

  return (
    <>
      {items.map((b, idx) => {
        const p = curve.getPoint(b.t);
        const y = getHeightAt(p.x, p.z) + lift;
        const hovered = hoverId === b.id;

        return (
          <BeaconPillar
            key={b.id}
            id={b.id}
            index={idx}
            label={b.label}
            position={[p.x, y, p.z]}
            hovered={hovered}
            onOver={onOver}
            onOut={onOut}
            setHovered={setHovered}
          />
        );
      })}
    </>
  );
}

function BeaconPillar({
  id,
  index,
  label,
  position,
  hovered,
  onOver,
  onOut,
  setHovered,
}: {
  id: string;
  index: number;
  label: string;
  position: [number, number, number];
  hovered: boolean;
  onOver: (id: string) => void;
  onOut: () => void;
  setHovered: (t: { id: string; type: "beacon"; label: string } | null) => void;
}) {
  const setSelected = useNarrativeStore((s) => s.setSelected);

  const baseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0b1220"),
        metalness: 0.9,
        roughness: 0.32,
        emissive: new THREE.Color("#020617"),
        emissiveIntensity: 0.12,
      }),
    []
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: hovered ? 0.85 : 0.45,
        depthTest: false,
        depthWrite: false,
      }),
    [hovered]
  );

  // Column = additive “light volume”
  const columnMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: hovered ? 0.26 : 0.16,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    [hovered]
  );

  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: hovered ? 0.14 : 0.08,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      }),
    [hovered]
  );

  const scale = hovered ? 1.08 : 1.0;

  return (
    <group
      position={position}
      renderOrder={70}
      frustumCulled={false}
      scale={[scale, scale, scale]}
      userData={{
        beacon: true,
        id: `value-beacon-${id}`,
        beaconId: id,
        index,
        label,
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onOver(id);
        setHovered({ id, type: "beacon", label });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onOut();
        setHovered(null);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelected({ id, type: "beacon", label });
      }}
    >
      {/* Base puck (titanium) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.52, 0.52, 0.12, 28]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} frustumCulled={false}>
        <ringGeometry args={[0.62, 0.92, 64]} />
        <primitive object={ringMat} attach="material" />
      </mesh>

      {/* Inner dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} frustumCulled={false}>
        <circleGeometry args={[0.1, 28]} />
        <meshBasicMaterial
          color={0x22d3ee}
          transparent
          opacity={hovered ? 0.85 : 0.55}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical light column (core) */}
      <mesh position={[0, 2.2, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.08, 0.08, 4.2, 18, 1, true]} />
        <primitive object={columnMat} attach="material" />
      </mesh>

      {/* Outer light column (halo) */}
      <mesh position={[0, 2.2, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.16, 4.4, 18, 1, true]} />
        <primitive object={haloMat} attach="material" />
      </mesh>
    </group>
  );
}
