import React, { useMemo, useState } from "react";
import styles from "./LockedModule.module.css";

type Props = {
  title: string;
  description: string;
  badge: string;
  gradient?: string; // CSS gradient string
  thumbnailSrc?: string;
  onActivate?: () => void;
};

export function LockedModule({
  title,
  description,
  badge,
  gradient,
  thumbnailSrc,
  onActivate,
}: Props) {
  const [imgError, setImgError] = useState(false);

  const thumbStyle = useMemo(() => {
    if (thumbnailSrc && !imgError) return undefined;
    return { background: gradient ?? "linear-gradient(135deg, rgba(34,211,238,0.22), rgba(99,102,241,0.18))" } as React.CSSProperties;
  }, [thumbnailSrc, imgError, gradient]);

  function activate() {
    onActivate?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  }

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`${title} (locked)`}
      onClick={activate}
      onKeyDown={onKeyDown}
    >
      <div className={styles.thumb} style={thumbStyle} aria-hidden="true">
        {thumbnailSrc && !imgError ? (
          <img
            src={thumbnailSrc}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgError(true)}
          />
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <svg className={styles.lock} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div className={styles.title}>{title}</div>
        </div>

        <div className={styles.desc}>{description}</div>
      </div>

      <div className={styles.badge}>{badge}</div>
    </div>
  );
}


