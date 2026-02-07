import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";

export function ConfirmModal(props: {
  isOpen: boolean;
  kicker?: string;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    isOpen,
    kicker = "Confirm",
    title,
    body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
  } = props;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return createPortal(
    <div className={styles.backdrop} role="dialog" aria-modal="true" onMouseDown={onCancel}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <div className={styles.kicker}>{kicker}</div>
          <div className={styles.title}>{title}</div>
          <div className={styles.body}>{body}</div>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;


