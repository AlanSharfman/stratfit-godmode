import React from "react";

import type { CenterViewId } from "@/types/view";

type Props = {
  value: CenterViewId;
  onChange: (m: CenterViewId) => void;
  className?: string;
};

const tabs: { key: CenterViewId; label: string }[] = [
  { key: "terrain", label: "BASELINE" },
  { key: "impact", label: "IMPACT" },
  { key: "compare", label: "COMPARE" },
];

export default function CenterViewSegmented({ value, onChange, className }: Props) {
  return (
    <div className={className ?? ""}>
      <style>{`
        /* COMMAND DECK — Premium Mode Selector */
        .command-tabs {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 6px 8px;
          margin-left: 8px;
          margin-right: 28px;

          background: linear-gradient(180deg, rgba(12, 16, 22, 0.95), rgba(6, 9, 14, 0.98));
          border: 1px solid rgba(80, 120, 160, 0.18);
          border-radius: 14px;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 8px 24px rgba(0,0,0,0.55);
        }

        .mode-btn {
          position: relative;
          padding: 10px 22px;
          background: transparent;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(180, 200, 220, 0.55);
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .mode-btn:hover:not(.active) {
          color: rgba(220, 235, 250, 0.85);
          background: rgba(120, 180, 255, 0.06);
        }

        /* ACTIVE STATE — Cyan glow */
        .mode-btn.active {
          color: #22d3ee;
          background: linear-gradient(180deg, rgba(34, 211, 238, 0.12), rgba(34, 211, 238, 0.04));
          border-radius: 10px;
          text-shadow: 0 0 12px rgba(34, 211, 238, 0.6), 0 0 24px rgba(34, 211, 238, 0.3);
          box-shadow:
            0 0 16px rgba(34, 211, 238, 0.25),
            0 0 32px rgba(34, 211, 238, 0.12),
            inset 0 1px 0 rgba(34, 211, 238, 0.15);
        }

        /* Underline glow for active */
        .mode-btn.active::after {
          content: "";
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 6px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, 
            rgba(34, 211, 238, 0),
            rgba(34, 211, 238, 0.9),
            rgba(34, 211, 238, 0)
          );
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
        }

        /* SEPARATOR LINE after first tab */
        .mode-separator {
          width: 1px;
          height: 22px;
          margin: 0 4px;
          background: linear-gradient(180deg,
            rgba(120, 180, 255, 0),
            rgba(120, 180, 255, 0.25),
            rgba(120, 180, 255, 0)
          );
        }
      `}</style>
      <div className="command-tabs">
        {tabs.map((t, i) => {
          const active = value === t.key;
          return (
            <React.Fragment key={t.key}>
              <button
                type="button"
                onClick={() => onChange(t.key)}
                className={`mode-btn ${active ? "active" : ""}`}
              >
                {t.label}
              </button>
              {/* Separator after first tab */}
              {i === 0 && <div className="mode-separator" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
