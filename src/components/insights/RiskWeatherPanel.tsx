import React from "react";
import {
  useRiskWeatherStore,
  type WeatherCondition,
  type RiskZone,
  type RiskAlert,
  type WeatherForecast,
} from "@/state/riskWeatherStore";

/**
 * RiskWeatherPanel displays the current strategic "weather" conditions
 * across different risk zones.
 *
 * Features:
 * - Global condition indicator
 * - Zone-by-zone breakdown
 * - Active alerts display
 * - Forecast timeline
 */
export default function RiskWeatherPanel() {
  const { zones, globalCondition, forecasts, lastUpdated } = useRiskWeatherStore();

  if (zones.length === 0) {
    return (
      <div style={panelStyle}>
        <Header globalCondition={globalCondition} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <Header globalCondition={globalCondition} />

      {/* Zone Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>

      {/* Forecasts */}
      {forecasts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={sectionTitleStyle}>Forecast</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {forecasts
              .filter((f) => f.horizon === "short")
              .map((f, i) => (
                <ForecastPill key={i} forecast={f} />
              ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div style={{ marginTop: 14, fontSize: 10, opacity: 0.5, textAlign: "right" }}>
        Updated {new Date(lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}

function Header({ globalCondition }: { globalCondition: WeatherCondition }) {
  const conditionConfig = getConditionConfig(globalCondition);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: conditionConfig.bgGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          boxShadow: `0 0 16px ${conditionConfig.glowColor}`,
        }}
      >
        {conditionConfig.icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", opacity: 0.6 }}>
          STRATEGIC WEATHER
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: conditionConfig.textColor }}>
          {conditionConfig.label}
        </div>
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: RiskZone }) {
  const conditionConfig = getConditionConfig(zone.condition);
  const criticalAlerts = zone.alerts.filter((a: RiskAlert) => a.severity === "critical");

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${conditionConfig.borderColor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{zone.name}</div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 999,
            background: conditionConfig.badgeBg,
            color: conditionConfig.textColor,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {conditionConfig.label}
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6, lineHeight: 1.4 }}>
        {zone.description}
      </div>

      {/* Risk Scores */}
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <ScoreIndicator label="Risk" value={zone.riskScore} color="#f59e0b" />
        <ScoreIndicator label="Confidence" value={zone.confidenceScore} color="#22d3ee" />
        <ScoreIndicator label="Volatility" value={zone.volatilityScore} color="#a78bfa" />
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {criticalAlerts.map((alert: RiskAlert) => (
            <div
              key={alert.id}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                fontSize: 11,
                color: "#fca5a5",
                marginTop: 6,
              }}
            >
              ⚠ {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreIndicator({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 3 }}>{label}</div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value * 100}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

function ForecastPill({ forecast }: { forecast: WeatherForecast }) {
  const conditionConfig = getConditionConfig(forecast.condition);
  const horizonLabel = forecast.horizon === "short" ? "1-3mo" : forecast.horizon === "medium" ? "3-6mo" : "6-12mo";

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        background: conditionConfig.badgeBg,
        border: `1px solid ${conditionConfig.borderColor}`,
        fontSize: 10,
      }}
    >
      <div style={{ opacity: 0.7 }}>{horizonLabel}</div>
      <div style={{ fontWeight: 600, color: conditionConfig.textColor }}>{conditionConfig.label}</div>
      <div style={{ opacity: 0.5, fontSize: 9 }}>{Math.round(forecast.probability * 100)}%</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ marginTop: 20, textAlign: "center", opacity: 0.6, fontSize: 12 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>☀️</div>
      No risk zones configured.
      <br />
      Run a scenario to generate weather data.
    </div>
  );
}

function getConditionConfig(condition: WeatherCondition) {
  switch (condition) {
    case "clear":
      return {
        icon: "☀️",
        label: "Clear",
        textColor: "#22d3ee",
        borderColor: "rgba(34, 211, 238, 0.25)",
        badgeBg: "rgba(34, 211, 238, 0.12)",
        bgGradient: "linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(34, 211, 238, 0.05))",
        glowColor: "rgba(34, 211, 238, 0.3)",
      };
    case "cloudy":
      return {
        icon: "⛅",
        label: "Cloudy",
        textColor: "#94a3b8",
        borderColor: "rgba(148, 163, 184, 0.25)",
        badgeBg: "rgba(148, 163, 184, 0.12)",
        bgGradient: "linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.05))",
        glowColor: "rgba(148, 163, 184, 0.3)",
      };
    case "stormy":
      return {
        icon: "⛈️",
        label: "Stormy",
        textColor: "#f59e0b",
        borderColor: "rgba(245, 158, 11, 0.25)",
        badgeBg: "rgba(245, 158, 11, 0.12)",
        bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))",
        glowColor: "rgba(245, 158, 11, 0.3)",
      };
    case "critical":
      return {
        icon: "🌪️",
        label: "Critical",
        textColor: "#ef4444",
        borderColor: "rgba(239, 68, 68, 0.25)",
        badgeBg: "rgba(239, 68, 68, 0.12)",
        bgGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))",
        glowColor: "rgba(239, 68, 68, 0.3)",
      };
  }
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  left: 18,
  top: 88,
  width: 280,
  maxHeight: "calc(100vh - 140px)",
  overflow: "auto",
  borderRadius: 16,
  background: "rgba(6, 10, 14, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
  backdropFilter: "blur(14px)",
  padding: 14,
  color: "rgba(235, 248, 255, 0.92)",
  zIndex: 50,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  opacity: 0.6,
  textTransform: "uppercase",
};
