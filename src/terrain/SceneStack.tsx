import React, { Suspense, useEffect, useRef, useState } from "react";

import BackgroundTerrain from "./BackgroundTerrain";
import TerrainSurface from "./TerrainSurface";
import type { TerrainSurfaceHandle } from "./TerrainSurface";
import HorizonBand from "./HorizonBand";
import TimelineAxis from "./TimelineAxis";

import ProbabilityEnvelope from "@/paths/ProbabilityEnvelope";
import P50Path from "@/paths/P50Path";
import TimelineTicks, { type TimeGranularity } from "@/position/TimelineTicks";

import PathNodes from "./PathNodes";
import StructuralPillars from "./StructuralPillars";
import AnnotationAnchors from "./AnnotationAnchors";

import MarkerLayer from "@/components/terrain/markers/MarkerLayer";
import LiquidityFlowLayer from "@/components/terrain/liquidity/LiquidityFlowLayer";

import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { baselineSeedString } from "@/terrain/seed";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";

type Props = {
  granularity?: TimeGranularity;
};

export default function SceneStack({ granularity }: Props) {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);
  const [terrainReady, setTerrainReady] = useState(false);

  const { baseline } = useSystemBaseline();
  const rebuildKey = baselineSeedString(baseline as any);
  const horizonMonths = (baseline as any)?.posture?.horizonMonths ?? 36;

  const renderFlags = useRenderFlagsStore();

  useEffect(() => {
    if (terrainReady) return;
    let cancelled = false;
    let raf: number;

    function check() {
      if (cancelled) return;
      if (terrainRef.current) {
        setTerrainReady(true);
        return;
      }
      raf = requestAnimationFrame(check);
    }

    check();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [terrainReady]);

  return (
    <group>
      {/* 0) Distant silhouette first */}
      <BackgroundTerrain />

      {/* 1) Primary terrain */}
      <Suspense fallback={null}>
        <TerrainSurface ref={terrainRef} />
      </Suspense>
      <HorizonBand />

      {/* 2) Path layers (hero) */}
      {renderFlags.showEnvelope && <ProbabilityEnvelope />}
      {renderFlags.showPaths && terrainReady && (
        <P50Path terrainRef={terrainRef} rebuildKey={rebuildKey} />
      )}

      {/* 3) Timeline */}
      <TimelineAxis />
      {terrainReady && (
        <TimelineTicks
          terrainRef={terrainRef}
          granularity={granularity}
          horizonMonths={horizonMonths}
          rebuildKey={rebuildKey}
        />
      )}

      {/* 4) Markers/anchors */}
      {renderFlags.showMarkers && <PathNodes />}
      {renderFlags.showPreview && <StructuralPillars />}
      {renderFlags.showAnnotations && <AnnotationAnchors />}

      {terrainReady && (
        <>
          <LiquidityFlowLayer terrainRef={terrainRef} enabled={renderFlags.showFlow} />
          <MarkerLayer terrainRef={terrainRef} enabled={renderFlags.showMarkers} />
        </>
      )}
    </group>
  );
}
