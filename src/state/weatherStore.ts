import { create } from "zustand";
import type {
  RiskWeatherState,
  WeatherCondition,
  WeatherAlert,
  WeatherForecast,
} from "@/types/simulation";

// ============================================================================
// RISK WEATHER STORE
// ============================================================================

type WeatherStoreState = {
  // Current weather state
  weather: RiskWeatherState;
  forecast: WeatherForecast | null;

  // Alerts
  alerts: WeatherAlert[];
  dismissedAlerts: Set<string>;

  // Settings
  enabled: boolean;
  sensitivity: number; // 0-1, how reactive to metric changes

  // Actions
  setWeather: (weather: Partial<RiskWeatherState>) => void;
  setCondition: (condition: WeatherCondition) => void;
  setForecast: (forecast: WeatherForecast) => void;
  addAlert: (alert: WeatherAlert) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setEnabled: (enabled: boolean) => void;
  setSensitivity: (sensitivity: number) => void;
};

const defaultWeather: RiskWeatherState = {
  condition: "clear",
  intensity: 0.2,
  windDirection: [1, 0, 0],
  windSpeed: 0.1,
  visibility: 1.0,
  turbulence: 0.05,
};

export const useWeatherStore = create<WeatherStoreState>((set) => ({
  weather: defaultWeather,
  forecast: null,
  alerts: [],
  dismissedAlerts: new Set(),
  enabled: true,
  sensitivity: 0.5,

  setWeather: (weather) =>
    set((state) => ({
      weather: { ...state.weather, ...weather },
    })),

  setCondition: (condition) =>
    set((state) => ({
      weather: { ...state.weather, condition },
    })),

  setForecast: (forecast) => set({ forecast }),

  addAlert: (alert) =>
    set((state) => {
      // Avoid duplicates
      if (state.alerts.some((a) => a.id === alert.id)) return state;
      return { alerts: [...state.alerts, alert] };
    }),

  dismissAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
      dismissedAlerts: new Set([...state.dismissedAlerts, alertId]),
    })),

  clearAlerts: () => set({ alerts: [], dismissedAlerts: new Set() }),

  setEnabled: (enabled) => set({ enabled }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
}));
