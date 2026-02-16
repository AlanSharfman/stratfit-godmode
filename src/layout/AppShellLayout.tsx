/**
 * AppShellLayout — GOD MODE top-level layout shell.
 * Provides left rail, center stage, right rail structure.
 * Does NOT touch terrain/shaders/camera.
 */
import React from "react";
import styles from "./AppShellLayout.module.css";

interface Props {
    /** Top bar content */
    topBar?: React.ReactNode;
    /** Left rail content (outcome cards, metrics) */
    leftRail?: React.ReactNode;
    /** Center stage content (terrain canvas + overlays) */
    centerStage: React.ReactNode;
    /** Right rail content (intelligence panel) */
    rightRail?: React.ReactNode;
    /** Optional overlay that mounts INSIDE center stage (diagnostics drawer) */
    centerOverlay?: React.ReactNode;
}

export default function AppShellLayout({
    topBar,
    leftRail,
    centerStage,
    rightRail,
    centerOverlay,
}: Props) {
    return (
        <div className={styles.shell}>
            {topBar && <div className={styles.topBar}>{topBar}</div>}

            <div className={styles.body}>
                {leftRail && <div className={styles.leftRail}>{leftRail}</div>}

                <div className={styles.centerStage}>
                    {centerStage}
                    {centerOverlay && (
                        <div className={styles.centerOverlay}>{centerOverlay}</div>
                    )}
                </div>

                {rightRail && <div className={styles.rightRail}>{rightRail}</div>}
            </div>
        </div>
    );
}
