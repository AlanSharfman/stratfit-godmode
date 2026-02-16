/**
 * DiagnosticsDrawer — Collapsible panel for debug toggles.
 * Hybrid cockpit: presented as Command Centre.
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
    title?: string;
}

export default function DiagnosticsDrawer({ open, onClose, groups, title = "Command Centre" }: Props) {
    if (!open) return null;

    return (
        <>
            <div className={styles.backdrop} onClick={onClose} />

            <div className={styles.drawer} role="dialog" aria-label={title}>
                <div className={styles.header}>
                    <div className={styles.title}>{title}</div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

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
