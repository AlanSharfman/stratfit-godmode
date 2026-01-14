export function getScenarioColor(scenario: string) {
    switch (scenario) {
      case "upside":
        return {
          glow: "rgba(0,255,180,0.6)",
          main: "#00ffb4",
        };
  
      case "downside":
        return {
          glow: "rgba(255,80,80,0.5)",
          main: "#ff4d4d",
        };
  
      case "stress":
        return {
          glow: "rgba(255,0,255,0.55)",
          main: "#ff00ff",
        };
  
      default:
        return {
          glow: "rgba(0,180,255,0.55)",
          main: "#00b4ff",
        };
    }
  }
  