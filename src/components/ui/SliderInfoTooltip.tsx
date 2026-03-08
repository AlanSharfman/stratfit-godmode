// src/components/ui/SliderInfoTooltip.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  anchorRect: DOMRect | null;
  children: React.ReactNode;
  preferredSide?: "right" | "left";
  offset?: number;
};

export default function SliderInfoTooltip({
  anchorRect,
  children,
  preferredSide = "right",
  offset = 18,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const panelWidth = 320;
  const panelHeight = 150;

  const style = useMemo<React.CSSProperties | null>(() => {
    if (!anchorRect) return null;

    const pad = 10;

    // Base: place to the right of the icon
    const placeRight = preferredSide !== "left";
    const leftRight = anchorRect.right + offset;
    const leftLeft = anchorRect.left - offset;

    // We’ll decide side after we know viewport bounds
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Tooltip sizing assumptions (we keep fixed width in CSS)
    const w = panelWidth;
    const h = panelHeight;

    // Candidate positions
    const top = Math.min(vh - h - pad, Math.max(pad, anchorRect.top - 6));

    // Right side if it fits, otherwise flip left
    const fitsRight = leftRight + w + pad <= vw;
    const useRight = placeRight ? fitsRight : !(leftLeft - w - pad >= 0);

    const left = useRight ? leftRight : Math.max(pad, leftLeft - w);

    return {
      position: "fixed",
      top,
      left,
      width: w,
      zIndex: 999999, // above mountain/canvas always
      pointerEvents: "none",
    };
  }, [anchorRect, preferredSide, offset, panelHeight, panelWidth]);

  if (!mounted || !anchorRect || !style) return null;

  const w = panelWidth;
  const leftPx =
    typeof style.left === "number"
      ? style.left
      : Number.parseFloat(String(style.left ?? "0").replace("px", ""));
  const useRight = leftPx >= anchorRect.right; // heuristic from computed left
  const arrowX = useRight ? -12 : w + 12;

  const panelStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: 18,
    padding: "18px 18px 16px",
    background: "linear-gradient(135deg, rgba(13,26,48,0.96), rgba(5,10,20,0.98))",
    border: "1px solid rgba(34, 211, 238, 0.18)",
    boxShadow:
      "0 18px 42px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px rgba(34,211,238,0.08)",
    backdropFilter: "blur(16px)",
    color: "rgba(226, 232, 240, 0.92)",
  };

  const armStyle: React.CSSProperties = {
    position: "absolute",
    width: 38,
    height: 2,
    borderRadius: 999,
    background: useRight
      ? "linear-gradient(90deg, rgba(34,211,238,0), rgba(34,211,238,0.55))"
      : "linear-gradient(90deg, rgba(34,211,238,0.55), rgba(34,211,238,0))",
    boxShadow: "0 0 12px rgba(34,211,238,0.24)",
  };

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: 14,
    height: 14,
    transform: "translate(-50%, -50%) rotate(45deg)",
    background: "linear-gradient(135deg, rgba(21, 42, 70, 0.98), rgba(8, 16, 28, 0.98))",
    borderLeft: "1px solid rgba(34, 211, 238, 0.24)",
    borderTop: "1px solid rgba(34, 211, 238, 0.24)",
    boxShadow: "0 0 14px rgba(34, 211, 238, 0.08)",
  };

  return createPortal(
    <div style={style} className="sf-tooltip">
      {/* Arrow “arm” that visually extends away from the icon */}
      <div
        className={`sf-tooltip__arm ${useRight ? "right" : "left"}`}
        style={{
          ...armStyle,
          top: 18,
          left: useRight ? -40 : "auto",
          right: useRight ? "auto" : -40,
        }}
      />
      {/* Arrow head */}
      <div
        className={`sf-tooltip__arrow ${useRight ? "right" : "left"}`}
        style={{
          ...arrowStyle,
          top: 25,
          left: arrowX,
        }}
      />
      <div className="sf-tooltip__panel" style={panelStyle}>{children}</div>
    </div>,
    document.body
  );
}
