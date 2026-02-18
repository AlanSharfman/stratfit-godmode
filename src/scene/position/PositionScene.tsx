import MarkerSprites from "./MarkerSprites";
import PinBeam from "./PinBeam";
import CameraRig from "./CameraRig";
import DepthCue from "./DepthCue";
import SceneVignette from "./SceneVignette";

export default function PositionScene() {
  return (
    <>
      <CameraRig />
      <DepthCue />
      <SceneVignette />

      <MarkerSprites position={[0, 0.4, 0]} label="Current Position" active />
      <MarkerSprites position={[2, 0.3, -1]} label="Milestone A" />
      <MarkerSprites position={[-2, 0.25, -2]} label="Milestone B" />

      <PinBeam start={[0, 3, 0]} end={[0, 0.4, 0]} intensity={0.6} />
    </>
  );
}
