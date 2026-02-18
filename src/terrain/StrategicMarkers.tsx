import React, { useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import type { HeightSampler } from "@/terrain/corridorTopology";
import { useNarrativeStore } from "@/state/narrativeStore";

export type MarkerKind = "risk" | "liquidity" | "value" | "strategy";

export type StrategicMarker =
  | {
      id: string;
      kind: MarkerKind;
      label: string;
      // Path-anchored position along curve (0..1)
      t: number;
      strength?: number;
    }
  | {
      id: string;
      kind: MarkerKind;
      label: string;
      // World anchored fallback (x/z); avoid for production
      x: number;
      z: number;
      strength?: number;
    };

export default function StrategicMarkers({
  markers,
  curve,
  getHeightAt,
  lift = 0.24,
}: {
  markers: StrategicMarker[];
  curve: THREE.Curve<THREE.Vector3>;
  getHeightAt: HeightSampler;
  lift?: number;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const onOver = useCallback((id: string) => setHoverId(id), []);
  const onOut = useCallback(() => setHoverId(null), []);

  const setHovered = useNarrativeStore((s) => s.setHovered);
  const setSelected = useNarrativeStore((s) => s.setSelected);

  const items = useMemo(() => markers ?? [], [markers]);
  if (!items.length) return null;

  return (
    <group name="strategic-markers" frustumCulled={false}>
      {items.map((m, idx) => {
        const { x, z } = resolveXZ(m, curve);
        const y = getHeightAt(x, z) + lift;
        const hovered = hoverId === m.id;

        return (
          <MarkerGlyph
            key={m.id}
            marker={m}
            index={idx}
            position={[x, y, z]}
            hovered={hovered}
            onOver={onOver}
            onOut={onOut}
            setHovered={setHovered}
            setSelected={setSelected}
          />
        );
      })}
    </group>
  );
}

function resolveXZ(m: StrategicMarker, curve: THREE.Curve<THREE.Vector3>) {
  if ("t" in m) {
    const tt = clamp01(m.t);
    const p = curve.getPoint(tt);
    return { x: p.x, z: p.z };
  }
  return { x: m.x, z: m.z };
}

function palette(kind: MarkerKind) {
  // STRATFIT palette rules: Cyan default, Emerald positive, Indigo strategic, Red risk only, no orange.
  switch (kind) {
    case "risk":
      return { core: 0xef4444, halo: 0xfca5a5, base: "#1a0b0b" };
    case "liquidity":
      return { core: 0x22d3ee, halo: 0x7dd3fc, base: "#07131c" };
    case "value":
      return { core: 0x10b981, halo: 0x6ee7b7, base: "#061411" };
    case "strategy":
      return { core: 0x6366f1, halo: 0xa5b4fc, base: "#0b0d1a" };
  }
}

function MarkerGlyph({
  marker,
  index,
  position,
  hovered,
  onOver,
  onOut,
  setHovered,
  setSelected,
}: {
  marker: StrategicMarker;
  index: number;
  position: [number, number, number];
  hovered: boolean;
  onOver: (id: string) => void;
  onOut: () => void;
  setHovered: (
    t:
      | {
          id: string;
          type: "marker";
          label: string;
          kind: string;
          strength?: number;
          t?: number;
        }
      | null
  ) => void;
  setSelected: (t: {
    id: string;
    type: "marker";
    label: string;
    kind: string;
    strength?: number;
    t?: number;
  }) => void;
}) {
  const { core, halo, base } = palette(marker.kind);
  const strength = clamp01(marker.strength ?? 0.6);
  const scale = (hovered ? 1.08 : 1.0) * (0.85 + strength * 0.55);

  const glyphGeom = useMemo(() => {
    switch (marker.kind) {
      case "risk": // diamond
        return new THREE.OctahedronGeometry(0.35, 0);
      case "liquidity": // hex
        return new THREE.CylinderGeometry(0.34, 0.34, 0.2, 6);
      case "value": // triangle
        return new THREE.CylinderGeometry(0.36, 0.36, 0.2, 3);
      case "strategy": // square
        return new THREE.BoxGeometry(0.52, 0.2, 0.52);
      default:
        return new THREE.BoxGeometry(0.45, 0.2, 0.45);
    }
  }, [marker.kind]);

  const baseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(base),
        metalness: 0.85,
        roughness: 0.38,
        emissive: new THREE.Color("#020617"),
        emissiveIntensity: 0.1,
      }),
    [base]
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: halo,
        transparent: true,
        opacity: hovered ? 0.65 : 0.32,
        depthTest: false,
        depthWrite: false,
      }),
    [halo, hovered]
  );

  const coreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: core,
        transparent: true,
        opacity: hovered ? 0.92 : 0.72,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [core, hovered]
  );

  const pillarMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: core,
        transparent: true,
        opacity: hovered ? 0.2 : 0.12,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [core, hovered]
  );

  const userData = useMemo(
    () => ({
      marker: true,
      id: `sf-marker-${marker.id}`,
      markerId: marker.id,
      kind: marker.kind,
      label: marker.label,
      strength,
      index,
      // If path-anchored, preserve t for narrative alignment
      t: "t" in marker ? clamp01(marker.t) : undefined,
    }),
    [marker, strength, index]
  );

  return (
    <group
      position={position}
      scale={[scale, scale, scale]}
      renderOrder={80}
      frustumCulled={false}
      userData={userData}
      onPointerOver={(e) => {
        e.stopPropagation();
        onOver(marker.id);
        setHovered({
          id: marker.id,
          type: "marker",
          label: marker.label,
          kind: marker.kind,
          strength,
          t: "t" in marker ? Math.max(0, Math.min(1, marker.t)) : undefined,
        });
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
        setSelected({
          id: marker.id,
          type: "marker",
          label: marker.label,
          kind: marker.kind,
          strength,
          t: "t" in marker ? Math.max(0, Math.min(1, marker.t)) : undefined,
        });
      }}
    >
      {/* Base puck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.48, 0.48, 0.12, 22]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Halo ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} frustumCulled={false}>
        <ringGeometry args={[0.56, 0.92, 64]} />
        <primitive object={ringMat} attach="material" />
      </mesh>

      {/* Vertical signal column */}
      <mesh position={[0, 1.15, 0]} frustumCulled={false}>
        <cylinderGeometry args={[0.06, 0.06, 2.2, 14, 1, true]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>

      {/* Core glyph */}
      <mesh position={[0, 0.36, 0]} frustumCulled={false} geometry={glyphGeom}>
        <primitive object={coreMat} attach="material" />
      </mesh>
    </group>
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
