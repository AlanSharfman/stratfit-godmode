import { getLiveSensors } from "./live-feed.js";

document.addEventListener("DOMContentLoaded", async () => {
  const sensors = await getLiveSensors();
  const exposure = await fetchJson("../data/portfolio-live.json");
  const guardrails = await fetchJson("../data/guardrails.json");

  renderSensors(sensors);
  renderExposureChart(exposure);
  renderGuardrails(guardrails);
  renderRebalanceSuggestion(exposure, guardrails);
});

async function fetchJson(relPath) {
  const url = new URL(relPath, import.meta.url);
  const res = await fetch(url);
  return await res.json();
}

function renderSensors(data) {
  const container = document.getElementById("sensors");
  container.innerHTML = `
    <p>📈 VIX: ${data.vix}</p>
    <p>🧭 Regime: ${data.regime}</p>
    <p>📉 Yield Curve: ${data.yieldCurve}</p>
    <p>📊 Inflation Drift: ${data.macroDrift}</p>
  `;
}

function renderExposureChart(data) {
  // Chart.js is loaded as a global (Chart) from CDN.
  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: Object.keys(data.weights),
      datasets: [
        {
          label: "Current Weight",
          data: Object.values(data.weights),
          backgroundColor: "#3DE0F5",
        },
      ],
    },
    options: { responsive: true },
  });
}

function renderGuardrails(flags) {
  const container = document.getElementById("guardrail-status");
  const breaches = Object.entries(flags).filter(([_, status]) => status === "BREACHED");

  if (breaches.length === 0) {
    container.innerHTML = `<p>✅ All guardrails within bounds.</p>`;
    return;
  }

  container.innerHTML = breaches.map(([rule]) => `<p>⚠️ ${rule} breached</p>`).join("");
}

function renderRebalanceSuggestion(exposure, flags) {
  const suggestion = [];

  if (flags.volatility === "BREACHED") suggestion.push("Reduce risk asset weights by 15%");
  if (flags.drift === "BREACHED") suggestion.push("Rebalance to strategic target");
  if (flags.regime_mismatch === "BREACHED") suggestion.push("Switch to Defensive strategy");

  const container = document.getElementById("rebalance-suggestion");
  container.innerHTML =
    suggestion.length > 0 ? suggestion.map((s) => `<p>🔁 ${s}</p>`).join("") : `<p>✅ No rebalancing needed</p>`;
}


