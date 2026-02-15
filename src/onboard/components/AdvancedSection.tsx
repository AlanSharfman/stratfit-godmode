// src/onboard/components/AdvancedSection.tsx

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function AdvancedSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const el = innerRef.current;
    if (!wrap || !el) return;
    const h = open ? el.scrollHeight : 0;
    wrap.style.height = `${h}px`;
  }, [open, children]);

  // Keep height synced if content changes while open
  useEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    const el = innerRef.current;
    if (!wrap || !el) return;
    const ro = new ResizeObserver(() => {
      wrap.style.height = `${el.scrollHeight}px`;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <div className="sfOn-advanced">
      <button type="button" className="sfOn-advancedToggle" onClick={onToggle}>
        <div className="sfOn-advancedToggleLeft">
          <div className="sfOn-advancedToggleTitle">Advanced {title} <span className="sfOn-optional">(Optional)</span></div>
          {subtitle ? <div className="sfOn-advancedToggleSub">{subtitle}</div> : null}
        </div>
        <ChevronDown className={`sfOn-advancedChevron ${open ? "isOpen" : ""}`} />
      </button>

      <div
        className={`sfOn-advancedWrap ${open ? "isOpen" : ""}`}
        ref={wrapRef}
        aria-hidden={!open}
      >
        <div ref={innerRef} className="sfOn-advancedInner">
          <div className={`sfOn-advancedMotion ${open ? "isOpen" : ""}`}>
            <GlassCard title={`Advanced ${title}`} subtitle={subtitle}>
              {children}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}


