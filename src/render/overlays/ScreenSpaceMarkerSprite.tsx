import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp, worldUnitsPerPixel } from "./screenSpace";

type Props = {
  position: THREE.Vector3;
  sizePx?: number;          // marker diameter on screen
  liftY?: number;
  color?: string;
  opacity?: number;
  halo?: boolean;
  renderOrder?: number;
};

function makeCircleTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const r = size / 2;

  ctx.clearRect(0, 0, size, size);

  // soft halo + solid core
  const g = ctx.createRadialGradient(r, r, r * 0.12, r, r, r);
  g.addColorStop(0.00, "rgba(255,255,255,1)");
  g.addColorStop(0.28, "rgba(255,255,255,0.95)");
  g.addColorStop(0.55, "rgba(255,255,255,0.25)");
  g.addColorStop(1.00, "rgba(255,255,255,0.00)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function ScreenSpaceMarkerSprite({
  position,
  sizePx = 14,              // Mode B default
  liftY = 0.18,
  color = "#EAFBFF",
  opacity = 0.96,
  halo = true,
  renderOrder = 90,
}: Props) {
  const { camera, gl } = useThree();
  const coreRef = useRef<THREE.Sprite>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => makeCircleTexture(128), []);

  useFrame(() => {
    const hPx = gl.domElement?.clientHeight ?? 900;

    const worldPos = new THREE.Vector3(position.x, position.y + liftY, position.z);
    const dist = camera.position.distanceTo(worldPos);
    const wuPerPx = worldUnitsPerPixel(camera, dist, hPx);

    const sizeWorld = clamp(sizePx * wuPerPx, 0.05, 1.0);

    const core = coreRef.current;
    if (core) {
      core.position.copy(worldPos);
      core.scale.set(sizeWorld, sizeWorld, 1);
    }

    const h = haloRef.current;
    if (h) {
      h.position.copy(worldPos);
      const haloWorld = clamp(sizeWorld * 2.25, 0.10, 1.6);
      h.scale.set(haloWorld, haloWorld, 1);
    }
  });

  return (
    <group renderOrder={renderOrder}>
      {halo && (
        <sprite ref={haloRef}>
          <spriteMaterial
            map={tex}
            color={color}
            transparent
            opacity={0.26}
            depthWrite={false}
            depthTest
            toneMapped={false}
          />
        </sprite>
      )}
      <sprite ref={coreRef}>
        <spriteMaterial
          map={tex}
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
