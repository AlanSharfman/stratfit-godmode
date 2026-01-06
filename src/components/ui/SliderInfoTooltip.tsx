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
    const w = 300;
    const h = 130;

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
  }, [anchorRect, preferredSide, offset]);

  if (!mounted || !anchorRect || !style) return null;

  const w = 300;
  const leftPx =
    typeof style.left === "number"
      ? style.left
      : Number.parseFloat(String(style.left ?? "0").replace("px", ""));
  const useRight = leftPx >= anchorRect.right; // heuristic from computed left
  const arrowX = useRight ? -12 : w + 12;

  return createPortal(
    <div style={style} className="sf-tooltip">
      {/* Arrow “arm” that visually extends away from the icon */}
      <div
        className={`sf-tooltip__arm ${useRight ? "right" : "left"}`}
        style={{
          top: 18,
          left: useRight ? -40 : "auto",
          right: useRight ? "auto" : -40,
        }}
      />
      {/* Arrow head */}
      <div
        className={`sf-tooltip__arrow ${useRight ? "right" : "left"}`}
        style={{
          top: 18,
          left: arrowX,
        }}
      />
      <div className="sf-tooltip__panel">{children}</div>
    </div>,
    document.body
  );
}
