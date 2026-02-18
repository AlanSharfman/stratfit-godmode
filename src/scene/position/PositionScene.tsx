import MarkerSprites from "./MarkerSprites";
import PinBeam from "./PinBeam";
import CameraRig from "./CameraRig";
import DepthCue from "./DepthCue";

export default function PositionScene() {
  return (
    <>
      <CameraRig />
      <DepthCue />

      {/* Primary Marker */}
      <MarkerSprites position={[0, 0.4, 0]} label="Current Position" active />

      {/* Secondary Markers */}
      <MarkerSprites position={[2, 0.3, -1]} label="Milestone A" />
      <MarkerSprites position={[-2, 0.25, -2]} label="Milestone B" />

      {/* Pin Beam */}
      <PinBeam start={[0, 3, 0]} end={[0, 0.4, 0]} intensity={0.7} />
    </>
  );
}
