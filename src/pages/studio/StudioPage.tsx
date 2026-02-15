import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./StudioPage.module.css";

import StudioSceneRoot from "@/components/studio/StudioSceneRoot";

import { LeverStack } from "@/components/strategy-studio/LeverStack";
import { TopControlBar } from "@/components/strategy-studio/TopControlBar";
import { TimelineScrubber } from "@/components/strategy-studio/TimelineScrubber";
import SimulationActivityPanel from "@/components/strategy-studio/SimulationActivityPanel";
import { DeltaSummaryPanel } from "@/components/strategy-studio/DeltaSummaryPanel";
import { useAnchorRegistry } from "@/spatial/AnchorRegistry";

export default function StudioPage() {
    // Phase 4: Register minimum spatial anchors
    useEffect(() => {
        const reg = useAnchorRegistry.getState();
        reg.upsertAnchor("origin", { x: 0, y: 0, z: 0 }, 1, "Origin");
        reg.upsertAnchor("timelineStart", { x: 0, y: 0, z: 0.1 }, 1, "Timeline Start");
        reg.upsertAnchor("timelineEnd", { x: 1, y: 0, z: 0.1 }, 1, "Timeline End");
        reg.upsertAnchor("p50_mid", { x: 0.5, y: 0, z: 0.4 }, 2, "P50 Mid");
    }, []);

    const [levers, setLevers] = useState<any>(() => {
        return [
            { id: "demandStrength", label: "Demand Strength", value: 60, min: 0, max: 100, group: "growth" },
            { id: "expansionVelocity", label: "Expansion Velocity", value: 45, min: 0, max: 100, group: "growth" },
            { id: "pricingPower", label: "Pricing Power", value: 50, min: 0, max: 100, group: "pricing" },
            { id: "costDiscipline", label: "Cost Discipline", value: 55, min: 0, max: 100, group: "cost" },
            { id: "operatingDrag", label: "Operating Drag", value: 35, min: 0, max: 100, group: "cost" },
            { id: "marketVolatility", label: "Market Volatility", value: 30, min: 0, max: 100, group: "capital" },
            { id: "executionRisk", label: "Execution Risk", value: 25, min: 0, max: 100, group: "capital" },
            { id: "fundingPressure", label: "Funding Pressure", value: 20, min: 0, max: 100, group: "capital" },
            { id: "hiringIntensity", label: "Hiring Intensity", value: 40, min: 0, max: 100, group: "operations" },
        ];
    });

    const onLeverChange = useCallback((leverId: string, nextValue: number) => {
        setLevers((prev: any[]) =>
            prev.map((l) => (l?.id === leverId ? { ...l, value: nextValue } : l))
        );
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

    const LeverStackAny = LeverStack as any;
    const TopControlBarAny = TopControlBar as any;
    const TimelineScrubberAny = TimelineScrubber as any;
    const SimulationActivityPanelAny = SimulationActivityPanel as any;
    const DeltaSummaryPanelAny = DeltaSummaryPanel as any;

    return (
        <div className={styles.page}>
            <aside className={styles.leftRail}>
                <LeverStackAny levers={levers} onLeverChange={onLeverChange} />
            </aside>

            <main className={styles.centerStage}>
                <div className={styles.sceneLayer}>
                    <StudioSceneRoot />
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
