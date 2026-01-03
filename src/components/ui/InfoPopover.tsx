import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  content: React.ReactNode;
  className?: string;

  // if you want click instead of hover, set to "click"
  mode?: "hover" | "click";
};

export default function InfoPopover({
  content,
  className,
  mode = "hover",
}: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const closeTimer = useRef<number | null>(null);

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    // place panel just under the icon, aligned left with offset for readability
    setPos({
      top: r.bottom + 12,
      left: Math.max(16, r.left - 8),
    });
  };

  const safeOpen = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    updatePos();
    setOpen(true);
  };

  const safeClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  // Keep position correct if user scrolls/resizes while open
  useEffect(() => {
    if (!open) return;

    const onScroll = () => updatePos();
    const onResize = () => updatePos();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Close if clicking elsewhere (for click mode)
  useEffect(() => {
    if (!open || mode !== "click") return;

    const onDown = (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      if (btn.contains(e.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, mode]);

  const triggerProps =
    mode === "hover"
      ? {
          onMouseEnter: safeOpen,
          onMouseLeave: safeClose,
          onFocus: safeOpen,
          onBlur: safeClose,
        }
      : {
          onClick: () => (open ? setOpen(false) : safeOpen()),
        };

  const panel = open ? (
    <div
      onMouseEnter={mode === "hover" ? safeOpen : undefined}
      onMouseLeave={mode === "hover" ? safeClose : undefined}
      className={className ?? ""}
      style={{
        position: "fixed",
        zIndex: 99999,
        top: pos.top,
        left: pos.left,
        width: 320,
        padding: "16px 18px",
        borderRadius: 10,
        border: "1px solid rgba(100, 116, 139, 0.25)",
        background: "rgba(30, 35, 45, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 13,
          lineHeight: 1.65,
          color: "rgba(255, 255, 255, 0.80)",
          letterSpacing: "0.01em",
        }}
      >
        {content}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Info"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          marginLeft: 6,
          borderRadius: "50%",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          background: "rgba(148, 163, 184, 0.08)",
          color: "rgba(148, 163, 184, 0.70)",
          fontSize: 10,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 400,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.45)";
          e.currentTarget.style.background = "rgba(148, 163, 184, 0.15)";
          e.currentTarget.style.color = "rgba(148, 163, 184, 0.90)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
          e.currentTarget.style.background = "rgba(148, 163, 184, 0.08)";
          e.currentTarget.style.color = "rgba(148, 163, 184, 0.70)";
        }}
        {...triggerProps}
      >
        i
      </button>

      {open && createPortal(panel, document.body)}
    </>
  );
}
