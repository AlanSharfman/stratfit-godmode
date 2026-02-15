import * as THREE from "three";
import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

type Props = {
  // When this increments, we trigger a new pulse.
  triggerId?: number;

  // Alias (per Baseline mounting spec): when this increments, trigger pulse.
  trigger?: number;

  // World position on terrain where the intervention occurred (x,y,z).
  center: [number, number, number];

  // Positive/negative impact affects intensity only (not hue)
  magnitude?: number; // 0..1

  // Duration in seconds
  duration?: number; // recommended 1.6–2.4
};

export default function InterventionShockwave({
  triggerId,
  trigger,
  center,
  magnitude = 0.65,
  duration = 2.0,
}: Props) {
  const group = useRef<THREE.Group>(null);

  const state = useRef({
    t: 999,
    active: false,
  });

  const effectiveTrigger = trigger ?? triggerId ?? 0;

  useEffect(() => {
    state.current.t = 0;
    state.current.active = true;
  }, [effectiveTrigger]);

  const rings = useMemo(() => {
    // 6 rings staggered
    const ringCount = 6;
    const items = [];
    for (let i = 0; i < ringCount; i++) {
      items.push({
        i,
        delay: i * 0.12,
      });
    }
    return items;
  }, []);

  const mat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6b63ff"), // Indigo/Violet strategic
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((_, dt) => {
    if (!state.current.active) return;

    state.current.t += dt;
    const t = state.current.t;

    if (group.current) {
      group.current.position.set(center[0], center[1] + 0.02, center[2]);
    }

    const children = group.current?.children ?? [];
    for (let idx = 0; idx < children.length; idx++) {
      const mesh = children[idx] as THREE.Mesh;
      const delay = rings[idx]?.delay ?? 0;
      const tt = t - delay;

      if (tt < 0) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;

      const p = THREE.MathUtils.clamp(tt / duration, 0, 1);

      // radius grows smoothly, never too fast
      const radius = THREE.MathUtils.lerp(0.25, 3.2, p);
      const thick = THREE.MathUtils.lerp(0.035, 0.010, p);

      mesh.scale.set(radius, radius, radius);

      // opacity: quick in, long fade
      const o = (1.0 - p) * (0.25 + magnitude * 0.35);
      (mesh.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(o, 0, 0.55);

      // thickness: cheat by scaling torus thickness (we do it by per-ring geometry prebuild; see below)
      mesh.userData._thick = thick;
    }

    // end
    if (t > duration + rings[rings.length - 1].delay + 0.2) {
      state.current.active = false;
      // hide all
      const children2 = group.current?.children ?? [];
      for (const c of children2) (c as THREE.Mesh).visible = false;
    }
  });

  return (
    <group ref={group}>
      {rings.map(({ i }) => (
        <mesh
          key={i}
          material={mat}
          rotation-x={Math.PI / 2}
          visible={false}
          geometry={new THREE.TorusGeometry(1, 0.02, 8, 160)}
        />
      ))}
    </group>
  );
}
