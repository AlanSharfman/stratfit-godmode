import React, { useMemo, useState } from "react";
import { useBeacons } from "@/signals/beacons/useBeacons";
import type { Beacon, BeaconType } from "@/signals/beacons/generateBeacons";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function beaconColor(type: BeaconType) {
  switch (type) {
    case "growth":
      return "var(--sf-emerald, #2ee9a6)";
    case "capital":
      return "var(--sf-indigo, #5b6cff)";
    case "risk":
      return "var(--sf-risk, #ff3b30)";
    case "liquidity":
      return "var(--sf-risk, #ff3b30)";
    default:
      return "var(--sf-cyan, #00e0ff)";
  }
}

function beaconLabel(type: BeaconType) {
  switch (type) {
    case "liquidity": return "LIQUIDITY";
    case "risk": return "RISK";
    case "growth": return "MOMENTUM";
    case "capital": return "CAPITAL";
    default: return "BEACON";
  }
}

function anchorToScreen(beacon: Beacon) {
  const t = clamp01(beacon.positionT01);
  return { leftPct: 18 + t * 64, topPct: 44 - t * 12 };
}

function SeverityBar({ color, severity01 }: { color: string; severity01: number }) {
  const w = `${Math.round(clamp01(severity01) * 100)}%`;
  return (
    <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ width: w, height: "100%", background: color }} />
    </div>
  );
}

export default function BeaconLayer() {
  const beacons = useBeacons();
  const [hoverId, setHoverId] = useState<string | null>(null);

  const hoverBeacon = useMemo(() => {
    if (!hoverId) return null;
    return beacons.find((b) => b.id === hoverId) ?? null;
  }, [hoverId, beacons]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
      <style>{`
        @keyframes sfBeaconPulse {
          0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0.55; }
          60%  { transform: translate(-50%, -50%) scale(1.25); opacity: 0.18; }
          100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0.00; }
        }
        @keyframes sfBeaconCoreBreath {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-50%, -50%) scale(1.06); }
        }
      `}</style>

      {beacons.map((b) => {
        const { leftPct, topPct } = anchorToScreen(b);
        const c = beaconColor(b.type);
        const sev = clamp01(b.severity01);
        const core = 10 + sev * 10;
        const halo = 22 + sev * 26;
        const alpha = 0.55 + sev * 0.35;
        const isHover = hoverId === b.id;

        return (
          <div key={b.id} style={{ position: "absolute", left: `${leftPct}%`, top: `${topPct}%`, width: 1, height: 1, pointerEvents: "none" }}>
            <div
              style={{ pointerEvents: "auto", position: "absolute", left: 0, top: 0, width: Math.max(28, core + 16), height: Math.max(28, core + 16), transform: "translate(-50%, -50%)", borderRadius: 999, background: "transparent" }}
              onMouseEnter={() => setHoverId(b.id)}
              onMouseLeave={() => setHoverId((prev) => (prev === b.id ? null : prev))}
              aria-label={b.title}
            >
              <div style={{ position: "absolute", left: "50%", top: "50%", width: halo, height: halo, borderRadius: 999, background: c, filter: "blur(10px)", opacity: alpha, animation: `sfBeaconPulse ${2.1 - sev * 0.8}s ease-out infinite` }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: halo, height: halo, borderRadius: 999, background: c, filter: "blur(14px)", opacity: 0.18 + sev * 0.18 }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: core, height: core, borderRadius: 999, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: `0 0 ${10 + sev * 24}px ${c}`, animation: `sfBeaconCoreBreath ${2.8 - sev * 1.1}s ease-in-out infinite`, display: "grid", placeItems: "center" }}>
                <div style={{ width: Math.max(5, 5 + sev * 5), height: Math.max(5, 5 + sev * 5), borderRadius: 999, background: c, opacity: 0.95 }} />
              </div>
              <div style={{ position: "absolute", left: "50%", top: `calc(50% + ${Math.max(18, core)}px)`, transform: "translate(-50%, 0)", fontSize: 10, fontWeight: 800, letterSpacing: 0.8, color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.10)", padding: "4px 8px", borderRadius: 999, whiteSpace: "nowrap", opacity: 0.85 }}>
                {beaconLabel(b.type)}
              </div>
              {isHover && (
                <div style={{ position: "absolute", left: "50%", top: `calc(50% - ${Math.max(26, halo)}px)`, transform: "translate(-50%, -100%)", width: 280, borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 16px 60px rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", pointerEvents: "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "rgba(255,255,255,0.92)" }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontVariantNumeric: "tabular-nums" }}>{Math.round(sev * 100)}%</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>{b.message}</div>
                  <div style={{ marginTop: 10 }}><SeverityBar color={c} severity01={sev} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Anchor: t={b.positionT01.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {hoverBeacon ? null : null}
    </div>
  );
}
