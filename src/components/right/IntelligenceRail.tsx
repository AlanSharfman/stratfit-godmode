/**
 * IntelligenceRail — Right rail container for AI intelligence panel.
 * Renders children with proper spacing.
 */
import React from "react";
import styles from "./IntelligenceRail.module.css";

interface Props {
    children: React.ReactNode;
}

export default function IntelligenceRail({ children }: Props) {
    return (
        <div className={styles.rail}>
            <div className={styles.content}>{children}</div>
        </div>
    );
}
