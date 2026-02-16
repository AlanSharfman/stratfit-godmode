import React, { useMemo, useState } from "react";
import type { Mesh } from "three";

import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import StructuralMetricsPanel from "@/components/baseline/StructuralMetricsPanel";
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel";
import BaselineKeyStrip from "@/components/baseline/BaselineKeyStrip";
import MountainMarkers, { type MountainMarker } from "@/components/terrain/MountainMarkers";
import { useMarkerLinkStore } from "@/state/markerLinkStore";
import type { MetricId } from "@/types/baseline";
import {
    TerrainAnchorOverlay,
    BASELINE_METRIC_CONNECTIONS,
} from "@/components/mountain/anchorSystem";
import styles from "./BaselinePage.module.css";

export default function BaselinePage() {
    const [activeMetricId, setActiveMetricId] = useState<MetricId | null>(null);
    const [terrainMesh, setTerrainMesh] = useState<Mesh | null>(null);

    const activeId = useMarkerLinkStore((s) => s.activeId);
    const setActive = useMarkerLinkStore((s) => s.setActive);
    const setHover = useMarkerLinkStore((s) => s.setHover);

    const markers: MountainMarker[] = useMemo(() => {
        return [
            {
                id: "mk-arr",
                title: "ARR",
                subtitle: "Revenue fitness",
                tone: "info",
                uv: { u: 0.18, v: 0.22 },
                tooltip: {
                    what: "Annual recurring revenue baseline.",
                    why: "Scale anchors operating leverage and survival odds.",
                    how: "Increase ARR via retention + net new; protect margin.",
                },
            },
            {
                id: "mk-runway",
                title: "Runway",
                subtitle: "Liquidity horizon",
                tone: "risk",
                uv: { u: 0.36, v: 0.48 },
                tooltip: {
                    what: "Months of runway at current burn.",
                    why: "Short runway compresses optionality.",
                    how: "Cut burn, improve margin, raise capital.",
                },
            },
            {
                id: "mk-eff",
                title: "Efficiency",
                subtitle: "Burn multiple",
                tone: "strategy",
                uv: { u: 0.62, v: 0.34 },
                tooltip: {
                    what: "Burn relative to revenue production.",
                    why: "High burn multiple signals weak growth efficiency.",
                    how: "Rebalance spend toward proven growth loops.",
                },
            },
            {
                id: "mk-risk",
                title: "Structural Risk",
                subtitle: "Fragility",
                tone: "risk",
                uv: { u: 0.78, v: 0.58 },
                tooltip: {
                    what: "Composite risk readout from baseline composition.",
                    why: "Fragility compounds under volatility.",
                    how: "Increase runway, stabilize margin, reduce burn intensity.",
                },
            },
        ];
    }, []);

    const overlay = useMemo(() => {
        return (
            <>
                <TerrainAnchorOverlay
                    mode="baseline"
                    connections={BASELINE_METRIC_CONNECTIONS}
                    activeFromId={activeMetricId}
                    terrainMesh={terrainMesh}
                />

                <MountainMarkers
                    markers={markers}
                    terrainMesh={terrainMesh}
                    selectedId={activeId}
                    onHover={setHover}
                    onSelect={(id) => setActive(id)}
                />
            </>
        );
    }, [activeId, activeMetricId, markers, setActive, setHover, terrainMesh]);

    return (
        <div className={styles.page}>
            <BaselineKeyStrip />

            <div className={styles.content}>
                <div className={styles.leftRail}>
                    <StructuralMetricsPanel
                        activeMetricId={activeMetricId}
                        onHover={setActiveMetricId}
                    />
                </div>

                <div className={styles.centerStage}>
                    <div className={styles.stageFrame}>
                        <div className={styles.stageTitle}>
                            <div className={styles.stageTitleTop}>Deterministic Structural Baseline</div>
                            <div className={styles.stageTitleSub}>NO INTERVENTION APPLIED.</div>
                        </div>

                        <div className={styles.canvasWrap}>
                            <TerrainWithFallback>
                                <ScenarioMountain
                                    scenario="base"
                                    mode="baseline"
                                    heatmapEnabled={false}
                                    overlay={overlay}
                                    transparentContainer
                                    transparentScene
                                    baselineHighVisibility
                                    onTerrainMeshReady={(m) => setTerrainMesh((m as Mesh) ?? null)}
                                />
                            </TerrainWithFallback>
                        </div>
                    </div>
                </div>

                <div className={styles.rightRail}>
                    <BaselineIntelligencePanel />
                </div>
            </div>
        </div>
    );
}
