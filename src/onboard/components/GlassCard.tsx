// src/onboard/components/GlassCard.tsx

import React from "react";

type Tone = "default" | "primary";

export function GlassCard({
  title,
  subtitle,
  tone = "default",
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  tone?: Tone;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`sfOn-card sfOn-card--${tone} ${className}`}>
      <header className="sfOn-cardHeader">
        <div className="sfOn-cardHeaderText">
          <div className="sfOn-cardTitle">{title}</div>
          {subtitle ? <div className="sfOn-cardSubtitle">{subtitle}</div> : null}
        </div>
        {right ? <div className="sfOn-cardHeaderRight">{right}</div> : null}
      </header>
      <div className="sfOn-cardBody">{children}</div>
    </section>
  );
}


