import React, { useMemo } from "react";
import { useFoundationStore } from "../../store/foundationStore";
import { foundationToMountainDataPoints } from "../../logic/foundationToMountainDataPoints";
import { ScenarioMountain25D } from "../mountain/ScenarioMountain25D";

export function FoundationMountainPreview() {
  const { draft, baseline, locked, dirtySinceLock } = useFoundationStore();
  const source = locked && baseline ? baseline : draft;

  const dataPoints = useMemo(() => foundationToMountainDataPoints(source), [source]);

  return (
    <div className="fd-mountainPreview">
      <div className="fd-mountainCanvasFrame">
        <ScenarioMountain25D dataPoints={dataPoints} width={960} height={340} />
      </div>
      <div className="fd-mountainMeta">
        <div className="fd-mountainMetaLeft">
          <div className="fd-mountainMetaTitle">TERRAIN PREVIEW</div>
          <div className="fd-mountainMetaSub">2.5D wireframe (no WebGL). Updates live from your baseline inputs.</div>
        </div>
        <div className="fd-mountainMetaRight">
          <div className={`fd-mountainMetaBadge ${locked ? "locked" : "draft"}`}>
            {locked ? "LOCKED BASELINE" : "DRAFT"}
          </div>
          {dirtySinceLock ? <div className="fd-mountainMetaHint">Re-lock to update downstream terrain.</div> : null}
        </div>
      </div>
    </div>
  );
}


