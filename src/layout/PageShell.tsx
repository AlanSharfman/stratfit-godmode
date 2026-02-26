// src/layout/PageShell.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Standard Page Shell
// Provides the canonical bright, professional wrapper for all non-Position pages.
// Matches the Assessment page's look: clean typography, institutional spacing,
// and consistent use of theme tokens.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"
import styles from "./PageShell.module.css"

interface PageShellProps {
  children: React.ReactNode
  /** Optional page title displayed at the top */
  title?: string
  /** Optional subtitle below the title */
  subtitle?: string
  /** Max-width override (default 1120px) */
  maxWidth?: number
  /** Extra className on root */
  className?: string
}

export default function PageShell({
  children,
  title,
  subtitle,
  maxWidth,
  className,
}: PageShellProps) {
  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {(title || subtitle) && (
        <header className={styles.header}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  )
}
