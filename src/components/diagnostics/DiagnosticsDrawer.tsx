/**
 * DiagnosticsDrawer — Collapsible panel for debug toggles.
 * Mounts inside center stage overlay (position: absolute).
 */
import React from "react";
import styles from "./DiagnosticsDrawer.module.css";

interface ToggleItem {
    id: string;
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    visible?: boolean;
}

interface ToggleGroup {
    heading: string;
    items: ToggleItem[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    groups: ToggleGroup[];
}

export default function DiagnosticsDrawer({ open, onClose, groups }: Props) {
    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div className={styles.backdrop} onClick={onClose} />

            {/* Drawer */}
            <div className={styles.drawer}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.title}>Diagnostics</div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>
                        ×
                    </button>
                </div>

                {/* Groups */}
                {groups.map((group) => {
                    const visibleItems = group.items.filter((i) => i.visible !== false);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.heading} className={styles.group}>
                            <div className={styles.groupHeading}>{group.heading}</div>

                            <div className={styles.toggleList}>
                                {visibleItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => item.onChange(!item.value)}
                                        className={`${styles.toggleBtn} ${item.value ? styles.toggleBtnOn : ""}`}
                                    >
                                        <span>{item.label}</span>
                                        <span className={`${styles.toggleState} ${item.value ? styles.toggleStateOn : ""}`}>
                                            {item.value ? "ON" : "OFF"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
