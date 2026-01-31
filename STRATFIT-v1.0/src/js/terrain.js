import { getLiveSensors } from "./live-feed.js";

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("terrain-canvas");
  const tooltip = document.getElementById("tooltip");

  function updateSensorGrid(sensors) {
    const list = document.getElementById("sensor-list");
    if (list) {
      list.innerHTML = `
        <li>VIX: ${sensors.vix}</li>
        <li>Yield Curve Slope: ${sensors.yieldCurve}%</li>
        <li>Macro Drift: ${sensors.macroDrift}%</li>
        <li>Regime: ${sensors.regime}</li>
      `;
    }

    const alertBox = document.getElementById("terrain-alert");
    if (!alertBox) return;

    if (sensors.vix > 25 && sensors.macroDrift < -0.3) {
      alertBox.textContent = "⚠️ HIGH VOLATILITY + NEGATIVE MACRO DRIFT";
    } else if (sensors.regime === "Bear") {
      alertBox.textContent = "⚠️ Bear regime detected. Defensive posture recommended.";
    } else {
      alertBox.textContent = "";
    }
  }

  const sensors = await getLiveSensors();
  updateSensorGrid(sensors);

  const isMisaligned = (run, sensors) => {
    return run.strategy === "ACCUMULATE" && sensors.vix > 25 && sensors.macroDrift < -0.3;
  };

  let runs = [];
  try {
    const res = await fetch("/api/decision-history");
    runs = await res.json();
  } catch {
    runs = Array.from({ length: 20 }, (_, i) => ({
      runId: `SIM-${i + 1}`,
      alpha: +(Math.random() * 15).toFixed(2),
      volatility: +(Math.random() * 20).toFixed(2),
      strategy: ["ACCUMULATE", "NEUTRAL", "DEFENSIVE"][i % 3],
      user: "system",
      timestamp: new Date().toISOString(),
    }));
  }

  runs.forEach((run) => {
    const node = document.createElement("div");
    node.className = "terrain-node";

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const x = (Number(run.volatility) / 30) * w;
    const y = h - (Number(run.alpha) / 20) * h;

    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const color =
      run.strategy === "DEFENSIVE"
        ? "#E53935"
        : run.strategy === "ACCUMULATE"
          ? "#18D57F"
          : "#3DE0F5";

    node.style.backgroundColor = color;
    node.title = `${run.runId} | ${run.strategy}`;

    if (isMisaligned(run, sensors)) {
      node.style.border = "2px solid #FF5252";
      node.title += " | ⚠ Misaligned with current regime";
    }
    canvas.appendChild(node);

    node.addEventListener("mouseenter", () => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `
        <strong>${run.runId}</strong><br>
        Strategy: ${run.strategy}<br>
        Alpha: ${run.alpha}%<br>
        Volatility: ${run.volatility}%
      `;
      tooltip.style.left = `${x + 15}px`;
      tooltip.style.top = `${y - 10}px`;
    });

    node.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });

  // Optionally add background overlays for regime zones
  // e.g. stagflation zone = top-left, deflation zone = bottom-right
});


