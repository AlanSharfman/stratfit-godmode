// src/scene/SceneHost.tsx

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { routeHas3D, type SceneId } from "./sceneRegistry";

/**
 * STRATFIT RULE:
 * - Exactly ONE <Canvas> for the entire app.
 * - Scenes swap inside it.
 * - No route component is allowed to mount a Canvas.
 */

function SceneFallback() {
  return null;
}

function SceneSwitch({ scene }: { scene: SceneId }) {
  // TODO: Replace these with your real scene components
  // once you move your current Terrain/Studio/Compare 3D code into them.
  switch (scene) {
    case "terrain":
      return <TerrainScene />;
    case "compare":
      return <CompareScene />;
    case "risk":
      return <RiskScene />;
    case "valuation":
      return <ValuationScene />;
    case "assessment":
      return <AssessmentScene />;
    case "impact":
      return <ImpactScene />;
    case "simulate":
      return <SimulateScene />;
    default:
      return null;
  }
}

export default function SceneHost({ scene }: { scene: SceneId }) {
  const show3D = routeHas3D(scene);

  // Keep renderer stable. Do not key Canvas by route.
  // One renderer, one context, always.
  const dpr = useMemo(() => {
    return [1, 2] as [number, number];
  }, []);

  if (!show3D) return null;

  return (
    <div className="sf-sceneHost" style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        camera={{ position: [0, 2.2, 6.5], fov: 45 }}
        frameloop="always"
      >
        <Suspense fallback={<SceneFallback />}>
          <SceneSwitch scene={scene} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function TerrainScene() {
  return null;
}
function CompareScene() {
  return null;
}
function RiskScene() {
  return null;
}
function ValuationScene() {
  return null;
}
function AssessmentScene() {
  return null;
}
function ImpactScene() {
  return null;
}
function SimulateScene() {
  return null;
}
