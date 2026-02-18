import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./StudioPage.module.css";

import StudioSceneRoot from "@/components/studio/StudioSceneRoot";
import StudioStage from "@/scene/studio/StudioStage";

import { LeverStack } from "@/components/strategy-studio/LeverStack";
import { TopControlBar } from "@/components/strategy-studio/TopControlBar";
import { TimelineScrubber } from "@/components/strategy-studio/TimelineScrubber";
import SimulationActivityPanel from "@/components/strategy-studio/SimulationActivityPanel";
import { DeltaSummaryPanel } from "@/components/strategy-studio/DeltaSummaryPanel";
import { useAnchorRegistry } from "@/spatial/AnchorRegistry";
import type { LeverState } from "@/logic/calculateMetrics";

export default function StudioPage() {
    // Phase 4: Register minimum spatial anchors
    useEffect(() => {
        const reg = useAnchorRegistry.getState();
        reg.upsertAnchor("origin", { x: 0, y: 0, z: 0 }, 1, "Origin");
        reg.upsertAnchor("timelineStart", { x: 0, y: 0, z: 0.1 }, 1, "Timeline Start");
        reg.upsertAnchor("timelineEnd", { x: 1, y: 0, z: 0.1 }, 1, "Timeline End");
        reg.upsertAnchor("p50_mid", { x: 0.5, y: 0, z: 0.4 }, 2, "P50 Mid");
    }, []);

    const [levers, setLevers] = useState<LeverState>(() => ({
        demandStrength: 60,
        expansionVelocity: 45,
        pricingPower: 50,
        costDiscipline: 55,
        operatingDrag: 35,
        marketVolatility: 30,
        executionRisk: 25,
        fundingPressure: 20,
        hiringIntensity: 40,
    }));

    const onLeverChange = useCallback((key: keyof LeverState, value: number) => {
        setLevers((prev) => ({ ...prev, [key]: value }));
    }, []);

    const [activeTab, setActiveTab] = useState<any>("A");
    const [horizon, setHorizon] = useState<any>("12m");
    const [rampType, setRampType] = useState<any>("linear");
    const [compareMode, setCompareMode] = useState<any>(false);

    const [currentMonth, setCurrentMonth] = useState<number>(0);
    const onTimelineChange = useCallback((nextMonth: number) => {
        setCurrentMonth(nextMonth);
    }, []);

    const [isAutoSimming] = useState<boolean>(false);

    const telemetry = useMemo(() => {
        return {
            isRunning: isAutoSimming,
            iterationsCompleted: 0,
            iterationsTarget: 10000,
            durationMs: 0,
            justCompleted: false,
        };
    }, [isAutoSimming]);

    const deltas = useMemo(() => {
        return {
            survival: { baseline: 85, scenario: 85, delta: 0 },
            ev: { baseline: 50, scenario: 50, delta: 0 },
            runway: { baseline: 18, scenario: 18, delta: 0 },
            risk: { baseline: 25, scenario: 25, delta: 0 },
        };
    }, []);

    const scenarioLabel = useMemo(() => {
        if (activeTab === "A") return "Scenario A";
        if (activeTab === "B") return "Scenario B";
        return "Baseline";
    }, [activeTab]);

    const autoSimResult = useMemo(() => null, []);

    const TopControlBarAny = TopControlBar as any;
    const TimelineScrubberAny = TimelineScrubber as any;
    const SimulationActivityPanelAny = SimulationActivityPanel as any;
    const DeltaSummaryPanelAny = DeltaSummaryPanel as any;

    return (
        <div className={styles.page}>
            <aside className={styles.leftRail}>
                <LeverStack levers={levers} onLeverChange={onLeverChange} />
            </aside>

            <main className={styles.centerStage}>
                <div className={styles.sceneLayer}>
                    <StudioStage scene={<StudioSceneRoot />} />
                </div>

                <div className={styles.hudLayer}>
                    <div className={styles.hudTop}>
                        <TopControlBarAny
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            horizon={horizon}
                            onHorizonChange={setHorizon}
                            rampType={rampType}
                            onRampTypeChange={setRampType}
                            compareMode={compareMode}
                            onCompareModeChange={setCompareMode}
                        />
                    </div>

                    <div className={styles.hudRight}>
                        <DeltaSummaryPanelAny
                            deltas={deltas}
                            scenarioLabel={scenarioLabel}
                            isAutoSimming={isAutoSimming}
                            compareMode={compareMode}
                            autoSimResult={autoSimResult}
                        />
                    </div>

                    <div className={styles.hudTelemetry}>
                        <SimulationActivityPanelAny
                            isRunning={telemetry.isRunning}
                            iterationsCompleted={telemetry.iterationsCompleted}
                            iterationsTarget={telemetry.iterationsTarget}
                            durationMs={telemetry.durationMs}
                            justCompleted={telemetry.justCompleted}
                        />
                    </div>

                    <div className={styles.hudBottom}>
                        <TimelineScrubberAny currentMonth={currentMonth} onChange={onTimelineChange} />
                    </div>
                </div>
            </main>
        </div>
    );
}
