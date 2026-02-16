/**
 * OutcomeRail — Left rail container for outcome cards and metrics.
 * Renders children with proper spacing and scrolling.
 */
import React from "react";
import styles from "./OutcomeRail.module.css";

interface Props {
    children: React.ReactNode;
}

export default function OutcomeRail({ children }: Props) {
    return (
        <div className={styles.rail}>
            <div className={styles.content}>{children}</div>
        </div>
    );
}
